const express = require('express');
const router = express.Router();
const { processMessage } = require('../services/languageEngine');
const { supabase } = require('../services/supabaseClient');
const BotRateLimiter = require('../services/botRateLimiter');
const CentralLogger = require('../services/centralLogger');

// /api/livechat/message
router.post('/message', async (req, res) => {
    const { text, user = "anon" } = req.body;
    const tenantId = req.tenant?.tenantId || req.tenant?.id; // Multi-tenant support

    // 1. Rate Limiting por Bot/Tenant
    const isAllowed = await BotRateLimiter.isAllowed(tenantId || user, 50, 60000);
    if (!isAllowed) {
        CentralLogger.warn('RateLimiter', `Bot quota exceeded for ${tenantId || user}`);
        return res.status(429).json({ error: "Rate limit exceeded" });
    }

    try {
        const ai = await processMessage(text); // processMessage is aliased to globalBrain

        const { error } = await supabase.from("messages").insert({
            user,
            text,
            translation: ai.translated,
            response: ai.response,
            tenant_id: tenantId // Aislamiento multi-tenant
        });

        if (error) {
            CentralLogger.error('LiveChat', 'DB Insert failed', error);
            return res.status(500).json(error);
        }

        CentralLogger.info('LiveChat', `Message processed for ${user}`);
        res.json(ai);
    } catch (e) {
        CentralLogger.error('LiveChat', 'Processing failed', { error: e.message });
        res.status(500).json({ error: e.message });
    }
});

// /api/livechat/conversations
router.get('/conversations', async (req, res) => {
    const tenantId = req.tenant?.tenantId || req.tenant?.id;

    try {
        let query = supabase.from("messages").select("*").order("created_at", { ascending: false });
        
        // Multi-tenant real: Filtrar por tenant si existe contexto
        if (tenantId && tenantId !== 'tenant_superadmin') {
            query = query.eq('tenant_id', tenantId);
        }

        const { data, error } = await query;

        if (error) throw error;
        res.json(data);
    } catch (e) {
        CentralLogger.error('LiveChat', 'Failed fetching conversations', { error: e.message });
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;

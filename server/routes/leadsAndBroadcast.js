const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');
const { clientConfigs } = require('../services/whatsappSaas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// --- HELPER: Resolve Instance Config ---
async function getInstanceConfig(instanceId, tenantId) {
    let config = clientConfigs.get(instanceId);
    if (!config) {
        const { data: session } = await supabase
            .from('whatsapp_sessions')
            .select('*')
            .eq('instance_id', instanceId)
            .eq('tenant_id', tenantId)
            .single();
        
        if (session) {
            config = {
                instanceId: session.instance_id,
                provider: session.provider || 'baileys',
                tenantId: session.tenant_id,
                metaAccessToken: session.meta_access_token,
                metaPhoneNumberId: session.meta_phone_number_id,
                dialogApiKey: session.dialog_api_key
            };
        }
    }
    return config;
}

// --- GET /api/saas/bots ---
router.get('/bots', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { data: sessions, error } = await supabase
            .from('whatsapp_sessions')
            .select('instance_id, company_name, status, provider')
            .eq('tenant_id', tenantId);

        if (error) throw error;
        res.json({ bots: sessions.map(s => ({ id: s.instance_id, name: s.company_name, status: s.status, provider: s.provider })) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET /api/saas/leads/tags ---
router.get('/leads/tags', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        // Obtenemos etiquetas únicas de la tabla leads
        const { data, error } = await supabase
            .from('leads')
            .select('tags')
            .eq('tenant_id', tenantId);

        if (error) throw error;
        
        const allTags = new Set();
        data.forEach(item => {
            if (Array.isArray(item.tags)) {
                item.tags.forEach(t => allTags.add(t));
            }
        });

        res.json({ tags: Array.from(allTags) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET /api/saas/leads ---
router.get('/leads', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { bot, temp, tag, from, to } = req.query;

        let query = supabase
            .from('leads')
            .select('*')
            .eq('tenant_id', tenantId);

        if (bot && bot !== 'all') query = query.eq('instance_id', bot);
        if (temp && temp !== 'all') query = query.eq('temperature', temp);
        if (tag && tag !== 'all') query = query.contains('tags', [tag]);
        if (from) query = query.gte('created_at', from);
        if (to) query = query.lte('created_at', to);

        const { data, error } = await query.order('created_at', { ascending: false }).limit(500);

        if (error) throw error;

        // Formatear para el frontend
        const leads = data.map(l => ({
            phone: l.phone || (l.remote_jid ? l.remote_jid.split('@')[0] : ''),
            name: l.name,
            bot: l.instance_id, // Podríamos hidratar con el nombre si fuera necesario
            temp: l.temperature || 'COLD',
            tag: l.tags ? l.tags[0] : null
        }));

        res.json({ leads });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- IN-MEMORY JOBS ---
const broadcastJobs = new Map();

// --- POST /api/saas/broadcast ---
router.post('/broadcast', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { instanceId, recipients, message, mediaUrl, mediaType } = req.body;

        if (!instanceId || !recipients || !Array.isArray(recipients) || !message) {
            return res.status(400).json({ error: 'Faltan parámetros requeridos' });
        }

        const config = await getInstanceConfig(instanceId, tenantId);
        if (!config) return res.status(404).json({ error: 'Bot no encontrado' });

        const campaignId = `bc_${Date.now()}`;
        const job = {
            id: campaignId,
            total: recipients.length,
            sent: 0,
            failed: 0,
            status: 'running',
            nextDelayMs: null
        };
        broadcastJobs.set(campaignId, job);

        // Respondemos de inmediato
        res.json({ success: true, campaignId, message: 'Campaña iniciada' });

        // Procesamiento en segundo plano
        (async () => {
            const { getAdapter } = require('../services/adapterFactory');
            
            for (let i = 0; i < recipients.length; i++) {
                const lead = recipients[i];
                const rawPhone = String(lead.phone).replace(/\D/g, '');
                
                // Reemplazo de variables
                let personalizedMsg = message
                    .replace(/{nombre}/gi, lead.name || 'cliente')
                    .replace(/{telefono}/gi, lead.phone || '')
                    .replace(/{bot}/gi, config.companyName || 'nuestro bot')
                    .replace(/{etiqueta}/gi, lead.tag || '')
                    .replace(/{temperatura}/gi, lead.temp || '');

                try {
                    const adapter = getAdapter(config, global.whatsappSessions);
                    if (!adapter) throw new Error('No se pudo inicializar el conector');

                    await adapter.sendMessage(rawPhone, personalizedMsg, { mediaUrl, mediaType });
                    job.sent++;
                } catch (err) {
                    console.error(`Error enviando a ${rawPhone}:`, err.message);
                    job.failed++;
                }

                if (i < recipients.length - 1) {
                    const delay = 35000 + Math.floor(Math.random() * 25000);
                    job.nextDelayMs = delay;
                    await new Promise(r => setTimeout(r, delay));
                }
            }
            job.status = 'finished';
            job.nextDelayMs = null;
        })();

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- GET /api/saas/broadcast/status/:id ---
router.get('/broadcast/status/:id', (req, res) => {
    const job = broadcastJobs.get(req.params.id);
    if (!job) return res.status(404).json({ error: 'Campaña no encontrada' });
    
    const progress = Math.round(((job.sent + job.failed) / job.total) * 100);
    res.json({ ...job, progress });
});

module.exports = router;

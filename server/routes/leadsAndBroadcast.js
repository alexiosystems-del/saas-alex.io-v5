const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { supabase } = require('../services/supabaseClient');
const { clientConfigs } = require('../services/whatsappSaas');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// --- HELPER: Resolve Instance Config ---
async function getInstanceConfig(instanceId, tenantId) {
    let config = clientConfigs.get(instanceId);
    if (!config) {
        // Hydrate from bot_configs
        const { data: session } = await supabase
            .from('bot_configs')
            .select(`
                *,
                bots (name, prompt, tone, industry, objective)
            `)
            .eq('instance_id', instanceId)
            .single();
        
        if (session) {
            config = {
                instanceId: session.instance_id,
                provider: session.channel || 'baileys',
                tenantId: tenantId, // bot_configs doesn't have tenant_id in some versions, using param
                companyName: session.bots?.name || 'ALEX IO Agent',
                settings: session.settings || {}
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
            .select('*')
            .eq('tenant_id', tenantId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        res.json({ bots: (sessions || []).map(s => ({ 
            id: s.instance_id, 
            instance_id: s.instance_id,
            name: s.company_name, 
            status: s.status, 
            provider: s.provider,
            voice_enabled: s.voice_enabled,
            industry: s.industry,
            objective: s.objective,
            total_messages: s.total_messages || 0,
            company_name: s.company_name,
            customPrompt: s.custom_prompt,
            target_language: s.target_language
        })) });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- POST /api/saas/bots ---
router.post('/bots', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { name, prompt, tone, industry, objective, voice_enabled, channel, identity, strategy, target_language } = req.body;
        const instanceId = 'v5_' + crypto.randomUUID();

        // Insert into whatsapp_sessions
        const { data: session, error: sessErr } = await supabase
            .from('whatsapp_sessions')
            .insert({
                session_id: instanceId,
                instance_id: instanceId,
                key_type: 'metadata',
                key_id: 'status',
                value: '{}',
                tenant_id: tenantId,
                company_name: name || 'Nuevo Bot',
                provider: channel || 'baileys',
                status: 'pending',
                voice_enabled: voice_enabled || false,
                target_language: target_language || 'es',
                meta_access_token: req.body.accessToken,
                meta_phone_number_id: req.body.metaPhoneNumberId,
                dialog_api_key: req.body.d360ApiKey,
                custom_prompt: prompt || null,
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (sessErr) throw sessErr;

        // Insert into bot_configs (best-effort)
        try {
            await supabase.from('bot_configs').insert({
                instance_id: instanceId,
                tenant_id: tenantId,
                name: name || 'Nuevo Bot',
                custom_prompt: prompt,
                voice_enabled: voice_enabled || false,
                voice_provider: req.body.voice || 'nova',
                provider: channel || 'baileys',
                discord_token: req.body.discordToken,
                tiktok_token: req.body.tiktokAccessToken,
                tiktok_seller_id: req.body.tiktokSellerId,
                manychat_token: req.body.manychatToken
            });
        } catch (cfgErr) {
            console.warn('[BOTS] bot_configs insert failed (non-critical):', cfgErr.message);
        }

        // Insert into bots table (best-effort)
        try {
            await supabase.from('bots').insert({
                name: name || 'Nuevo Bot',
                prompt: prompt,
                tone: tone,
                industry: industry,
                objective: objective,
                voice_enabled: voice_enabled || false,
                tenant_id: tenantId
            });
        } catch (botErr) {
            console.warn('[BOTS] bots insert failed (non-critical):', botErr.message);
        }

        res.json({ 
            success: true, 
            bot: { 
                id: instanceId, 
                instance_id: instanceId, 
                name: name || 'Nuevo Bot', 
                status: 'pending' 
            } 
        });
    } catch (err) {
        console.error('❌ [BOTS_CREATE_FATAL] Error detailed:', {
            message: err.message,
            code: err.code,
            details: err.details,
            hint: err.hint,
            stack: err.stack
        });
        res.status(500).json({ 
            error: err.message,
            code: err.code,
            details: err.details 
        });
    }
});

// --- PUT /api/saas/bots/:id ---
router.put('/bots/:id', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const botId = req.params.id;
        const updates = req.body;

        // Update whatsapp_sessions
        const sessionUpdate = {};
        if (updates.name) sessionUpdate.company_name = updates.name;
        if (updates.provider) sessionUpdate.provider = updates.provider;
            if (updates.voice_enabled !== undefined) sessionUpdate.voice_enabled = updates.voice_enabled;
            if (updates.accessToken) sessionUpdate.meta_access_token = updates.accessToken;
            if (updates.metaPhoneNumberId) sessionUpdate.meta_phone_number_id = updates.metaPhoneNumberId;
            // Handle both camelCase and snake_case for keys
        const d360Key = updates.d360ApiKey || updates.d360_api_key;
        if (d360Key) sessionUpdate.dialog_api_key = d360Key;
        
        const metaToken = updates.meta_access_token || updates.access_token || updates.accessToken;
        if (metaToken) sessionUpdate.meta_access_token = metaToken;

        const metaPhoneId = updates.meta_phone_number_id || updates.phone_number_id || updates.metaPhoneNumberId;
        if (metaPhoneId) sessionUpdate.meta_phone_number_id = metaPhoneId;
            if (updates.target_language) sessionUpdate.target_language = updates.target_language;
            if (updates.prompt !== undefined) sessionUpdate.custom_prompt = updates.prompt;

            console.log(`[BOTS] Attempting to update session ${botId} for tenant ${tenantId}`, sessionUpdate);

            if (Object.keys(sessionUpdate).length > 0) {
                const { error } = await supabase
                    .from('whatsapp_sessions')
                    .update(sessionUpdate)
                    .eq('instance_id', botId)
                    .eq('tenant_id', tenantId);
                if (error) {
                    console.error(`[BOTS] Supabase session update error:`, error);
                    throw error;
                }
                console.log(`[BOTS] Session ${botId} updated successfully.`);
            }

        // Update bot_configs (best-effort)
        try {
            const configUpdate = {};
            if (updates.name) configUpdate.name = updates.name;
            if (updates.prompt !== undefined) configUpdate.custom_prompt = updates.prompt;
            if (updates.voice_enabled !== undefined) configUpdate.voice_enabled = updates.voice_enabled;
            if (updates.voice) configUpdate.voice_provider = updates.voice;
            if (updates.provider) configUpdate.provider = updates.provider;
            if (updates.discordToken) configUpdate.discord_token = updates.discordToken;
            if (updates.tiktokAccessToken) configUpdate.tiktok_token = updates.tiktokAccessToken;
            if (updates.tiktokSellerId) configUpdate.tiktok_seller_id = updates.tiktokSellerId;
            if (updates.manychatToken) configUpdate.manychat_token = updates.manychatToken;
            
            if (Object.keys(configUpdate).length > 0) {
                const { error: cfgErr } = await supabase
                    .from('bot_configs')
                    .update(configUpdate)
                    .eq('instance_id', botId);
                if (cfgErr) console.warn('[BOTS] bot_configs update failed:', cfgErr.message);
                else console.log(`[BOTS] bot_configs ${botId} updated successfully.`);
            }
        } catch (e) {
            console.warn('[BOTS] bot_configs update failed:', e.message);
        }

        // 🔱 Real-time Memory Sync (SRE-style)
        const currentLive = clientConfigs.get(botId);
        if (currentLive) {
            clientConfigs.set(botId, {
                ...currentLive,
                companyName: updates.name || currentLive.companyName,
                customPrompt: updates.prompt || currentLive.customPrompt,
                voiceEnabled: updates.voice_enabled !== undefined ? updates.voice_enabled : currentLive.voiceEnabled,
                voice: updates.voice || currentLive.voice,
                provider: updates.provider || currentLive.provider
            });
            console.log(`⚡ [LIVE SYNC] Configuración actualizada en memoria para ${botId}`);
        }

        res.json({ success: true });
    } catch (err) {
        console.error('[BOTS] Update error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- DELETE /api/saas/bots/:id ---
router.delete('/bots/:id', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const botId = req.params.id;

        const { error } = await supabase
            .from('whatsapp_sessions')
            .delete()
            .eq('instance_id', botId)
            .eq('tenant_id', tenantId);

        if (error) throw error;

        // Cleanup bot_configs (best-effort)
        try {
            await supabase.from('bot_configs').delete().eq('instance_id', botId);
        } catch (e) { /* non-critical */ }

        res.json({ success: true });
    } catch (err) {
        console.error('[BOTS] Delete error:', err.message);
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
                    const { whatsappSockets } = require('../services/whatsappSaas');
                    const adapter = getAdapter(config, whatsappSockets);
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
    
    res.json({
        ...job,
        progress: job.total > 0 ? Math.round((job.sent + job.failed) / job.total * 100) : 0
    });
});

// --- POST /api/saas/leads/bulk (Import External Base) ---
router.post('/leads/bulk', async (req, res) => {
    try {
        const tenantId = req.tenant.id;
        const { leads } = req.body;

        if (!Array.isArray(leads) || leads.length === 0) {
            return res.status(400).json({ error: 'Formato de leads inválido' });
        }

        // Sanitizar y preparar para inserción
        const toInsert = leads.map(l => ({
            tenant_id: tenantId,
            phone: String(l.phone).replace(/\D/g, ''),
            name: l.name || 'Importado',
            temperature: l.temperature || 'COLD',
            tags: l.tags || ['Importado_Externo'],
            instance_id: l.instanceId || null,
            created_at: new Date().toISOString()
        })).filter(l => l.phone.length >= 8);

        const { data, error } = await supabase
            .from('leads')
            .upsert(toInsert, { onConflict: 'tenant_id,phone' });

        if (error) throw error;

        res.json({ success: true, count: toInsert.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

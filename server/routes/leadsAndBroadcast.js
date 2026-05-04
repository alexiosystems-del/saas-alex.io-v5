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
        const { data: configs, error } = await supabase
            .from('bot_configs')
            .select(`
                instance_id,
                status,
                channel,
                bots (name)
            `);

        if (error) throw error;
        res.json({ 
            bots: configs.map(c => ({ 
                id: c.instance_id, 
                name: c.bots?.name || 'Unnamed Bot', 
                status: c.status, 
                provider: c.channel 
            })) 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// --- POST /api/saas/bots ---
router.post('/bots', async (req, res) => {
    try {
        const { name, prompt, tone, industry, objective, voice_enabled, channel, identity, strategy } = req.body;

        if (!name || !prompt) {
            return res.status(400).json({ error: 'Missing name or prompt' });
        }

        // 1. Create the Bot base
        const { data: bot, error: botError } = await supabase
            .from('bots')
            .insert([{
                name: name.trim(),
                prompt: prompt.trim(),
                tone: tone || 'professional',
                industry: industry || 'general',
                objective: objective || 'assist',
                voice_enabled: !!voice_enabled,
                status: 'active'
            }])
            .select()
            .single();

        if (botError) throw botError;

        // 2. Create the Bot Config (Defensive)
        const { error: configError } = await supabase.from('bot_configs').insert([{
            bot_id: bot.id,
            instance_id: `v5_${bot.id.split('-')[0]}_${Date.now().toString().slice(-4)}`,
            channel: channel || 'baileys',
            status: 'disconnected',
            settings: {
                identity: identity || name,
                strategy: strategy || 'undefined',
                voice_enabled: !!voice_enabled,
                tone: tone || 'professional'
            }
        }]);

        if (configError) {
            console.error('⚠️ Config creation error:', configError.message);
            // Non-blocking for the bot creation itself
        }

        res.json({ success: true, bot });
    } catch (err) {
        console.error('❌ Bot creation failed:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// --- DELETE /api/saas/bots/:id ---
router.delete('/bots/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { error } = await supabase.from('bots').delete().eq('id', id);
        if (error) throw error;
        res.json({ success: true });
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

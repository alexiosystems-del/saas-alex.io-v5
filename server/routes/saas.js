const express = require('express');
const router = express.Router();
const { supabaseAdmin: supabase } = require('../services/supabaseClient');

// ============================================
// GET ALL BOTS
// ============================================
router.get('/bots', async (req, res) => {
  try {
    console.log('📥 [GET BOTS] Request received');

    const { data, error } = await supabase
      .from('bots')
      .select(`
        *,
        bot_configs (*)
      `)
      .eq('tenant_id', req.tenant.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [GET BOTS] Supabase error:', error);
      throw error;
    }

    console.log(`✅ [GET BOTS] Found ${data?.length || 0} bots`);
    res.json(data || []);

  } catch (error) {
    console.error('💥 [GET BOTS] Fatal error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.details || 'Unknown error'
    });
  }
});

// ============================================
// CREATE BOT
// ============================================
router.post('/bots', async (req, res) => {
  try {
    const { 
      name, prompt, tone, industry, objective, 
      voice_enabled, translation_enabled, channel, 
      identity, strategy, tenant_id
    } = req.body;

    if (!name?.trim() || !prompt?.trim()) {
      return res.status(400).json({ 
        error: 'Missing required fields: name and prompt are required' 
      });
    }

    const tenantId = req.tenant.id;
    const { v4: uuidv4 } = require('uuid');
    const instanceId = uuidv4();
    
    const botData = {
      instance_id: instanceId,
      tenant_id: tenantId,
      name: name.trim(),
      prompt: prompt.trim(),
      tone: tone || 'professional',
      industry: industry || 'general',
      objective: objective || 'assist customers',
      voice_enabled: voice_enabled === true || voice_enabled === 'true',
      translation_enabled: translation_enabled === true || translation_enabled === 'true',
      channel: channel || 'whatsapp',
      status: 'active',
      created_at: new Date().toISOString()
    };

    console.log('[BOTS] Attempting to create bot:', { instanceId, tenantId, name: name.trim() });

    let { data: bot, error: botError } = await supabase
      .from('bots')
      .insert([{ ...botData, provider: channel || 'whatsapp' }])
      .select()
      .single();

    if (botError) {
      if (botError.message.includes('column') && (botError.message.includes('does not exist') || botError.message.includes('Could not find'))) {
        console.warn('[BOTS] Schema mismatch detected. Falling back to minimal insert...');
        const minimalData = {
          tenant_id: botData.tenant_id,
          name: botData.name,
          prompt: botData.prompt,
          status: 'active',
          created_at: botData.created_at
        };
        const { data: bot2, error: botError2 } = await supabase
          .from('bots')
          .insert([minimalData])
          .select()
          .single();
        
        if (botError2) {
          console.error('[BOTS] Minimal insert also failed:', botError2.message);
          return res.status(500).json({ error: 'Failed to create bot (schema error)', detail: botError2.message });
        }
        bot = bot2;
      } else {
        console.error('[BOTS] Create error:', botError.message);
        return res.status(500).json({ error: 'Failed to create bot', detail: botError.message });
      }
    }

    console.log('[BOTS] ✅ Bot created successfully:', bot.id);

    // Ensure we return a bot object that includes instance_id for the frontend
    const finalBot = { ...bot, instance_id: bot.instance_id || instanceId };

    // Optional: insert bot_configs (non-fatal)
    try {
      const configData = {
        bot_id: bot.id,
        tenant_id: tenantId,
        channel: channel || 'whatsapp',
        voice_model: (voice_enabled === true || voice_enabled === 'true') ? 'MINIMAX-ZH' : null,
        translation_enabled: translation_enabled === true || translation_enabled === 'true',
        config: { 
          identity: identity || name.trim(), 
          strategy: strategy || 'default'
        }
      };

      // Try with instance_id first
      const { error: configError } = await supabase
        .from('bot_configs')
        .insert([{ ...configData, instance_id: instanceId }]);

      if (configError) {
        if (configError.message.includes('column') && configError.message.includes('does not exist')) {
            // Fallback for bot_configs
            await supabase.from('bot_configs').insert([configData]);
        } else {
            console.warn('[BOT_CONFIG] Insert warning:', configError.message);
        }
      }
    } catch (configErr) {
      console.warn('[BOT_CONFIG] Exception (non-fatal):', configErr.message);
    }

    return res.status(201).json({ success: true, bot: finalBot });

  } catch (error) {
    console.error('[BOTS] Unexpected fatal error:', error.message);
    return res.status(500).json({ error: 'Internal server error', detail: error.message });
  }
});

// ============================================
// GET LEADS
// ============================================
router.get('/leads', async (req, res) => {
  try {
    const { temp, status } = req.query;
    let query = supabase.from('leads').select('*, lead_tags(tag)');
    if (temp && temp !== 'all') query = query.eq('temperature', temp.toUpperCase());
    if (status && status !== 'all') query = query.eq('status', status.toUpperCase());
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET LEAD TAGS
// ============================================
router.get('/leads/tags', async (req, res) => {
  try {
    const { data, error } = await supabase.from('lead_tags').select('tag');
    if (error) throw error;
    const uniqueTags = [...new Set(data.map(t => t.tag))];
    res.json(uniqueTags);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// MEMORIES
// ============================================
router.get('/api/memories', async (req, res) => {
  try {
    const { customer_id } = req.query;
    const { data, error } = await supabase
      .from('customer_memories')
      .select('*')
      .eq('customer_id', customer_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/memories', async (req, res) => {
  try {
    const { customer_id, memory, bot_id } = req.body;
    const { data, error } = await supabase
      .from('customer_memories')
      .insert([{ customer_id, memory, bot_id }])
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// DEBUG ENDPOINT
// ============================================
router.get('/api/debug/system', async (req, res) => {
  try {
    const { data: bots } = await supabase.from('bots').select('*');
    const { data: configs } = await supabase.from('bot_configs').select('*');
    const { data: leads } = await supabase.from('leads').select('*');

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: {
        bots: bots?.length || 0,
        configs: configs?.length || 0,
        leads: leads?.length || 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// TRANSLATE MESSAGE (On-demand for Live Chat)
// ============================================
router.post('/translate', async (req, res) => {
  try {
    const { text, targetLang = 'es' } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const alexBrain = require('../services/alexBrain');
    const result = await alexBrain.translateIncomingMessage(text, targetLang);

    res.json({
      original: result.original,
      translated: result.translated,
      model: result.model,
      detectedLang: result.detectedLang || null
    });
  } catch (error) {
    console.error('[Translate] Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// UPDATE BOT (Consolidated & Hardened)
// ============================================
router.put('/bots/:id', async (req, res) => {
  try {
    const tenantId = req.tenant.id;
    const botId = req.params.id;
    const updates = req.body;

    console.log(`[BOTS] 🔄 Updating bot ${botId} for tenant ${tenantId}`);

    // 1. Update 'bots' table (Source of truth for profile)
    const botUpdate = {};
    if (updates.name) botUpdate.name = updates.name;
    if (updates.prompt) botUpdate.prompt = updates.prompt;
    if (updates.industry) botUpdate.industry = updates.industry;
    if (updates.objective) botUpdate.objective = updates.objective;
    if (updates.tone) botUpdate.tone = updates.tone;
    if (updates.status) botUpdate.status = updates.status;
    if (updates.target_language) botUpdate.target_language = updates.target_language;

    if (Object.keys(botUpdate).length > 0) {
        const { error: botErr } = await supabase
            .from('bots')
            .update(botUpdate)
            .eq('instance_id', botId)
            .eq('tenant_id', tenantId);
        if (botErr) console.warn('[BOTS] bots table update failed:', botErr.message);
    }

    // 2. Update 'bot_configs' table
    const configUpdate = {};
    if (updates.prompt) configUpdate.custom_prompt = updates.prompt;
    if (updates.voice_enabled !== undefined) configUpdate.voice_enabled = updates.voice_enabled;
    if (updates.voice) configUpdate.voice_provider = updates.voice;
    if (updates.provider) configUpdate.provider = updates.provider;
    if (updates.target_language) configUpdate.target_language = updates.target_language;
    if (updates.discordToken) configUpdate.discord_token = updates.discordToken;
    if (updates.tiktokAccessToken) configUpdate.tiktok_token = updates.tiktokAccessToken;
    if (updates.tiktokSellerId) configUpdate.tiktok_seller_id = updates.tiktokSellerId;
    if (updates.manychatToken) configUpdate.manychat_token = updates.manychatToken;

    if (Object.keys(configUpdate).length > 0) {
        let payload = { ...configUpdate };
        for (let i = 0; i < 3; i++) {
            const { error: cfgErr } = await supabase.from('bot_configs').update(payload).eq('instance_id', botId);
            if (!cfgErr) break;
            const missing = cfgErr.message?.match(/column "([^"]+)"/i)?.[1] || cfgErr.message?.match(/Could not find the '([^']+)' column/i)?.[1];
            if (missing && payload[missing] !== undefined) {
                delete payload[missing];
            } else break;
        }
    }

    // 3. Update 'whatsapp_sessions' (Connection state)
    const sessionUpdate = {};
    if (updates.name) sessionUpdate.company_name = updates.name;
    if (updates.provider) sessionUpdate.provider = updates.provider;
    if (updates.prompt) sessionUpdate.custom_prompt = updates.prompt;
    if (updates.target_language) sessionUpdate.target_language = updates.target_language;

    if (Object.keys(sessionUpdate).length > 0) {
        let payload = { ...sessionUpdate };
        for (let i = 0; i < 3; i++) {
            const { error: sessErr } = await supabase.from('whatsapp_sessions').update(payload).eq('instance_id', botId).eq('tenant_id', tenantId);
            if (!sessErr) break;
            const missing = sessErr.message?.match(/column "([^"]+)"/i)?.[1] || sessErr.message?.match(/Could not find the '([^']+)' column/i)?.[1];
            if (missing && payload[missing] !== undefined) {
                delete payload[missing];
            } else break;
        }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('[BOTS] Fatal update error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

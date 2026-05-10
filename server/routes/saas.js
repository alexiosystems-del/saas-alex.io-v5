const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');

// ============================================
// GET ALL BOTS
// ============================================
router.get('/api/saas/bots', async (req, res) => {
  try {
    console.log('📥 [GET BOTS] Request received');

    const { data, error } = await supabase
      .from('bots')
      .select(`
        *,
        bot_configs (*)
      `)
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
router.post('/api/saas/bots', async (req, res) => {
  try {
    console.log('📥 [CREATE BOT] Request body:', JSON.stringify(req.body, null, 2));

    const { 
      name, 
      prompt, 
      tone, 
      industry, 
      objective, 
      voice_enabled, 
      translation_enabled,
      channel,
      identity,
      strategy
    } = req.body;

    if (!name || !prompt) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['name', 'prompt']
      });
    }

    const botData = {
      name: name.trim(),
      prompt: prompt.trim(),
      tone: tone || 'professional',
      industry: industry || 'general',
      objective: objective || 'assist customers',
      voice_enabled: voice_enabled === true || voice_enabled === 'true',
      translation_enabled: translation_enabled === true || translation_enabled === 'true',
      status: 'active'
    };

    const { data: bot, error: botError } = await supabase
      .from('bots')
      .insert([botData])
      .select()
      .single();

    if (botError) throw botError;

    const configData = {
      bot_id: bot.id,
      channel: channel || 'whatsapp',
      voice_model: voice_enabled ? 'MINIMAX-ZH' : null,
      translation_enabled: translation_enabled === true,
      config: {
        identity: identity || name,
        strategy: strategy || 'undefined'
      }
    };

    const { error: configError } = await supabase
      .from('bot_configs')
      .insert([configData]);

    if (configError) console.error('⚠️ [CREATE BOT] Config error:', configError);

    res.json({ success: true, bot, message: 'Bot creado exitosamente' });

  } catch (error) {
    console.error('💥 [CREATE BOT] Fatal error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// GET LEADS
// ============================================
router.get('/api/saas/leads', async (req, res) => {
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
router.get('/api/saas/leads/tags', async (req, res) => {
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
router.post('/api/saas/translate', async (req, res) => {
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

module.exports = router;

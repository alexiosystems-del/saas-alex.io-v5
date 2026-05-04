const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');

// --- ALEX IO — Enterprise SaaS Routes (Phase 6/GOLD) ---

// CREATE BOT
router.post('/api/saas/bots', async (req, res) => {
  try {
    console.log('📥 [BOT CREATE] Request body:', JSON.stringify(req.body, null, 2));

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

    // Validación
    if (!name || !prompt) {
      return res.status(400).json({ 
        error: 'Missing required fields: name, prompt' 
      });
    }

    // Insert bot
    const botData = {
      name: name.trim(),
      prompt: prompt.trim(),
      tone: tone || 'professional',
      industry: industry || 'general',
      objective: objective || 'assist customers',
      voice_enabled: voice_enabled === true,
      translation_enabled: translation_enabled === true,
      status: 'active'
    };

    console.log('💾 [BOT CREATE] Inserting:', botData);

    const { data: bot, error: botError } = await supabase
      .from('bots')
      .insert([botData])
      .select()
      .single();

    if (botError) {
      console.error('❌ [BOT CREATE] Database error:', botError);
      throw botError;
    }

    console.log('✅ [BOT CREATE] Bot created:', bot.id);

    // Insert bot config
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

    if (configError) {
      console.error('⚠️ [BOT CONFIG] Error:', configError);
    }

    console.log('✅ [BOT CREATE] Config created for bot:', bot.id);

    res.json({ 
      success: true, 
      bot,
      message: 'Bot creado exitosamente'
    });

  } catch (error) {
    console.error('💥 [BOT CREATE] Fatal error:', error);
    res.status(500).json({ 
      error: error.message,
      details: error.details || error.hint || 'Unknown error'
    });
  }
});

// GET ALL BOTS
router.get('/api/saas/bots', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('bots')
      .select('*, bot_configs(*)')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);

  } catch (error) {
    console.error('[API] Bots fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// DEBUG ENDPOINT
router.get('/api/debug/bots', async (req, res) => {
  try {
    const { data: bots } = await supabase.from('bots').select('*');
    const { data: configs } = await supabase.from('bot_configs').select('*');
    
    res.json({
      bots: bots || [],
      configs: configs || [],
      count: bots?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// FORCE CREATE ENDPOINT
router.post('/api/saas/bots/force', async (req, res) => {
  try {
    const { data: bot, error } = await supabase
      .from('bots')
      .insert([{
        name: 'Gabriel Oro Puro',
        prompt: `Eres un asistente experto en Bienes Raíces. NEGOCIO: Gabriel Oro Puro. CLIENTE IDEAL: para todos productos. OBJETIVO: Cerrar Ventas REGLAS: Responde claro y corto (máx 50 palabras). - Prioriza cerrar la atención del usuario. - Usa lenguaje natural y empático. - Si no sabes la respuesta, deriva a un humano. - No inventes datos técnicos o precios no mencionados.`,
        tone: 'professional',
        industry: 'Bienes Raíces',
        objective: 'Cerrar Ventas',
        voice_enabled: false,
        translation_enabled: false,
        status: 'active'
      }])
      .select()
      .single();

    if (error) throw error;

    await supabase.from('bot_configs').insert([{
      bot_id: bot.id,
      channel: 'whatsapp'
    }]);

    res.json({ success: true, bot });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET LEADS
router.get('/api/saas/leads', async (req, res) => {
  try {
    const { temp, status } = req.query;

    let query = supabase
      .from('leads')
      .select('*, lead_tags(tag)');

    if (temp && temp !== 'all') query = query.eq('temperature', temp.toUpperCase());
    if (status && status !== 'all') query = query.eq('status', status.toUpperCase());

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data || []);

  } catch (error) {
    console.error('[API] Leads fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET LEAD TAGS
router.get('/api/saas/leads/tags', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('lead_tags')
      .select('tag')
      .order('tag');

    if (error) throw error;

    const uniqueTags = [...new Set(data.map(t => t.tag))];
    res.json(uniqueTags);

  } catch (error) {
    console.error('[API] Tags fetch error:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET/POST MEMORIES
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

module.exports = router;

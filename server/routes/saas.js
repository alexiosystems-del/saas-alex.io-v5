const express = require('express');
const router = express.Router();
const { supabase } = require('../services/supabaseClient');

// --- ALEX IO — Enterprise SaaS Routes (Phase 6/GOLD) ---

// CREATE BOT
router.post('/api/saas/bots', async (req, res) => {
  try {
    const { name, prompt, tone, industry, objective, voice_enabled, translation_enabled } = req.body;

    // Insert bot
    const { data: bot, error: botError } = await supabase
      .from('bots')
      .insert([{
        name: name || 'Untitled Bot',
        prompt: prompt || 'You are a helpful assistant.',
        tone: tone || 'professional',
        industry: industry || 'general',
        objective: objective || 'assist customers',
        voice_enabled: voice_enabled || false,
        translation_enabled: translation_enabled || false,
        status: 'active'
      }])
      .select()
      .single();

    if (botError) throw botError;

    // Insert bot config
    const { error: configError } = await supabase
      .from('bot_configs')
      .insert([{
        bot_id: bot.id,
        channel: 'whatsapp',
        voice_model: 'MINIMAX-ZH',
        translation_enabled: translation_enabled || false
      }]);

    if (configError) console.error('Config insert warning:', configError);

    res.json({ success: true, bot });

  } catch (error) {
    console.error('[API] Bot creation error:', error);
    res.status(500).json({ error: error.message });
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

    // Return unique tags
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
    console.error('[API] Memories fetch error:', error);
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
    console.error('[API] Memory save error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

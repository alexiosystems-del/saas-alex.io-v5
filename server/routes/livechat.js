const express = require('express');
const router = express.Router();
const { processMessage } = require('../services/languageEngine');
const { supabase } = require('../services/supabaseClient');

// /api/livechat/message
router.post('/message', async (req, res) => {
    const { text, user } = req.body;

    try {
        const ai = await processMessage(text);

        await supabase.from("messages").insert({
            user: user || 'Anonymous',
            text: text,
            translation: ai.lang,
            response: ai.response
        });

        res.json(ai);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

// /api/livechat/conversations
router.get('/conversations', async (req, res) => {
    try {
        const { data, error } = await supabase.from("messages")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

module.exports = router;

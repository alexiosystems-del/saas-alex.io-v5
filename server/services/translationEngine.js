/**
 * TRANSLATION ENGINE (Real implementation via GPT-4o-mini)
 */
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function detectLang(text) {
    if (!text || text.length < 3) return 'es';
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "Identify the language of the following text. Return ONLY the ISO 639-1 code (e.g., 'es', 'en', 'pt')." },
                { role: "user", content: text }
            ],
            max_tokens: 5,
            temperature: 0
        });
        return response.choices[0].message.content.trim().toLowerCase().slice(0, 2);
    } catch (err) {
        console.error('⚠️ [LangDetect] Error:', err.message);
        return 'es';
    }
}

async function translate(text, targetLang) {
    if (!text) return text;
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: `You are a professional translator. Translate the user input to ${targetLang}. Maintain the tone and nuances. Output ONLY the translated text.` },
                { role: "user", content: text }
            ],
            temperature: 0.3
        });
        return response.choices[0].message.content.trim();
    } catch (err) {
        console.error('⚠️ [Translate] Error:', err.message);
        return text;
    }
}

module.exports = { detectLang, translate };

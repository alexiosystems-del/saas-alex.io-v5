/**
 * TRANSLATION ENGINE (Mock implementation)
 */

async function detectLang(text) {
    // Basic mock: return 'es' by default
    return 'es';
}

async function translate(text, targetLang) {
    // Basic mock: return text with a prefix to indicate translation
    if (targetLang === 'en') return `[EN] ${text}`;
    if (targetLang === 'es') return `[ES] ${text}`;
    return text;
}

module.exports = { detectLang, translate };

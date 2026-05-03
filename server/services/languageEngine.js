const { getSupabase } = require('./supabaseClient'); // Asumiendo export de supabase
const aiRouter = require('./aiRouter');
const { translate, detectLang } = require('./translationEngine'); // Mocks o utils

const supported = ["es","en","fr","de","ar","hi","zh","ko"];

async function processMessage(message) {
  // 1. Detectar idioma original
  const lang = await detectLang(message);

  // 2. Traducir a Inglés (lenguaje base para IA) si no es inglés
  let toEN = message;
  if (lang !== 'en') {
      toEN = await translate(message, "en");
  }

  // 3. Procesar con AI Router (Failover inteligente)
  const ai = await aiRouter(toEN);

  // 4. Traducir respuesta al idioma original
  let final = ai;
  if (lang !== 'en') {
      final = await translate(ai, lang);
  }

  return {
    original: message,
    lang,
    response: final
  };
}

module.exports = { processMessage, supported };

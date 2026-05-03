const { getSupabase } = require('./supabaseClient'); 
const { aiRouter } = require('./aiRouter');
const { translate, detectLang } = require('./translationEngine'); 

const supported = ["es","en","fr","de","ar","hi","zh","ko"];

async function globalBrain(message) {
  const lang = await detectLang(message);

  const translated = await translate(message, "en");

  const ai = await aiRouter(translated);

  const final = await translate(ai, lang);

  return {
    original: message,
    translated,
    response: final,
    lang
  };
}

module.exports = { processMessage: globalBrain, globalBrain, supported };

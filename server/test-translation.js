require('dotenv').config();
console.log("DEBUG: GEMINI_API_KEY length:", process.env.GEMINI_API_KEY?.length || 0);
const alexBrain = require('./services/alexBrain');

async function testTranslation() {
    const text = "Olá! Para emigrar para a Europa, considere os seguintes passos: pesquisa sobre o país, requisitos de visto, validação de diplomas, e planos de trabalho.";
    console.log("Input:", text);
    try {
        const result = await alexBrain.translateIncomingMessage(text, 'es');
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Test failed catch:", e);
    }
}

testTranslation();

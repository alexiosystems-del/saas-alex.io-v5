const alexBrain = require('./services/alexBrain');
require('dotenv').config();

async function testMultilingual() {
    console.log('🧪 Starting Multilingual Verification Test...\n');

    const testCases = [
        { lang: 'English', message: 'Hello, what can you do for my business?' },
        { lang: 'French', message: 'Bonjour, que pouvez-vous faire pour mon entreprise ?' },
        { lang: 'Portuguese', message: 'Olá, o que você pode fazer pela minha empresa?' }
    ];

    const botConfig = {
        bot_name: 'ALEX IO Test',
        system_prompt: 'Eres ALEX IO, asistente virtual inteligente. REGLA: Sé conciso (máximo 50 palabras por respuesta). Responde siempre en el idioma del usuario.',
        tenantId: 'test-tenant',
        instanceId: 'test-instance'
    };

    for (const test of testCases) {
        console.log(`📡 Sending [${test.lang}]: "${test.message}"`);
        try {
            const result = await alexBrain.generateResponse({
                message: test.message,
                history: [],
                botConfig: botConfig,
                isAudio: false
            });
            console.log(`🤖 Response [${test.lang}]: "${result.text}"`);
            console.log(`📊 Model used: ${result.trace.model}\n`);
        } catch (err) {
            console.error(`❌ Error in ${test.lang} test:`, err.message);
        }
    }

    console.log('✅ Multilingual Verification Finished.');
}

testMultilingual();

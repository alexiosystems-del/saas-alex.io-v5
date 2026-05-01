/**
 * smoke_test_webhooks.js
 * Verifies that the multi-channel webhook router correctly processes requests.
 */
const { createStandardizedMessage, handleIncomingMessage } = require('./server/services/messageRouter');

async function testDiscordFlow() {
    console.log('🧪 Testing Discord Webhook Flow...');
    
    // Simulate a standardized message from Discord
    const mockMsg = {
        platform: 'discord',
        senderId: '123456789',
        text: 'Hola ALEX, ¿cómo funciona el plan Enterprise?',
        metadata: {
            instanceId: 'multi_discord_default',
            authorName: 'TestUser',
            channelId: '987654321'
        }
    };

    try {
        // We test the standardized message handling directly to avoid HTTP/Signature complexity in this unit test
        console.log('   -> Sending message to Router...');
        // Note: we don't await because it's usually async background processing in production
        // but here we want to see it finish.
        await handleIncomingMessage(mockMsg);
        console.log('✅ Discord Flow test passed (Router accepted message).');
    } catch (e) {
        console.error('❌ Discord Flow test failed:', e.message);
    }
}

async function testTikTokFlow() {
    console.log('\n🧪 Testing TikTok Webhook Flow...');
    const mockMsg = {
        platform: 'tiktok',
        senderId: 'tiktok_user_001',
        text: 'I want to know more about the bot.',
        metadata: {
            instanceId: 'multi_tiktok_default',
            requestId: 'test_req_123'
        }
    };

    try {
        await handleIncomingMessage(mockMsg);
        console.log('✅ TikTok Flow test passed.');
    } catch (e) {
        console.error('❌ TikTok Flow test failed:', e.message);
    }
}

async function runTests() {
    await testDiscordFlow();
    await testTikTokFlow();
}

runTests().then(() => console.log('\n✨ Smoke tests completed.'));

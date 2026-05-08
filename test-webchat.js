const targetUrl = 'https://alex-io-v5.onrender.com/api/webhooks/webchat'; // Trying a guess or I can use the local server if running
// Or I can test locally
async function test() {
    try {
        const response = await fetch('http://localhost:3000/api/webhooks/webchat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: 'test_user_123',
                text: 'Hola',
                metadata: { tenantId: 'demo-testing', platform: 'web', source: 'widget_flotante' }
            })
        });

        console.log('Status:', response.status);
        console.log('Headers:', response.headers.get('content-type'));
        const text = await response.text();
        console.log('Body:', text);
    } catch (e) {
        console.error(e);
    }
}
test();

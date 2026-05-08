async function test() {
    const urls = [
        'https://saas-alex-io-v5.onrender.com/api/webhooks/webchat',
        'https://whatsapp-fullstack-ylsx.onrender.com/api/webhooks/webchat',
        'https://saas-whatsapp-zhsu.onrender.com/api/webhooks/webchat',
        'https://whatsapp-fullstack-1-yjao.onrender.com/api/webhooks/webchat'
    ];

    for (const targetUrl of urls) {
        console.log('\n--- Testing', targetUrl, '---');
        try {
            const response = await fetch(targetUrl, {
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
            console.log('Body:', text.substring(0, 200));
        } catch (e) {
            console.error('Error:', e.message);
        }
    }
}
test();

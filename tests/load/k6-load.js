import http from 'k6/http';
import { check, sleep } from 'k6';

// k6 run tests/load/k6-load.js
export const options = {
    stages: [
        { duration: '30s', target: 50 }, // Ramp up to 50 concurrent webhooks
        { duration: '1m', target: 200 }, // Peak load 200 concurrent
        { duration: '30s', target: 0 },  // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
        http_req_failed: ['rate<0.01'], // Less than 1% errors
    },
};

export default function () {
    const url = __ENV.API_URL || 'http://localhost:3000/api/webhooks/whatsapp';
    
    // Simulate Meta WhatsApp Webhook Payload
    const payload = JSON.stringify({
        object: 'whatsapp_business_account',
        entry: [{
            id: '123456789',
            changes: [{
                value: {
                    messaging_product: 'whatsapp',
                    metadata: { display_phone_number: '123', phone_number_id: '123' },
                    contacts: [{ profile: { name: 'Load Test User' }, wa_id: '123456' }],
                    messages: [{
                        from: '123456',
                        id: `wamid.loadtest.${Math.random()}`,
                        timestamp: Date.now().toString(),
                        text: { body: 'Load test message' },
                        type: 'text'
                    }]
                },
                field: 'messages'
            }]
        }]
    });

    const params = {
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const res = http.post(url, payload, params);

    // Assert successful receipt (200 OK fast ack required by Meta)
    check(res, {
        'is status 200': (r) => r.status === 200,
        'fast ack (under 1s)': (r) => r.timings.duration < 1000
    });

    sleep(Math.random() * 2);
}

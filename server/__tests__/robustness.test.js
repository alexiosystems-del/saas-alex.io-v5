const { test, describe, before } = require('node:test');
const assert = require('node:assert');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

// Simplified app for testing security middleware behavior
const createApp = () => {
    const app = express();

    // --- SECURE CORS (Logic matches index.js) ---
    const allowedOrigins = ['https://trusted.com'];
    app.use(cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
        }
    }));

    const sensitiveLimiter = rateLimit({
        windowMs: 60 * 60 * 1000,
        limit: 2, // Low limit for testing
        message: { error: 'Límite excedido' }
    });

    app.get('/api/test-cors', (req, res) => res.json({ success: true }));
    app.post('/api/auth/login', sensitiveLimiter, (req, res) => res.json({ success: true }));

    return app;
};

describe('Security Hardening Robustness', () => {
    let app;
    let port;
    let baseUrl;

    before(async () => {
        app = createApp();
        return new Promise((resolve) => {
            const server = app.listen(0, () => {
                port = server.address().port;
                baseUrl = `http://localhost:${port}`;
                resolve();
            });
        });
    });

    test('CORS should allow trusted origin', async () => {
        const res = await fetch(`${baseUrl}/api/test-cors`, {
            headers: { 'Origin': 'https://trusted.com' }
        });
        assert.strictEqual(res.status, 200);
        const data = await res.json();
        assert.strictEqual(data.success, true);
    });

    test('CORS should block untrusted origin', async () => {
        const res = await fetch(`${baseUrl}/api/test-cors`, {
            headers: { 'Origin': 'https://malicious.com' }
        });
        // Express returns 500 when cors callback returns error without handler
        assert.strictEqual(res.status, 500);
    });

    test('Sensitive Rate Limiter should block after 2 attempts', async () => {
        // Attempt 1
        let res = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST' });
        assert.strictEqual(res.status, 200);

        // Attempt 2
        res = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST' });
        assert.strictEqual(res.status, 200);

        // Attempt 3 - Blocked
        res = await fetch(`${baseUrl}/api/auth/login`, { method: 'POST' });
        assert.strictEqual(res.status, 429);
        const data = await res.json();
        assert.strictEqual(data.error, 'Límite excedido');
    });
});

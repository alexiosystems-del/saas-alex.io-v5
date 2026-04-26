/**
 * tiktokAPI.js — Cliente TikTok Business API v2 (Production Ready)
 *
 * Fix crítico: migrado de open-api.tiktok.com (deprecado) a open.tiktokapis.com/v2/
 * Agrega: token refresh automático, HMAC signature verification, manejo de errores tipados
 *
 * CommonJS — adaptado para ALEX IO multi-tenant
 */

const axios = require('axios');
const crypto = require('crypto');
const pino = require('pino');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });
const BASE_URL = 'https://open.tiktokapis.com/v2';

// ─── Token manager (access token expira cada 24h en TikTok Business API) ─────

let _cachedToken = null;
let _tokenExpiresAt = 0;

async function getAccessToken() {
    if (_cachedToken && Date.now() < _tokenExpiresAt - 60_000) {
        return _cachedToken;
    }

    const appId = process.env.TIKTOK_APP_ID;
    const appSecret = process.env.TIKTOK_APP_SECRET;

    if (!appId || !appSecret) {
        throw Object.assign(
            new Error('TIKTOK_APP_ID and TIKTOK_APP_SECRET must be configured'),
            { code: 'MISSING_CREDENTIALS', retryable: false }
        );
    }

    const res = await axios.post(`${BASE_URL}/oauth/token/`, {
        client_key: appId,
        client_secret: appSecret,
        grant_type: 'client_credentials',
    }, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        timeout: 10_000,
    });

    if (res.data?.error?.code && res.data.error.code !== 'ok') {
        throw Object.assign(
            new Error(`TikTok OAuth error: ${res.data.error.message}`),
            { code: res.data.error.code, retryable: false }
        );
    }

    _cachedToken = res.data.access_token;
    _tokenExpiresAt = Date.now() + (res.data.expires_in * 1000);
    logger.info({ event: 'tiktok_token_refreshed', expiresIn: res.data.expires_in },
        'TikTok access token refreshed');
    return _cachedToken;
}

// ─── Send message ─────────────────────────────────────────────────────────────

async function sendMessage(recipientId, text) {
    const token = await getAccessToken();

    const res = await axios.post(
        `${BASE_URL}/business/message/send/`,
        {
            recipient: { open_id: recipientId },
            message: { message_type: 'text', text: { text } },
        },
        {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json; charset=UTF-8',
            },
            timeout: 15_000,
        }
    );

    if (res.data?.error?.code && res.data.error.code !== 'ok') {
        // Token expirado mid-request — limpiar caché para refresh en el próximo intento
        if (res.data.error.code === 'access_token_expired') {
            _cachedToken = null;
        }
        throw Object.assign(
            new Error(`TikTok send error: ${res.data.error.message}`),
            { code: res.data.error.code, retryable: res.data.error.code === 'access_token_expired' }
        );
    }

    logger.info({ event: 'tiktok_message_sent', recipientId }, 'Message sent via TikTok');
    return res.data;
}

// ─── Webhook signature verification ──────────────────────────────────────────
//
// TikTok firma con: HMAC-SHA256( timestamp + nonce + rawBody )
// NO es solo HMAC(body) — ese es el error más común.
//
// IMPORTANTE: para que esto funcione, Express debe recibir el raw body (Buffer).
// En index.js se bypasea express.json() para esta ruta, igual que con Stripe.

function verifyTikTokSignature(req) {
    const appSecret = process.env.TIKTOK_APP_SECRET;

    // Si no hay app_secret configurado, behavior depende del entorno
    if (!appSecret) {
        if (process.env.NODE_ENV === 'production') {
            throw Object.assign(
                new Error('TIKTOK_APP_SECRET not configured — cannot verify webhook in production'),
                { status: 500 }
            );
        }
        // Solo en dev/staging: loggear advertencia y continuar sin verificar
        logger.warn({ event: 'tiktok_signature_skipped',
            reason: 'TIKTOK_APP_SECRET not set' },
            'Skipping TikTok HMAC verification (dev mode only)');
        return;
    }

    const signature = req.headers['x-tt-signature'];
    const timestamp = req.headers['x-tt-timestamp'];
    const nonce = req.headers['x-tt-nonce'];

    if (!signature || !timestamp || !nonce) {
        throw Object.assign(new Error('Missing TikTok signature headers'), { status: 401 });
    }

    // Validar que el timestamp no sea más viejo de 5 minutos (replay attack)
    const age = Date.now() - (parseInt(timestamp, 10) * 1000);
    if (age > 300_000) {
        throw Object.assign(new Error('TikTok signature expired (>5min)'), { status: 401 });
    }

    // req.body debe ser el Buffer raw (gracias al bypass en index.js)
    const rawBody = Buffer.isBuffer(req.body)
        ? req.body.toString('utf8')
        : JSON.stringify(req.body);

    const expected = crypto
        .createHmac('sha256', appSecret)
        .update(timestamp + nonce + rawBody)
        .digest('hex');

    // Comparación timing-safe
    if (signature.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
        throw Object.assign(new Error('Invalid TikTok HMAC signature'), { status: 401 });
    }

    logger.info({ event: 'tiktok_signature_valid' }, 'TikTok webhook signature verified');
}

// ─── Capabilities ─────────────────────────────────────────────────────────────

function capabilities() {
    return {
        platform: 'tiktok',
        audio: false,
        templates: false,
        buttons: false
    };
}

module.exports = { sendMessage, verifyTikTokSignature, getAccessToken, capabilities };

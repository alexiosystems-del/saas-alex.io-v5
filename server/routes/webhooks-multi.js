/**
 * webhooks-multi.js
 * Enrutador de webhooks para múltiples plataformas integradas en V5.
 */
const express = require('express');
const router = express.Router();

// Importamos dinámicamente los servicios como JS modules no es totalmente nativo en CJS,
// así que usaremos async/await import() si el proyecto es CommonJS, o un bypass temporal.
// El index.js usa `require`. Vamos a usar un bypass o import() dinámico.

const { handleFBMessengerWebhook } = require('../services/facebookMessengerAPI.js').default || require('../services/facebookMessengerAPI.js');
const { handleInstagramWebhook } = require('../services/instagramDirectAPI.js').default || require('../services/instagramDirectAPI.js');
const { handleTikTokWebhook } = require('../services/tiktokAPI.js').default || require('../services/tiktokAPI.js');
const { handleWebchatMessage } = require('../services/webchatAPI.js').default || require('../services/webchatAPI.js');

const ManyChatAPI = require('../services/manychatAPI.js');
const messageRouterModule = require('../services/messageRouter.js');
const messageRouter = messageRouterModule.default || messageRouterModule;
const manychatService = new ManyChatAPI(messageRouter);

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'ALEX_IO_SECURE_TOKEN';

// ============================================
// VERIFICACIÓN DE WEBHOOKS (GET)
// ============================================

router.get('/messenger', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED (Messenger)');
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    }
    return res.status(400).send('Faltan parámetros de verificación');
});

router.get('/instagram', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED (Instagram)');
            return res.status(200).send(challenge);
        } else {
            return res.sendStatus(403);
        }
    }
    return res.status(400).send('Faltan parámetros de verificación');
});

// ============================================
// RECEPCIÓN DE MENSAJES (POST)
// ============================================

router.post('/messenger', async (req, res) => {
    await handleFBMessengerWebhook(req.body);
    // FB requiere respuesta 200 rápido y procesar en segundo plano
    res.status(200).send('EVENT_RECEIVED');
});

router.post('/instagram', async (req, res) => {
    await handleInstagramWebhook(req.body);
    res.status(200).send('EVENT_RECEIVED');
});

router.post('/tiktok', handleTikTokWebhook);

router.post('/webchat', handleWebchatMessage);

router.post('/manychat', async (req, res) => {
    return await manychatService.handleIncomingWebhook(req, res);
});

module.exports = router;

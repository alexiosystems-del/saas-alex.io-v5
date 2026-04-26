/**
 * webhooks-multi.js
 * Enrutador de webhooks para múltiples plataformas integradas en V5.
 */
const express = require('express');
const router = express.Router();

// Importamos dinámicamente los servicios como JS modules no es totalmente nativo en CJS,
// así que usaremos async/await import() si el proyecto es CommonJS, o un bypass temporal.
// El index.js usa `require`. Vamos a usar un bypass o import() dinámico.

const { logInfo, logError } = require('../utils/logger');
const { resolveInstanceId } = require('../services/webhookBroker');

const ManyChatAPI = require('../services/manychatAPI.js');
const messageRouterModule = require('../services/messageRouter.js');
const messageRouter = messageRouterModule.default || messageRouterModule;
const manychatService = new ManyChatAPI(messageRouter);

const VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'ALEX_IO_SECURE_TOKEN';


/**
 * TikTok webhook handler (Production Ready)
 * - HMAC signature verification (timestamp + nonce + rawBody)
 * - Proper payload normalization via TikTokAdapter
 * - GET handler for TikTok challenge verification
 */
const { verifyTikTokSignature } = require('../services/tiktokAPI');
const TikTokAdapter = require('../services/tiktokAdapter');

// GET: TikTok sends a challenge during webhook registration
const handleTikTokChallenge = (req, res) => {
    const challenge = req.query.challenge;
    if (challenge) {
        logInfo(`[TikTok] Challenge verification: ${challenge}`);
        return res.status(200).send(challenge);
    }
    return res.status(200).json({ status: 'TikTok webhook endpoint active' });
};

const handleTikTokWebhook = async (req, res) => {
    const crypto = require('crypto');
    const requestId = crypto.randomUUID();

    try {
        // 1. Verify HMAC signature (skipped in dev if no TIKTOK_APP_SECRET)
        verifyTikTokSignature(req);

        // 2. Parse raw body to JSON (body arrives as Buffer due to express.raw())
        const body = Buffer.isBuffer(req.body)
            ? JSON.parse(req.body.toString('utf8'))
            : req.body;

        if (!body || body.event !== 'message') {
            return res.status(200).send('OK'); // Ack non-message events silently
        }

        logInfo(`[TikTok] Webhook received (${requestId})`);

        // 3. Normalize payload with priority-based field mapping
        const { userId, text, instanceId } = TikTokAdapter.normalizePayload(body, requestId);

        // 4. Resolve instance (use explicit instanceId or resolve from TikTok IDs)
        const resolvedId = instanceId
            ? await resolveInstanceId('tiktok', instanceId)
            : null;

        const finalInstanceId = resolvedId || instanceId || 'multi_tiktok_default';

        // 5. Route through messageRouter (not alexBrain directly)
        const stdMessage = messageRouterModule.createStandardizedMessage(
            'tiktok',
            userId,
            text || '[non-text-input]',
            { instanceId: finalInstanceId, requestId }
        );
        await messageRouterModule.handleIncomingMessage(stdMessage);

        res.status(200).send('OK');
    } catch (error) {
        logError(`[TikTok] Webhook error (${requestId}):`, error.message);
        // Always return 200 to TikTok to prevent retries on our errors
        res.status(error.status || 200).send(error.status === 401 ? 'Unauthorized' : 'OK');
    }
};

/**
 * Webchat handler (Moved from adapter to Route)
 */
const handleWebchatMessage = async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    console.log(`[DEBUG] handleWebchatMessage INVOKED! req.body:`, typeof req.body, req.body);
    try {
        const { senderId, text, metadata = {} } = req.body;
        if (!senderId || !text) {
            console.log(`[DEBUG] Faltan campos. returning 400`);
            return res.status(400).json({ error: 'Faltan campos (senderId, text)' });
        }
        
        // Inject IP for tracking
        metadata.ip = ip;
        
        logInfo(`[Webchat] Mensaje recibido de ${senderId} [IP: ${ip}]`);
        
        const enrichedMetadata = {
            ...(metadata || {}),
            instanceId: metadata?.instanceId || metadata?.instance_id || req.query.instanceId || req.body.instanceId || 'multi_web_default'
        };
        const stdMessage = messageRouterModule.createStandardizedMessage('web', senderId, text, enrichedMetadata);
        const replyText = await messageRouterModule.processMessageLocally(stdMessage);
        
        res.status(200).json({ success: true, reply: replyText });
    } catch (error) {
        logError(`[Webchat] Error en route [IP: ${ip}]`, error);
        res.status(500).json({ 
            success: false, 
            error: 'Server error', 
            reply: 'Lo siento, estamos experimentando una alta demanda. Por favor reintenta en un momento.' 
        });
    }
};

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
    try {
        const body = req.body;
        if (body.object === 'page') {
            for (let entry of body.entry) {
                const pageId = entry.id;
                const resolvedId = await resolveInstanceId('messenger', pageId);
                const fallbackInstanceId = req.query.instanceId || req.body?.instanceId;
                
                for (let messaging of (entry.messaging || [])) {
                    if (messaging.message && messaging.sender) {
                        const stdMessage = messageRouterModule.createStandardizedMessage(
                            'messenger',
                            messaging.sender.id,
                            messaging.message.text,
                            { instanceId: resolvedId || fallbackInstanceId || 'multi_messenger_default', pageId }
                        );
                        await messageRouterModule.handleIncomingMessage(stdMessage);
                    }
                }
            }
        }
    } catch (e) {
        logError('[Webhook] Messenger Error', e);
    }
    res.status(200).send('EVENT_RECEIVED');
});

router.post('/instagram', async (req, res) => {
    try {
        const body = req.body;
        if (body.object === 'instagram') {
            for (let entry of body.entry) {
                const igId = entry.id;
                const resolvedId = await resolveInstanceId('instagram', igId);
                const fallbackInstanceId = req.query.instanceId || req.body?.instanceId;
                
                for (let messaging of (entry.messaging || [])) {
                    if (messaging.message && messaging.sender) {
                        const stdMessage = messageRouterModule.createStandardizedMessage(
                            'instagram',
                            messaging.sender.id,
                            messaging.message.text,
                            { instanceId: resolvedId || fallbackInstanceId || 'multi_instagram_default', pageId: igId }
                        );
                        await messageRouterModule.handleIncomingMessage(stdMessage);
                    }
                }
            }
        }
    } catch (e) {
        logError('[Webhook] Instagram Error', e);
    }
    res.status(200).send('EVENT_RECEIVED');
});

router.get('/tiktok', handleTikTokChallenge);
router.post('/tiktok', handleTikTokWebhook);

router.post('/webchat', handleWebchatMessage);

/**
 * Discord webhook handler (Inbound)
 */
router.post('/discord', async (req, res) => {
    try {
        const { type, data, channel_id, author, content } = req.body;
        
        // Discord sends a PING (type 1) to verify the URL
        if (type === 1) {
            return res.status(200).json({ type: 1 });
        }

        logInfo(`[Discord] Evento recibido tipo ${type} en canal ${channel_id}`);

        // Normalización básica para Discord (simplificada para V1)
        if (author && content) {
            const stdMessage = messageRouterModule.createStandardizedMessage(
                'discord',
                author.id,
                content,
                { instanceId: 'multi_discord_default', channelId: channel_id, authorName: author.username }
            );
            await messageRouterModule.handleIncomingMessage(stdMessage);
        }

        res.status(200).send('OK');
    } catch (error) {
        logError('[Discord] Webhook error', error);
        res.status(200).send('OK'); // Discord prefiere 200 para no reintentar fallos lógicos
    }
});

// Fix 7: Rate limit en endpoints de diagnóstico (10 req/min por IP)
const rateLimit = require('express-rate-limit');
const manychatDiagLimiter = rateLimit({ windowMs: 60_000, max: 10,
    message: { error: 'Rate limit exceeded on diagnostic endpoint' } });

router.get('/manychat', manychatDiagLimiter, (req, res) => manychatService.validateConnection(req, res));
router.get('/manychat/blueprint', manychatDiagLimiter, (req, res) => manychatService.getBlueprint(req, res));

router.post('/manychat', async (req, res) => {
    return await manychatService.handleIncomingWebhook(req, res);
});

module.exports = router;

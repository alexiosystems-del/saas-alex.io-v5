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
const { loadInstanceConfig } = require('../services/instanceLoader');
const messageRouterModule = require('../services/messageRouter.js');
const messageRouter = messageRouterModule.default || messageRouterModule;
const manychatService = new ManyChatAPI(messageRouter);

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || process.env.FB_VERIFY_TOKEN || 'alexio_verify';

/**
 * Discord Signature Verification (Ed25519)
 */
const verifyDiscordSignature = (req, publicKey) => {
    const crypto = require('crypto');
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    // For Discord, we need the RAW body
    const body = req.rawBody || req.body.toString();

    if (!signature || !timestamp || !body) return false;

    try {
        // Native Node 18.x+ verification
        return crypto.verify(
            'ed25519',
            Buffer.from(timestamp + body),
            {
                key: Buffer.from(publicKey, 'hex'),
                format: 'der',
                type: 'public',
            },
            Buffer.from(signature, 'hex')
        );
    } catch (e) {
        console.warn('[Discord] Verification failed:', e.message);
        return false;
    }
};


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
    try {
        const { senderId, text, metadata = {}, tenantId: bodyTenantId } = req.body;
        const tenantId = bodyTenantId || metadata?.tenantId || 'demo-tenant';
        
        if (!senderId || !text) {
            console.warn(`⚠️ [Webchat] Payload incompleto:`, req.body);
            return res.status(200).json({ 
                success: true, 
                reply: '¡Hola! Recibí tu conexión, pero no el mensaje. ¿En qué puedo ayudarte?' 
            });
        }
        
        // Inject IP for tracking
        metadata.ip = ip;
        metadata.tenantId = tenantId;
        
        logInfo(`[Webchat] Mensaje recibido de ${senderId} [IP: ${ip}] [Tenant: ${tenantId}]`);
        
        const enrichedMetadata = {
            ...(metadata || {}),
            instanceId: metadata?.instanceId || metadata?.instance_id || req.query.instanceId || req.body.instanceId || 'multi_web_default'
        };
        const stdMessage = {
            ...messageRouterModule.createStandardizedMessage('web', senderId, text, enrichedMetadata),
            history: req.body.history || []
        };
        const replyText = await messageRouterModule.processMessageLocally(stdMessage);
        
        console.log(`🧠 [Webchat] Respuesta generada:`, replyText);
        
        const responsePayload = { 
            success: true, 
            reply: replyText || 'IA está procesando... reintenta.',
            audioUrl: null 
        };

        // --- TTS CHECK ---
        const { supabase } = require('../services/supabaseClient');
        const { data: bot } = await supabase
            .from('bots')
            .select('voice_enabled, voice')
            .or(`tenant_id.eq.${tenantId},id.eq.${enrichedMetadata.instanceId}`)
            .limit(1)
            .single();

        if (bot && bot.voice_enabled && replyText) {
            const OPENAI_KEY = (process.env.OPENAI_API_KEY || '').trim();
            if (OPENAI_KEY && OPENAI_KEY.length > 10) {
                try {
                    const OpenAI = require('openai');
                    const openai = new OpenAI({ apiKey: OPENAI_KEY });
                    const mp3 = await openai.audio.speech.create({
                        model: 'tts-1',
                        voice: bot.voice || 'nova',
                        input: replyText.substring(0, 4096)
                    });
                    const audioBuffer = Buffer.from(await mp3.arrayBuffer());
                    responsePayload.audioUrl = `data:audio/mpeg;base64,${audioBuffer.toString('base64')}`;
                    logInfo(`[Webchat] TTS generado con voz: ${bot.voice || 'nova'}`);
                } catch (ttsErr) {
                    logError('[Webchat] TTS failed:', ttsErr.message);
                }
            }
        }
        
        res.status(200).json(responsePayload);
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

router.get('/meta', (req, res) => {
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED (Meta Cloud API)');
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

router.post('/meta', async (req, res) => {
    try {
        const body = req.body;
        if (body.object === 'whatsapp_business_account') {
            for (let entry of body.entry) {
                for (let change of (entry.changes || [])) {
                    if (change.field === 'messages') {
                        const value = change.value;
                        const phoneId = value.metadata?.phone_number_id;
                        const contact = value.contacts?.[0];
                        const message = value.messages?.[0];

                        if (message && phoneId) {
                            const resolvedId = await resolveInstanceId('meta', phoneId);
                            const text = message.text?.body || '[media]';
                            
                            const stdMessage = messageRouterModule.createStandardizedMessage(
                                'meta',
                                message.from,
                                text,
                                { 
                                    instanceId: resolvedId || 'multi_meta_default', 
                                    phoneId, 
                                    senderName: contact?.profile?.name,
                                    messageId: message.id 
                                }
                            );
                            await messageRouterModule.handleIncomingMessage(stdMessage);
                        }
                    }
                }
            }
        }
    } catch (e) {
        logError('[Webhook] Meta Error', e);
    }
    res.status(200).send('OK');
});

router.get('/tiktok', handleTikTokChallenge);
router.post('/tiktok', handleTikTokWebhook);

router.post('/webchat', handleWebchatMessage);

/**
 * Webchat Voice handler (Audio input + Transcription + AI Response)
 */
const multer = require('multer');
const voiceUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post('/webchat/voice', voiceUpload.single('audio'), async (req, res) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    try {
        const { senderId, tenantId } = req.body;
        let historyRaw = [];
        try { historyRaw = JSON.parse(req.body.history || '[]'); } catch (_) {}

        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No audio file provided' });
        }

        let transcription = '(Mensaje de voz)';

        // Try Whisper transcription
        const OPENAI_KEY = (process.env.OPENAI_API_KEY || '').trim();
        if (OPENAI_KEY && OPENAI_KEY.length > 10) {
            try {
                const OpenAI = require('openai');
                const openai = new OpenAI({ apiKey: OPENAI_KEY });
                const fs = require('fs');
                const path = require('path');
                const tmpPath = path.join(__dirname, `../_voice_tmp_${Date.now()}.webm`);
                fs.writeFileSync(tmpPath, req.file.buffer);

                const result = await openai.audio.transcriptions.create({
                    file: fs.createReadStream(tmpPath),
                    model: 'whisper-1',
                    language: 'es'
                });
                transcription = result.text || transcription;
                fs.unlinkSync(tmpPath);
                logInfo(`[Webchat Voice] Whisper transcription: "${transcription}"`);
            } catch (whisperErr) {
                logError('[Webchat Voice] Whisper failed:', whisperErr.message);
            }
        }

        // Process through AI
        const enrichedMetadata = {
            tenantId: tenantId || 'demo-tenant',
            instanceId: 'multi_web_voice',
            ip
        };
        const stdMessage = {
            ...messageRouterModule.createStandardizedMessage('web', senderId || 'voice_user', transcription, enrichedMetadata),
            history: historyRaw
        };
        const replyText = await messageRouterModule.processMessageLocally(stdMessage);

        const responsePayload = {
            success: true,
            transcription,
            reply: replyText || 'Recibí tu mensaje de voz. ¿En qué puedo ayudarte?',
            audioUrl: null
        };

        // Optional: Generate TTS audio response
        if (OPENAI_KEY && OPENAI_KEY.length > 10 && replyText) {
            try {
                const OpenAI = require('openai');
                const openai = new OpenAI({ apiKey: OPENAI_KEY });
                const mp3 = await openai.audio.speech.create({
                    model: 'tts-1',
                    voice: 'alloy',
                    input: replyText.substring(0, 4096)
                });
                const audioBuffer = Buffer.from(await mp3.arrayBuffer());
                const base64Audio = audioBuffer.toString('base64');
                responsePayload.audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
            } catch (ttsErr) {
                logError('[Webchat Voice] TTS failed:', ttsErr.message);
            }
        }

        res.status(200).json(responsePayload);
    } catch (error) {
        logError(`[Webchat Voice] Error [IP: ${ip}]`, error);
        res.status(500).json({
            success: false,
            error: 'Voice processing error',
            reply: 'No pude procesar tu mensaje de voz. Por favor, intenta escribir tu mensaje.'
        });
    }
});

/**
 * Discord webhook handler (Inbound - Interactions)
 */
router.post('/discord', async (req, res) => {
    try {
        const rawBody = req.body.toString();
        const body = JSON.parse(rawBody);
        const { type, data, channel_id, author, content, member } = body;
        
        // 1. Resolve Instance
        const instanceId = req.query.instanceId || 'multi_discord_default';
        const config = await loadInstanceConfig(instanceId);
        
        // 2. Optional Security: Verify Signature
        const publicKey = config?.credentials?.discordPublicKey || process.env.DISCORD_PUBLIC_KEY;
        if (publicKey) {
            // Note: signature verification is MANDATORY for Discord Interactions
            // But for MVP if crypto fails we log it.
            const isValid = verifyDiscordSignature(req, publicKey);
            if (!isValid && process.env.NODE_ENV === 'production') {
                return res.status(401).send('Invalid request signature');
            }
        }

        // 3. Handle Discord Interaction Types
        // Type 1: PING (Required for URL validation)
        if (type === 1) {
            return res.status(200).json({ type: 1 });
        }

        // Type 2: Slash Command / Interaction
        if (type === 2) {
            const user = body.member?.user || body.user;
            const commandName = data?.name;
            const channelId = body.channel_id;

            logInfo(`[Discord] Interaction received: /${commandName} from ${user?.username}`);

            const stdMessage = messageRouterModule.createStandardizedMessage(
                'discord',
                user.id,
                `/${commandName} ${data?.options?.[0]?.value || ''}`.trim(),
                { instanceId, channelId, authorName: user?.username, interactionId: body.id, interactionToken: body.token }
            );
            await messageRouterModule.handleIncomingMessage(stdMessage);

            // Discord requires an immediate response to interactions.
            // For MVP, we'll send a "Thinking..." or use the messageRouter response if fast enough.
            // But standard practice is to ACK and then follow up.
            return res.status(200).json({
                type: 4, // CHANNEL_MESSAGE_WITH_SOURCE
                data: { content: '⏳ Procesando solicitud...' }
            });
        }

        // Fallback: Standard messages (if using Gateway or custom relay)
        if (author && content) {
            const stdMessage = messageRouterModule.createStandardizedMessage(
                'discord',
                author.id,
                content,
                { instanceId, channelId: channel_id, authorName: author.username }
            );
            await messageRouterModule.handleIncomingMessage(stdMessage);
        }

        res.status(200).send('OK');
    } catch (error) {
        logError('[Discord] Webhook error', error);
        res.status(200).send('OK');
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

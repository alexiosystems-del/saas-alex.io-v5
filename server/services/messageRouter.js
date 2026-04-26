/**
 * messageRouter.js
 * Enrutador central para mensajes multiplataforma.
 * Recibe los mensajes estandarizados de los distintos conectores (WhatsApp, FB, IG, Web, TikTok)
 * y los envía al bot/motor conversacional, luego distribuye la respuesta al conector adecuado.
 */
const { logError, logInfo } = require('../utils/logger');
// Importamos el motor de IA principal
const alexBrain = require('./alexBrain.js');
const { processLeadAsync } = require('./leadProcessor.js');
const { supabase, isSupabaseEnabled } = require('./supabaseClient');
const { loadInstanceConfig } = require('./instanceLoader');
const { getAdapterByInstanceId } = require('./adapterFactory');
const { trackEvent } = require('./observability');
const crypto = require('crypto');
const operationalState = require('./operationalState');

const detectUserLanguage = (text = '') => {
    const sample = String(text || '').trim();
    if (!sample) return 'es';
    if (/[¿¡]|(?:\b(hola|gracias|por favor|necesito|quiero|ayuda|precio|campaña)\b)/i.test(sample)) return 'es';
    return 'en';
};

const handleIncomingMessage = async (standardizedMessage) => {
    const instanceId = standardizedMessage.metadata?.instanceId;
    if (instanceId && operationalState.isPaused(instanceId)) {
        logInfo(`[MessageRouter] Instance ${instanceId} is PAUSED. Skipping message.`);
        return;
    }

    const start = Date.now();
    try {
        logInfo(`[MessageRouter] Mensaje recibido de la plataforma: ${standardizedMessage.platform}`);
        
        const botResponseText = await processMessageWithAI(standardizedMessage);

        await routeResponseToPlatform(standardizedMessage.platform, standardizedMessage.senderId, botResponseText, standardizedMessage.metadata);

        trackEvent({
            event_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            instance_id: instanceId || 'unknown',
            channel: standardizedMessage.platform,
            direction: 'outbound',
            message_id: standardizedMessage.metadata?.messageId || Date.now().toString(),
            status: 'success',
            latency_ms: Date.now() - start
        });

    } catch (error) {
        logError('[MessageRouter] Error procesando mensaje centralizado', error);

        trackEvent({
            event_id: crypto.randomUUID(),
            timestamp: new Date().toISOString(),
            instance_id: instanceId || 'unknown',
            channel: standardizedMessage.platform,
            direction: 'outbound',
            message_id: standardizedMessage.metadata?.messageId || Date.now().toString(),
            status: 'error',
            latency_ms: Date.now() - start,
            error_message: error.message || 'Error genérico router'
        });
    }
};

const processMessageWithAI = async (msg) => {
    const tenantId = msg.metadata?.tenantId || 'global-tenant';
    const instanceId = msg.metadata?.instanceId || msg.metadata?.instance_id || msg.metadata?.botId || `multi_${msg.platform}_${msg.metadata?.pageId || msg.senderId}`;
    const userLang = detectUserLanguage(msg.text);

    // Load dynamic configuration (includes Sales Engine, Constitution, Demo Mode)
    const instanceConfig = await loadInstanceConfig(instanceId) || {};
    
    const botConfig = {
        bot_name: instanceConfig?.personality?.botName || 'ALEX IO',
        personality: instanceConfig?.personality || { botName: 'ALEX IO' }, 
        tenantId: instanceConfig?.tenantId || tenantId,
        instanceId: instanceId,
        maxWords: 60,
        maxMessages: 15
    };

    const logToDB = (direction, content) => {
        if (!isSupabaseEnabled || (msg.platform === 'whatsapp' && direction === 'INBOUND')) return;
        if (['discord', 'web', 'tiktok', 'messenger', 'instagram'].includes(msg.platform) || msg.platform.includes('baileys')) {
            (async () => {
                const ipInfo = msg.metadata?.ip ? `[IP: ${msg.metadata.ip}] ` : '';
                try {
                    const { error } = await supabase.from('messages').insert({
                        instance_id: instanceId,
                        tenant_id: tenantId,
                        remote_jid: msg.senderId,
                        direction: direction,
                        message_type: 'text',
                        content: `[${msg.platform}] ${ipInfo}` + content
                    });
                    if (error) logError('[MessageRouter] DB log error', error);
                } catch (e) {
                    logError('[MessageRouter] DB log exception', e);
                }
            })();
        }
    };

    const history = [
        { role: 'user', content: msg.text }
    ];

    try {
        logToDB('INBOUND', msg.text);

        // TIMEOUT GUARD: Render kills requests after 30s. We must respond in under 25s.
        const AI_TIMEOUT_MS = 20000;
        const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('AI_TIMEOUT')), AI_TIMEOUT_MS)
        );

        const aiPromise = alexBrain.generateResponse({
            message: msg.text,
            history: history,
            botConfig: botConfig,
            isAudio: false
        });

        const result = await Promise.race([aiPromise, timeoutPromise]);
        
        const answer = result.text || 'No pude procesar tu mensaje.';
        
        logToDB('OUTBOUND', answer);
        
        const fullHistoryContext = [...history, { role: 'assistant', content: answer }];
        processLeadAsync(tenantId, instanceId, msg.senderId, fullHistoryContext).catch(e => logError('[MessageRouter] Lead process error', e));

        return answer;
    } catch (e) {
        const isTimeout = e.message === 'AI_TIMEOUT';
        if (isTimeout) {
            logError('[MessageRouter] ⏱️ AI TIMEOUT - respondiendo con safeguard', { instanceId });
        } else {
            logError('[MessageRouter] Error en alexBrain', e);
        }
        const fallback = isTimeout 
            ? '¡Hola! Soy ALEX IO. Mis sistemas de IA están bajo alta demanda. ¿Podés contarme brevemente qué necesitás y te respondo enseguida?'
            : 'Lo siento, estoy teniendo problemas técnicos en este momento.';
        logToDB('OUTBOUND', fallback);
        return fallback;
    }
};

const routeResponseToPlatform = async (platform, senderId, text, metadata = {}) => {
    const instanceId = metadata?.instanceId;
    logInfo(`[MessageRouter] Routing response to ${platform} for instance ${instanceId}`);

    if (platform === 'baileys') {
        // Baileys sockets are managed in alexbrain/whatsappSaas.js
        logInfo(`[MessageRouter] Baileys session [${instanceId}] assumed managed by Saas service.`);
        return;
    }

    // Unified logic for all instantiable adapters
    try {
        const adapter = await getAdapterByInstanceId(instanceId);
        if (adapter) {
            await adapter.sendMessage(senderId, text);
            logInfo(`[MessageRouter] Response sent via ${platform} [${instanceId}]`);
        } else {
            throw new Error(`Failed to get adapter for ${platform} / instance ${instanceId}`);
        }
    } catch (e) {
        logError(`[MessageRouter] Error sending via ${platform} [${instanceId}]:`, e.message);
    }
};

const createStandardizedMessage = (platform, senderId, text, metadata = {}) => {
    return {
        platform,
        senderId,
        text,
        metadata,
        timestamp: new Date().toISOString()
    };
};

const processMessageLocally = processMessageWithAI;

module.exports = { handleIncomingMessage, createStandardizedMessage, processMessageLocally };

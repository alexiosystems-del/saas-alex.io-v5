/**
 * messageRouter.js
 * Enrutador central para mensajes multiplataforma.
 * Recibe los mensajes estandarizados de los distintos conectores (WhatsApp, FB, IG, Web, TikTok)
 * y los envía al bot/motor conversacional, luego distribuye la respuesta al conector adecuado.
 */
import { logError, logInfo } from '../utils/logger.js';
// Importamos el motor de IA principal
const alexBrain = require('./alexBrain.js');
const { supabase, isSupabaseEnabled } = require('./supabaseClient');
// Importaremos los diferentes servicios según se necesiten, por ejemplo el de WhatsApp para mantener compatibilidad
import { sendWhatsAppMessage } from './whatsappCloudAPI.js';

export const handleIncomingMessage = async (standardizedMessage) => {
    try {
        logInfo(`[MessageRouter] Mensaje recibido de la plataforma: ${standardizedMessage.platform}`);
        
        // 1. Aquí iría la lógica central (IA, reglas, RAG, Dialogflow, Gemini, etc.)
        // Simularemos obtener una respuesta del bot para este usuario
        const botResponseText = await processMessageWithAI(standardizedMessage);

        // 2. Enrutar la respuesta de vuelta a la plataforma de origen
        await routeResponseToPlatform(standardizedMessage.platform, standardizedMessage.senderId, botResponseText, standardizedMessage.metadata);

    } catch (error) {
        logError('[MessageRouter] Error procesando mensaje centralizado', error);
    }
};

const processMessageWithAI = async (msg) => {
    const tenantId = msg.metadata?.tenantId || 'global-tenant';
    const instanceId = `multi_${msg.platform}_${msg.metadata?.pageId || msg.senderId}`;

    // Para simplificar, obtenemos un botConfig genérico o basado en metadatos
    const botConfig = {
        bot_name: 'ALEX IO Multi-canal',
        system_prompt: 'Eres ALEX IO, asistente virtual inteligente. Estás respondiendo desde ' + msg.platform,
        tenantId: tenantId,
        instanceId: instanceId
    };

    // Helper asíncrono fire-and-forget para no bloquear el router
    const logToDB = (direction, content) => {
        if (!isSupabaseEnabled || msg.platform === 'whatsapp') return;
        supabase.from('messages').insert({
            instance_id: instanceId,
            tenant_id: tenantId,
            remote_jid: msg.senderId,
            direction: direction,
            message_type: 'text',
            content: `[${msg.platform}] ` + content
        }).catch(e => logError('[MessageRouter] DB log error', e));
    };

    // Historial básico (en una app real se sacaría de supabase 'messages')
    const history = [
        { role: 'user', content: msg.text }
    ];

    try {
        // Guardamos INBOUND en base de datos
        logToDB('INBOUND', msg.text);

        const result = await alexBrain.generateResponse({
            message: msg.text,
            history: history,
            botConfig: botConfig,
            isAudio: false // Por ahora solo texto
        });
        
        const answer = result.text || 'No pude procesar tu mensaje.';
        
        // Guardamos OUTBOUND en base de datos
        logToDB('OUTBOUND', answer);
        
        return answer;
    } catch (e) {
        logError('[MessageRouter] Error en alexBrain', e);
        const fallback = 'Lo siento, estoy teniendo problemas técnicos en este momento.';
        logToDB('OUTBOUND', fallback);
        return fallback;
    }
};

const routeResponseToPlatform = async (platform, senderId, text, metadata) => {
    switch (platform) {
        case 'whatsapp':
            logInfo(`[MessageRouter] Respondiendo por WhatsApp a ${senderId}`);
            // await sendWhatsAppMessage(senderId, text, metadata.phoneNumberId, metadata.token);
            break;
        case 'messenger':
            logInfo(`[MessageRouter] Respondiendo por FB Messenger a ${senderId}`);
            // Lógica de FB Messenger
            break;
        case 'instagram':
            logInfo(`[MessageRouter] Respondiendo por Instagram a ${senderId}`);
            // Lógica de Instagram
            break;
        case 'web':
            logInfo(`[MessageRouter] Respondiendo por Web Chat a ${senderId}`);
            // Lógica de Web Chat
            break;
        case 'tiktok':
            logInfo(`[MessageRouter] Respondiendo por TikTok a ${senderId}`);
            // Lógica de TikTok
            break;
        default:
            logError(`[MessageRouter] Plataforma desconocida: ${platform}`);
    }
};

/**
 * Función de utilidad para estandarizar mensajes antes de enviarlos al router
 */
export const createStandardizedMessage = (platform, senderId, text, metadata = {}) => {
    return {
        platform, // 'whatsapp', 'messenger', 'instagram', 'web', 'tiktok'
        senderId, // ID único del remitente en la plataforma
        text,     // Contenido de texto del mensaje
        metadata, // Datos adicionales necesarios para responder (token, page ID, etc.)
        timestamp: new Date().toISOString()
    };
};

export const processMessageLocally = processMessageWithAI;

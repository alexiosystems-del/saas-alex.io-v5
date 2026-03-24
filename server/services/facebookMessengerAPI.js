/**
 * facebookMessengerAPI.js
 * Conector para la API de mensajería de Facebook Pages.
 */
import axios from 'axios';
import { logError, logInfo } from '../utils/logger.js';
import { handleIncomingMessage, createStandardizedMessage } from './messageRouter.js';

const FB_GRAPH_VERSION = process.env.FB_GRAPH_VERSION || 'v19.0';
const PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

/**
 * Maneja los webhooks entrantes de Facebook Messenger
 */
export const handleFBMessengerWebhook = async (body) => {
    try {
        if (body.object === 'page') {
            for (let entry of body.entry) {
                let webhook_event = entry.messaging[0];
                let sender_psid = webhook_event.sender.id;
                
                if (webhook_event.message) {
                    logInfo(`[FBMessenger] Mensaje recibido del usuario ${sender_psid}`);
                    
                    // Estandarizar y enviar al enrutador central
                    const stdMessage = createStandardizedMessage(
                        'messenger',
                        sender_psid,
                        webhook_event.message.text,
                        { pageId: entry.id }
                    );
                    
                    await handleIncomingMessage(stdMessage);
                }
            }
        }
    } catch (error) {
        logError('[FBMessenger] Error procesando webhook', error);
    }
};

/**
 * Envía un mensaje a un usuario a través de Messenger
 */
export const sendFBMessengerMessage = async (recipientId, text) => {
    try {
        const url = `https://graph.facebook.com/${FB_GRAPH_VERSION}/me/messages?access_token=${PAGE_ACCESS_TOKEN}`;
        const data = {
            recipient: { id: recipientId },
            message: { text: text },
            messaging_type: "RESPONSE"
        };
        
        await axios.post(url, data);
        logInfo(`[FBMessenger] Mensaje enviado a ${recipientId}`);
    } catch (error) {
        logError(`[FBMessenger] Error enviando mensaje a ${recipientId}`, error.response?.data || error.message);
    }
};

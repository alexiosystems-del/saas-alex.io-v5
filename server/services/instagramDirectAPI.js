/**
 * instagramDirectAPI.js
 * Conector para la API de Instagram Direct (IGDM).
 */
import axios from 'axios';
import { logError, logInfo } from '../utils/logger.js';
import { handleIncomingMessage, createStandardizedMessage } from './messageRouter.js';

const FB_GRAPH_VERSION = process.env.FB_GRAPH_VERSION || 'v19.0';
const IG_ACCESS_TOKEN = process.env.IG_ACCESS_TOKEN;

/**
 * Maneja los webhooks entrantes de Instagram
 */
export const handleInstagramWebhook = async (body) => {
    try {
        if (body.object === 'instagram') {
            for (let entry of body.entry) {
                let webhook_event = entry.messaging[0];
                let sender_id = webhook_event.sender.id;
                
                if (webhook_event.message) {
                    logInfo(`[Instagram] Mensaje recibido del usuario ${sender_id}`);
                    
                    // Estandarizar y enviar al enrutador central
                    const stdMessage = createStandardizedMessage(
                        'instagram',
                        sender_id,
                        webhook_event.message.text,
                        { pageId: entry.id }
                    );
                    
                    await handleIncomingMessage(stdMessage);
                }
            }
        }
    } catch (error) {
        logError('[Instagram] Error procesando webhook', error);
    }
};

/**
 * Envía un mensaje a un usuario a través de Instagram Direct
 */
export const sendInstagramMessage = async (recipientId, text) => {
    try {
        // En IGDM el endpoint es me/messages igual que FB si se usa el Page Access Token asociado
        const url = `https://graph.facebook.com/${FB_GRAPH_VERSION}/me/messages?access_token=${IG_ACCESS_TOKEN}`;
        const data = {
            recipient: { id: recipientId },
            message: { text: text },
            messaging_type: "RESPONSE"
        };
        
        await axios.post(url, data);
        logInfo(`[Instagram] Mensaje enviado a ${recipientId}`);
    } catch (error) {
        logError(`[Instagram] Error enviando mensaje a ${recipientId}`, error.response?.data || error.message);
    }
};

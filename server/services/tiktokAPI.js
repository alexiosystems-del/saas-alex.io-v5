/**
 * tiktokAPI.js
 * Conector para la API de mensajería de TikTok for Business.
 */
import axios from 'axios';
import { logError, logInfo } from '../utils/logger.js';
import { handleIncomingMessage, createStandardizedMessage } from './messageRouter.js';

const TIKTOK_ACCESS_TOKEN = process.env.TIKTOK_ACCESS_TOKEN;

/**
 * Maneja los webhooks entrantes de TikTok
 */
export const handleTikTokWebhook = async (req, res) => {
    try {
        const body = req.body;
        // Dependiendo de la estructura de TikTok, se captura el evento de mensaje
        if (body && body.event === 'message') {
            const sender_id = body.data.sender.id;
            const message = body.data.message;

            logInfo(`[TikTok] Mensaje recibido del usuario ${sender_id}`);
            
            // Estandarizar y enviar al enrutador central
            const stdMessage = createStandardizedMessage(
                'tiktok',
                sender_id,
                message.text,
                {}
            );
            
            await handleIncomingMessage(stdMessage);
        }
        res.status(200).send('OK');
    } catch (error) {
        logError('[TikTok] Error procesando webhook', error);
        res.status(500).send('Error');
    }
};

/**
 * Envía un mensaje a un usuario a través de TikTok
 */
export const sendTikTokMessage = async (recipientId, text) => {
    try {
        // En TikTok la URL y formato pueden variar
        const url = `https://open-api.tiktok.com/message/send/`;
        const data = {
            recipient_id: recipientId,
            message: { type: "text", text: text }
        };
        
        await axios.post(url, data, {
            headers: { 'Authorization': `Bearer ${TIKTOK_ACCESS_TOKEN}` }
        });
        
        logInfo(`[TikTok] Mensaje enviado a ${recipientId}`);
    } catch (error) {
        logError(`[TikTok] Error enviando mensaje a ${recipientId}`, error.response?.data || error.message);
    }
};

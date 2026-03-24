/**
 * webchatAPI.js
 * Conector para el Web Chat (WebSocket / REST).
 */
import { logError, logInfo } from '../utils/logger.js';
import { processMessageLocally, createStandardizedMessage } from './messageRouter.js';

/**
 * Recibe los mensajes que llegan desde el widget web
 */
export const handleWebchatMessage = async (req, res) => {
    try {
        const { senderId, text, metadata } = req.body;
        
        if (!senderId || !text) {
            return res.status(400).json({ error: 'Faltan campos requeridos (senderId, text)' });
        }

        logInfo(`[Webchat] Mensaje recibido del usuario ${senderId}`);
        
        // Estandarizar
        const stdMessage = createStandardizedMessage('web', senderId, text, metadata);
        
        // Llamada síncrona a la IA
        const replyText = await processMessageLocally(stdMessage);

        res.status(200).json({ success: true, reply: replyText });
    } catch (error) {
        logError('[Webchat] Error procesando mensaje', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

/**
 * Envío de mensaje (Push) al Web Chat
 * Si se usa WebSocket esto emitiría un evento, aquí está la base estructural
 */
export const sendWebchatMessage = async (recipientId, text) => {
    try {
        logInfo(`[Webchat] Push de mensaje a usuario ${recipientId}: ${text.substring(0, 30)}...`);
        // Lógica de Sockets iría aquí
        // socketServer.to(recipientId).emit('message', { text });
    } catch (error) {
        logError(`[Webchat] Error enviando mensaje a ${recipientId}`, error);
    }
};

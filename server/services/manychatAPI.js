const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

/**
 * Handles incoming HTTP Requests from ManyChat (External Request action)
 * expects a JSON payload containing the user's message and identification.
 * ManyChat Dynamic Block format is returned.
 */
class ManyChatAPI {
    constructor(router) {
        // Reference to the main messageRouter to process AI logic
        this.messageRouter = router;
    }

    /**
     * Parse the incoming request from ManyChat.
     * ManyChat allows custom JSON bodies in their External Request nodes.
     * We expect: 
     * {
     *   "subscriber_id": "12345...",
     *   "name": "Juan Perez",
     *   "message": "Hola, cuanto cuesta?",
     *   "platform": "instagram" // or "messenger", "whatsapp", "telegram"
     * }
     */
    async handleIncomingWebhook(req, res) {
        try {
            // Get tenantId from headers or query params
            const tenantId = req.headers['x-tenant-id'] || req.query.tenantId;
            const token = req.headers['authorization']?.split(' ')[1] || req.query.token;

            if (!tenantId) {
                logger.warn('ManyChat Webhook reject: Missing tenantId');
                return res.status(400).json({ error: 'Missing tenantId' });
            }

            // We could validate the token here if we load the config early,
            // or pass it down to let the router / auth layer handle it.
            // For now, we extract the data and pass it to the messageRouter.

            const payload = req.body;
            const senderId = payload.subscriber_id || payload.user_id;
            const messageText = payload.message || payload.last_message || payload.text;
            const platform = payload.platform || 'manychat';

            if (!senderId || !messageText) {
                logger.warn('ManyChat Webhook reject: Missing senderId or messageText in payload', payload);
                // Return empty block so ManyChat doesn't break, just ignores
                return res.json({ version: "v2", content: { messages: [] } });
            }

            logger.info({ tenantId, senderId, platform }, `Received message from ManyChat: ${messageText.substring(0, 50)}...`);

            // Use the messageRouter to process it with alexBrain
            // messageRouter returns the AI text.
            let aiResponseText = "";
            try {
                // To keep it simple, we await the response directly since ManyChat needs a synchronous reply 
                // within a few seconds. If it takes too long, ManyChat will timeout.
                // In a production environment with slow LLMs, you might want to send a fallback 
                // synchronous reply, and then use ManyChat's /fb/sending/sendContent API asynchronously.
                // For this V5 architecture, we will attempt synchronous reply first.
                
                aiResponseText = await this.messageRouter.processMessageLocally({
                    tenantId: tenantId,
                    platform: platform,
                    senderId: senderId,
                    messageType: 'text',
                    text: messageText,
                    metadata: {
                        name: payload.name,
                        manychatToken: token
                    }
                });

            } catch (error) {
                logger.error({ err: error, tenantId }, 'Error processing ManyChat message through AI');
                aiResponseText = "Lo siento, hubo un error procesando tu solicitud.";
            }

            // Return Dynamic Block format for ManyChat
            // https://support.manychat.com/hc/en-us/articles/360062226214-Dynamic-Content-Block
            const dynamicBlock = {
                version: "v2",
                content: {
                    messages: [
                        {
                            type: "text",
                            text: aiResponseText || "No pude generar una respuesta."
                        }
                    ]
                }
            };

            return res.status(200).json(dynamicBlock);

        } catch (error) {
            logger.error({ err: error }, 'Unhandled error in ManyChat Webhook');
            return res.status(500).json({ version: "v2", content: { messages: [{ type: "text", text: "Error interno del servidor." }] } });
        }
    }
}

module.exports = ManyChatAPI;

/**
 * webchatAPI.js
 * Conector para el Web Chat (WebSocket / REST).
 */
const { logError, logInfo } = require('../utils/logger');

class WebchatAPI {
    constructor(config = {}) {
        this.config = config;
    }

    /**
     * Contract implementation
     */
    capabilities() {
        return {
            platform: 'webchat',
            audio: true,
            templates: false,
            buttons: true
        };
    }

    /**
     * Envío de mensaje (Push) al Web Chat
     */
    async sendMessage(recipientId, text) {
        try {
            logInfo(`[Webchat] Push de mensaje a usuario ${recipientId}: ${text.substring(0, 30)}...`);
            // Here you would typically emit a socket event or send to a dedicated microservice
            return true;
        } catch (error) {
            logError(`[Webchat] Error enviando mensaje a ${recipientId}`, error);
            return false;
        }
    }
}

module.exports = WebchatAPI;

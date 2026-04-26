/**
 * facebookMessengerAPI.js
 * Conector para la API de mensajería de Facebook Pages.
 */
const axios = require('axios');
const { logError, logInfo } = require('../utils/logger');

class FacebookMessengerAPI {
    /**
     * @param {string} accessToken
     * @param {string} [apiVersion]
     */
    constructor(accessToken, apiVersion = 'v19.0') {
        this.accessToken = accessToken || process.env.FB_PAGE_ACCESS_TOKEN;
        this.apiVersion = apiVersion;
    }

    /**
     * Contract implementation
     */
    capabilities() {
        return {
            platform: 'messenger',
            audio: false,
            templates: false,
            buttons: true
        };
    }

    /**
     * Envía un mensaje a un usuario a través de Messenger
     */
    async sendMessage(recipientId, text) {
        if (!this.accessToken) throw new Error('Missing FB Page Access Token');
        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/me/messages?access_token=${this.accessToken}`;
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
    }
}

module.exports = FacebookMessengerAPI;

/**
 * instagramDirectAPI.js
 * Conector para la API de Instagram Direct (IGDM).
 */
const axios = require('axios');
const { logError, logInfo } = require('../utils/logger');

class InstagramDirectAPI {
    /**
     * @param {string} accessToken
     * @param {string} [apiVersion]
     */
    constructor(accessToken, apiVersion = 'v19.0') {
        this.accessToken = accessToken || process.env.IG_ACCESS_TOKEN;
        this.apiVersion = apiVersion;
    }

    /**
     * Contract implementation
     */
    capabilities() {
        return {
            platform: 'instagram',
            audio: false,
            templates: false,
            buttons: true
        };
    }

    /**
     * Envía un mensaje a un usuario a través de Instagram Direct
     */
    async sendMessage(recipientId, text) {
        if (!this.accessToken) throw new Error('Missing IG Access Token');
        try {
            const url = `https://graph.facebook.com/${this.apiVersion}/me/messages?access_token=${this.accessToken}`;
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
    }
}

module.exports = InstagramDirectAPI;

/**
 * WhatsApp Cloud API Service
 * Official Meta WhatsApp Business API Integration
 */

const axios = require('axios');

class WhatsAppCloudAPI {
    /**
     * @param {Object} config
     * @param {string} config.accessToken
     * @param {string} config.phoneNumberId
     * @param {string} [config.apiVersion]
     * @param {string} [config.webhookVerifyToken]
     */
    constructor(config = {}) {
        this.accessToken = config.accessToken;
        this.phoneNumberId = config.phoneNumberId;
        this.apiVersion = config.apiVersion || 'v18.0';
        this.baseUrl = `https://graph.facebook.com/${this.apiVersion}`;
        this.webhookVerifyToken = config.webhookVerifyToken;

        if (!this.accessToken || !this.phoneNumberId) {
            console.warn(`⚠️ WhatsApp Cloud API [${this.phoneNumberId || 'unknown'}] credentials missing in config`);
        }
    }

    /**
     * Contract implementation for AdapterFactory
     */
    capabilities() {
        return {
            platform: 'whatsapp_cloud',
            audio: true,
            templates: true,
            buttons: true
        };
    }

    /**
     * Send a message (text or media)
     * Aligned with MessageAdapter interface
     */
    async sendMessage(to, text, options = {}) {
        if (!this.accessToken || !this.phoneNumberId) throw new Error('Missing Cloud API credentials');
        
        const { mediaUrl, mediaType } = options;
        
        try {
            let payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to
            };

            if (mediaUrl) {
                // Meta Cloud API uses different endpoints for media usually (upload first), 
                // but some implementations allow URLs for certain types or use a proxy.
                // For this SaaS, we currently send text only for Cloud API in the main flow, 
                // but we can add native media support here.
                payload.type = mediaType === 'image' ? 'image' : mediaType === 'video' ? 'video' : mediaType === 'audio' ? 'audio' : 'document';
                payload[payload.type] = { link: mediaUrl };
                if (text && mediaType !== 'audio') payload[payload.type].caption = text;
            } else {
                payload.type = 'text';
                payload.text = { body: text };
            }

            const response = await axios.post(
                `${this.baseUrl}/${this.phoneNumberId}/messages`,
                payload,
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    },
                    timeout: 20000 
                }
            );

            return response.data;
        } catch (error) {
            const errorMsg = error.response?.data || error.message;
            console.error('❌ WhatsApp Cloud API Error:', JSON.stringify(errorMsg, null, 2));
            throw error;
        }
    }

    /**
     * Send a template message
     */
    async sendTemplate(to, templateName, languageCode = 'es') {
        try {
            const response = await axios.post(
                `${this.baseUrl}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    to: to,
                    type: 'template',
                    template: {
                        name: templateName,
                        language: { code: languageCode }
                    }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('❌ Error sending template:', error.response?.data || error.message);
            throw error;
        }
    }

    async sendAudio(to, mediaId) {
        try {
            await axios.post(
                `${this.baseUrl}/${this.phoneNumberId}/messages`,
                {
                    messaging_product: 'whatsapp',
                    recipient_type: 'individual',
                    to: to,
                    type: 'audio',
                    audio: { id: mediaId }
                },
                {
                    headers: {
                        'Authorization': `Bearer ${this.accessToken}`,
                        'Content-Type': 'application/json'
                    }
                }
            );
        } catch (error) {
            console.error('❌ Error sending audio:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Verify webhook (for Meta setup)
     */
    verifyWebhook(mode, token, challenge) {
        if (mode === 'subscribe' && token === this.webhookVerifyToken) {
            return challenge;
        }
        return null;
    }

    /**
     * Get API status
     */
    getStatus() {
        return {
            configured: !!(this.accessToken && this.phoneNumberId),
            phoneNumberId: this.phoneNumberId,
            apiVersion: this.apiVersion
        };
    }
}

// Export the class itself
module.exports = WhatsAppCloudAPI;

const axios = require('axios');

const API_URL = process.env.DIALOG360_API_URL || 'https://hub.360dialog.io/api/v2';
const DIALOG360_KEY = process.env.DIALOG360_API_KEY;

class Dialog360Service {
    /**
     * @param {Object} config
     * @param {string} config.apiKey
     * @param {string} [config.baseUrl]
     */
    constructor(config = {}) {
        this.apiKey = config.apiKey || process.env.DIALOG360_API_KEY;
        this.baseUrl = config.baseUrl || process.env.DIALOG360_API_URL || 'https://waba-v2.360dialog.io'; // Note: V2 is standard now
        
        this.client = axios.create({
            baseURL: this.baseUrl,
            headers: {
                'D360-API-KEY': this.apiKey,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Generic message sender for AdapterFactory
     */
    async sendMessage(to, text, options = {}) {
        const { mediaUrl, mediaType } = options;
        
        try {
            let payload = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to
            };

            if (mediaUrl) {
                payload.type = mediaType === 'image' ? 'image' : mediaType === 'video' ? 'video' : mediaType === 'audio' ? 'audio' : 'document';
                payload[payload.type] = { link: mediaUrl };
                if (text && mediaType !== 'audio') payload[payload.type].caption = text;
            } else {
                payload.type = 'text';
                payload.text = { body: text };
            }

            const response = await this.client.post('/messages', payload);
            return response.data;
        } catch (error) {
            console.error('❌ 360Dialog Error:', error.response?.data || error.message);
            throw error;
        }
    }

    // Classic methods kept for backward compatibility if needed, but refactored to use generic sendMessage
    async sendTextMessage(phone, text) {
        return this.sendMessage(phone, text);
    }

    async sendImageMessage(phone, imageUrl, caption = '') {
        return this.sendMessage(phone, caption, { mediaUrl: imageUrl, mediaType: 'image' });
    }

    async sendAudioMessage(phone, audioUrl) {
        return this.sendMessage(phone, '', { mediaUrl: audioUrl, mediaType: 'audio' });
    }

    async sendTemplateMessage(phone, templateName, components = []) {
        try {
            const response = await this.client.post('/messages', {
                messaging_product: 'whatsapp',
                to: phone,
                type: 'template',
                template: {
                    name: templateName,
                    language: { code: 'es' },
                    components
                }
            });
            return response.data;
        } catch (error) {
            console.error('❌ 360Dialog Template Error:', error.response?.data || error.message);
            throw error;
        }
    }

    async getAccountInfo() {
        try {
            const response = await this.client.get('/account');
            return response.data;
        } catch (error) {
            console.error('❌ 360Dialog Account Error:', error.response?.data || error.message);
            throw error;
        }
    }

    async getWebhooks() {
        try {
            const response = await this.client.get('/webhooks');
            return response.data;
        } catch (error) {
            console.error('❌ 360Dialog Webhooks Error:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = Dialog360Service;

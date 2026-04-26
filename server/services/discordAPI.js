/**
 * discordAPI.js
 * Standardized adapter for Discord Bot API.
 */

const axios = require('axios');

class DiscordAPI {
    constructor(credentials = {}) {
        this.token = credentials.accessToken || credentials.discordToken;
        this.baseUrl = 'https://discord.com/api/v10';
    }

    /**
     * returns standardized capabilities
     */
    getCapabilities() {
        return {
            canSendMedia: true,
            canReply: true,
            platform: 'discord'
        };
    }

    /**
     * Send a message to a Discord channel or user
     * @param {string} to - Channel ID or User ID (for DM)
     * @param {string} text - Message content
     */
    async sendMessage(to, text) {
        if (!this.token) throw new Error('[Discord] Missing bot token');
        
        try {
            const response = await axios.post(`${this.baseUrl}/channels/${to}/messages`, {
                content: text
            }, {
                headers: {
                    'Authorization': `Bot ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            return {
                success: true,
                messageId: response.data.id,
                platform: 'discord'
            };
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            console.error('[Discord] sendMessage failed:', errorMsg);
            throw new Error(`[Discord] ${errorMsg}`);
        }
    }
}

module.exports = DiscordAPI;

/**
 * redditAPI.js
 * Standardized adapter for Reddit Private Messaging.
 */

const axios = require('axios');
const qs = require('querystring');

class RedditAPI {
    constructor(credentials = {}) {
        this.clientId = credentials.clientId;
        this.clientSecret = credentials.clientSecret;
        this.username = credentials.username;
        this.password = credentials.password;
        this.userAgent = credentials.userAgent || 'ALEX IO V5 Multi-Channel Bot';
        this.accessToken = null;
    }

    /**
     * returns standardized capabilities
     */
    getCapabilities() {
        return {
            canSendMedia: false, // Reddit DMs are text-heavy
            canReply: true,
            platform: 'reddit'
        };
    }

    /**
     * Refresh OAuth2 token for Reddit
     */
    async refreshAccessToken() {
        if (!this.clientId || !this.clientSecret || !this.username || !this.password) {
            throw new Error('[Reddit] Missing credentials (clientId, secret, user, pass)');
        }

        const auth = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
        try {
            const response = await axios.post('https://www.reddit.com/api/v1/access_token', 
                qs.stringify({
                    grant_type: 'password',
                    username: this.username,
                    password: this.password
                }), {
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': this.userAgent
                }
            });

            this.accessToken = response.data.access_token;
            return this.accessToken;
        } catch (error) {
            console.error('[Reddit] Auth failed:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Send a Private Message on Reddit
     * @param {string} to - Reddit username
     * @param {string} text - Message content
     */
    async sendMessage(to, text) {
        if (!this.accessToken) await this.refreshAccessToken();
        
        try {
            const response = await axios.post('https://oauth.reddit.com/api/compose', 
                qs.stringify({
                    api_type: 'json',
                    subject: 'Mensaje de ALEX IO',
                    text: text,
                    to: to
                }), {
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'User-Agent': this.userAgent
                }
            });

            return {
                success: true,
                platform: 'reddit'
            };
        } catch (error) {
            if (error.response?.status === 401) {
                // Retry once
                await this.refreshAccessToken();
                return this.sendMessage(to, text);
            }
            console.error('[Reddit] sendMessage failed:', error.response?.data || error.message);
            throw error;
        }
    }
}

module.exports = RedditAPI;

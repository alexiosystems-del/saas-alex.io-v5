/**
 * messageAdapter.js
 * Base class for all messaging adapters (WhatsApp, Discord, TikTok, etc.)
 */

class MessageAdapter {
    /**
     * Standard interface for sending messages across any provider.
     * @param {string} to - Destination ID/Phone
     * @param {string} text - Message content
     * @param {Object} [options] - Media, buttons, etc.
     */
    async sendMessage(to, text, options = {}) {
        throw new Error('sendMessage not implemented');
    }

    /**
     * Optional: Send audio content if supported by the provider.
     * @param {string} to - Destination ID/Phone
     * @param {Buffer} buffer - Audio file buffer
     * @param {Object} [options] - Additional parameters
     */
    async sendVoiceNote(to, buffer, options = {}) {
        throw new Error('sendVoiceNote (audio) not implemented');
    }
}

module.exports = { MessageAdapter };

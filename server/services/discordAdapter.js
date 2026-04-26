/**
 * discordAdapter.js
 * Adaptador Enterprise para Discord.
 * Maneja la comunicación Outbound (enviar mensajes) hacia la API de Discord.
 */
const axios = require('axios');
const { MessageAdapter } = require('./messageAdapter');
const { logError, logInfo } = require('../utils/logger');
const { trackEvent } = require('./observability');
const crypto = require('crypto');

class DiscordAdapter extends MessageAdapter {
    /**
     * @param {string} instanceId
     * @param {Object} config - Configuración cargada de la DB (credenciales, etc.)
     */
    constructor(instanceId, config = {}) {
        super();
        this.instanceId = instanceId;
        this.config = config;
        this.token = config.credentials?.botToken || process.env.DISCORD_BOT_TOKEN;
        this.baseUrl = 'https://discord.com/api/v10';
    }

    /**
     * Envía un mensaje a un canal o usuario de Discord.
     * @param {string} to - Channel ID o User ID (Discord maneja ruteo por ChannelID mayormente)
     * @param {string} text - Contenido del mensaje
     */
    async sendMessage(to, text, options = {}) {
        if (!this.token) {
            logError(`[DiscordAdapter] Error: No hay botToken configurado para la instancia ${this.instanceId}`);
            throw new Error('Bot token missing');
        }

        const start = Date.now();
        try {
            logInfo(`[DiscordAdapter] Enviando mensaje a Discord channel: ${to}`);
            
            const response = await axios.post(
                `${this.baseUrl}/channels/${to}/messages`,
                { content: text },
                {
                    headers: {
                        'Authorization': `Bot ${this.token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            logInfo(`[DiscordAdapter] Mensaje enviado con éxito. ID: ${response.data.id}`);

            return {
                success: true,
                messageId: response.data.id,
                platform: 'discord',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message;
            logError(`[DiscordAdapter] Error enviando mensaje a Discord (${to}):`, errorMsg);
            
            trackEvent({
                event_id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
                instance_id: this.instanceId,
                channel: 'discord',
                direction: 'outbound',
                status: 'error',
                error_message: errorMsg,
                latency_ms: Date.now() - start
            });

            throw error;
        }
    }

    /**
     * Verifica la salud de la conexión/token
     */
    async checkHealth() {
        try {
            await axios.get(`${this.baseUrl}/users/@me`, {
                headers: { 'Authorization': `Bot ${this.token}` }
            });
            return { status: 'healthy', timestamp: new Date().toISOString() };
        } catch (e) {
            return { status: 'unhealthy', error: e.message, timestamp: new Date().toISOString() };
        }
    }
}

module.exports = DiscordAdapter;

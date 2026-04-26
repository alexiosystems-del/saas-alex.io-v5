/**
 * adapterFactory.js
 * Universal factory for communication channel adapters.
 */

const WhatsAppCloudAPI = require('./whatsappCloudAPI');
const TikTokAPI = require('./tiktokAdapter');
const WebchatAPI = require('./webchatAPI');
const FacebookMessengerAPI = require('./facebookMessengerAPI');
const InstagramDirectAPI = require('./instagramDirectAPI');
const DiscordAPI = require('./discordAdapter');
const RedditAPI = require('./redditAPI');
const Dialog360Service = require('./dialog360Service');
const { loadInstanceConfig } = require('./instanceLoader');
const { logError, logInfo } = require('../utils/logger');

// In-memory cache for instanced adapters (persistent connections)
const adapterCache = new Map(); // key: instance_id

/**
 * Base class for all messaging adapters
 */
const { MessageAdapter } = require('./messageAdapter');

/**
 * Baileys Adapter wrapper (for local/QR sessions)
 * Note: Depends on external socket management for now
 */
class BaileysAdapter extends MessageAdapter {
    constructor(instanceId, socketMap) {
        super();
        this.instanceId = instanceId;
        this.socketMap = socketMap;
    }

    async sendMessage(to, text, options = {}) {
        const sock = this.socketMap.get(this.instanceId);
        if (!sock) throw new Error(`[BaileysAdapter] No active socket for ${this.instanceId}`);
        
        const jid = to.includes('@s.whatsapp.net') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`;

        const { mediaUrl, mediaType, ...restOptions } = options;

        // If media is provided, build proper Baileys media payload
        if (mediaUrl) {
            let msg;
            switch (mediaType) {
                case 'image':
                    msg = { image: { url: mediaUrl }, caption: text || undefined, ...restOptions };
                    break;
                case 'video':
                    msg = { video: { url: mediaUrl }, caption: text || undefined, ...restOptions };
                    break;
                case 'audio':
                    msg = { audio: { url: mediaUrl }, mimetype: 'audio/mpeg', ptt: true, ...restOptions };
                    break;
                case 'document':
                    msg = { document: { url: mediaUrl }, mimetype: 'application/pdf', fileName: 'documento.pdf', caption: text || undefined, ...restOptions };
                    break;
                default:
                    // Unknown media type, send as text with link
                    msg = { text: `${text || ''}\n${mediaUrl}`.trim(), ...restOptions };
            }
            return sock.sendMessage(jid, msg);
        }

        // Text-only message
        return sock.sendMessage(jid, { text, ...restOptions });
    }

    async sendVoiceNote(to, buffer, options = {}) {
        const sock = this.socketMap.get(this.instanceId);
        if (!sock) throw new Error(`[BaileysAdapter] No active socket for ${this.instanceId}`);
        
        const jid = to.includes('@s.whatsapp.net') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`;
        return sock.sendMessage(jid, {
            audio: buffer,
            mimetype: 'audio/ogg; codecs=opus',
            ptt: true,
            ...options
        });
    }
}

/**
 * Convenience method to load config and get adapter in one go.
 */
async function getAdapterByInstanceId(instanceId, socketMap = null) {
    if (!instanceId) return null;
    const config = await loadInstanceConfig(instanceId);
    if (!config) return null;
    return getAdapter(config, socketMap);
}

/**
 * Creates or returns a cached adapter for a given bot configuration.
 * @param {Object} config - Loaded via InstanceLoader
 * @param {Map} [socketMap] - Required for Baileys provider
 * @param {Object} [hooks] - Optional logging/status hooks
 */
function getAdapter(config, socketMap = null, hooks = {}) {
    if (!config || !config.instanceId) return null;

    // Return cached if exists and provider matches
    if (adapterCache.has(config.instanceId)) {
        const cached = adapterCache.get(config.instanceId);
        if (cached.provider === config.provider) return cached.instance;
    }

    try {
        let instance = null;

        switch (config.provider?.toLowerCase()) {
            case 'baileys':
                if (!socketMap) {
                    logError(`[AdapterFactory] Cannot create BaileysAdapter without socketMap for ${config.instanceId}`);
                    return null;
                }
                instance = new BaileysAdapter(config.instanceId, socketMap);
                break;

            case 'whatsapp':
            case 'whatsapp_cloud':
            case 'meta':
                logInfo(`[AdapterFactory] Creating WhatsApp Cloud adapter for ${config.instanceId}`);
                instance = new WhatsAppCloudAPI(config.credentials);
                break;

            case '360dialog':
                logInfo(`[AdapterFactory] Creating 360Dialog adapter for ${config.instanceId}`);
                instance = new Dialog360Service({ apiKey: config.credentials?.dialogApiKey });
                break;
            
            case 'tiktok':
                logInfo(`[AdapterFactory] Creating TikTok adapter for ${config.instanceId}`);
                instance = new TikTokAPI(config.credentials);
                break;
            
            case 'discord':
                logInfo(`[AdapterFactory] Creating Discord adapter for ${config.instanceId}`);
                instance = new DiscordAPI(config.instanceId, config, hooks);
                break;

            case 'reddit':
                logInfo(`[AdapterFactory] Creating Reddit adapter for ${config.instanceId}`);
                instance = new RedditAPI(config.credentials);
                break;

            case 'webchat':
                logInfo(`[AdapterFactory] Creating Webchat adapter for ${config.instanceId}`);
                instance = new WebchatAPI(config);
                break;

            case 'messenger':
                logInfo(`[AdapterFactory] Creating Messenger adapter for ${config.instanceId}`);
                instance = new FacebookMessengerAPI(config.credentials);
                break;

            case 'instagram':
                logInfo(`[AdapterFactory] Creating Instagram adapter for ${config.instanceId}`);
                instance = new InstagramDirectAPI(config.credentials);
                break;

            default:
                logError(`[AdapterFactory] Unsupported provider: ${config.provider}`);
                return null;
        }

        if (instance) {
            adapterCache.set(config.instanceId, { instance, provider: config.provider });
        }

        return instance;
    } catch (err) {
        logError(`[AdapterFactory] Failed to create adapter for ${config.instanceId}`, err);
        return null;
    }
}

/**
 * Clears a specific instance from the cache to force re-initialization.
 * Used for soft-reconnects and credential updates.
 */
function clearAdapterCache(instanceId) {
    if (adapterCache.has(instanceId)) {
        logInfo(`[AdapterFactory] Clearing adapter cache for ${instanceId}`);
        adapterCache.delete(instanceId);
        return true;
    }
    return false;
}

module.exports = { getAdapter, getAdapterByInstanceId, clearAdapterCache, MessageAdapter, BaileysAdapter };

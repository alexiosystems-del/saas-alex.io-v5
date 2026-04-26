/**
 * tiktokAdapter.js — Adapter TikTok para ALEX IO (Production Ready)
 *
 * Fixes:
 * - super() en constructor (herencia correcta de MessageAdapter)
 * - Resolución de instanceId robusta (instanceId > seller_id > shop_id)
 * - Pasa por messageRouter (nunca directo a alexBrain)
 * - Log warn cuando se usa campo de fallback
 *
 * CommonJS — adaptado para ALEX IO multi-tenant
 */

const { MessageAdapter } = require('./messageAdapter');
const tiktokAPI = require('./tiktokAPI');
const pino = require('pino');

const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

class TikTokAdapter extends MessageAdapter {
    /**
     * @param {string} instanceId
     * @param {Object} config
     * @param {Object} hooks
     */
    constructor(instanceId, config, hooks = {}) {
        super(); // Fix: herencia correcta de MessageAdapter

        this.instanceId = instanceId;
        this.config = config;
        this.hooks = hooks;
        this.provider = 'tiktok';
    }

    async sendMessage(to, text) {
        return tiktokAPI.sendMessage(to, text);
    }

    /**
     * TikTok is webhook-based for inbound — init just sets status.
     */
    async init() {
        logger.info({ instanceId: this.instanceId, event: 'tiktok_adapter_init' },
            'TikTok adapter initialized');
        if (this.hooks.updateSessionStatus) {
            await this.hooks.updateSessionStatus(this.instanceId, 'online', {
                companyName: this.config.companyName,
                provider: 'tiktok'
            });
        }
    }

    /**
     * Normalize TikTok webhook payload to ALEX IO standardized format.
     * Used by webhooks-multi.js handler.
     */
    static normalizePayload(body, requestId) {
        // userId: open_id es el identificador estable del usuario en TikTok
        const userId = body?.data?.sender?.id
            || body?.open_id
            || body?.user_id;

        if (!userId) {
            throw Object.assign(new Error('Missing TikTok user identifier'), { status: 400 });
        }

        // message text extraction
        const text = body?.data?.message?.text
            || body?.message?.text
            || body?.text
            || '';

        if (!text) {
            logger.warn({ requestId, event: 'tiktok_empty_message', userId },
                'No message text found in TikTok payload');
        }

        // instanceId: prioridad instanceId explícito > seller_id > shop_id > open_id
        let instanceId = null;
        let instanceSource = null;

        if (body.instanceId)     { instanceId = body.instanceId; instanceSource = 'instanceId'; }
        else if (body.seller_id) { instanceId = body.seller_id;  instanceSource = 'seller_id'; }
        else if (body.shop_id)   { instanceId = body.shop_id;    instanceSource = 'shop_id'; }
        else if (body.open_id)   { instanceId = body.open_id;    instanceSource = 'open_id'; }

        if (instanceSource && instanceSource !== 'instanceId') {
            logger.warn({ requestId, event: 'tiktok_instanceid_fallback',
                field_used: instanceSource },
                `instanceId not in payload, using ${instanceSource} as fallback`);
        }

        return { userId, text, instanceId, instanceSource };
    }
}

module.exports = TikTokAdapter;

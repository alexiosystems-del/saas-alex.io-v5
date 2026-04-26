/**
 * webhookBroker.js
 * Centralized broker for resolving instance_id from platform-specific signals.
 */

const { supabaseAdmin } = require('./supabaseClient');
const { logError, logInfo } = require('../utils/logger');

/**
 * Resolves the instance_id based on a platform and a provider-specific identifier.
 * @param {string} platform - 'whatsapp', 'messenger', 'instagram', 'tiktok', etc.
 * @param {string} providerId - pageId, phoneId, sellerId, etc.
 * @returns {Promise<string|null>}
 */
async function resolveInstanceId(platform, providerId) {
    if (!supabaseAdmin) return null;
    if (!providerId) return null;

    try {
        // First try the new unified channel_instances table (Enterprise V5)
        const { data: channelData, error: channelError } = await supabaseAdmin
            .from('channel_instances')
            .select('instance_id')
            .eq('external_mapping_key', String(providerId))
            .eq('status', 'active')
            .single();

        if (channelData) return channelData.instance_id;

        // Fallback to legacy whatsapp_sessions (Migration Phase)
        const { data, error } = await supabaseAdmin
            .from('whatsapp_sessions')
            .select('instance_id')
            .eq('external_mapping_key', String(providerId))
            .single();

        if (error && error.code !== 'PGRST116') {
            logError(`[WebhookBroker] DB Error for ${platform}:${providerId}`, error.message);
        }

        return data?.instance_id || null;
    } catch (err) {
        logError(`[WebhookBroker] Critical error resolving ${platform}:${providerId}`, err.message);
        return null;
    }
}

module.exports = { resolveInstanceId };

/**
 * instanceLoader.js
 * Specialized service to load bot instance configurations from Supabase.
 * Handles decryption of sensitive credentials.
 */

const { supabase, isSupabaseEnabled } = require('./supabaseClient');
const { decrypt } = require('../utils/encryptionHelper');
const { logError } = require('../utils/logger');

/**
 * Loads the configuration for a specific bot instance.
 * @param {string} instanceId 
 * @returns {Promise<Object|null>}
 */
const loadInstanceConfig = async (instanceId) => {
    if (!instanceId) return null;

    try {
        if (!isSupabaseEnabled) {
            console.warn(`[InstanceLoader] Supabase disabled, cannot load config for ${instanceId}`);
            return null;
        }

        const { data, error } = await supabase
            .from('whatsapp_sessions')
            .select('*')
            .eq('instance_id', instanceId)
            .single();

        if (error || !data) {
            // Suppress error for transient multi-channel instances (WebChat, Discord, etc.)
            if (error?.code !== 'PGRST116' && !instanceId.startsWith('multi_') && !instanceId.startsWith('web_')) {
                logError(`[InstanceLoader] Error loading instance ${instanceId}:`, error?.message);
            }
            
            // Return a default config for instances without a session record
            return {
                instanceId,
                tenantId: 'default',
                personality: {
                    botName: 'ALEX IO',
                    demoMode: false
                }
            };
        }

        // Base configuration (Connection info)
        const config = {
            instanceId: data.instance_id,
            tenantId: data.tenant_id,
            companyName: data.company_name,
            ownerEmail: data.owner_email,
            provider: data.provider || 'baileys',
            status: data.status,
            credentials: {},
            personality: {} // New: behavior/sales info
        };

        // Load personality from bot_configs (Join or follow mapping)
        // Note: In V5, we try to find the bot_config linked to this instance
        const { data: botData, error: botError } = await supabase
            .from('bot_configs')
            .select('*')
            .eq('instance_id', instanceId) // Assuming direct instance_id mapping for simplicity in V5
            .single();

        if (botData) {
            config.personality = {
                botName: botData.bot_name,
                systemPrompt: botData.system_prompt,
                constitution: botData.constitution,
                conversationStructure: botData.conversation_structure,
                conversionGoal: botData.conversion_goal,
                ctaLink: botData.cta_link,
                demoMode: botData.demo_mode
            };
        } else {
            // Fallback for legacy instances without explicit bot_config yet
            config.personality = {
                botName: data.company_name || 'ALEX IO',
                systemPrompt: 'Eres ALEX IO, asistente virtual inteligente.',
                demoMode: false
            };
        }

        // Decrypt credentials

        // Decrypt credentials
        if (data.credentials_encrypted) {
            try {
                if (typeof data.credentials_encrypted === 'string') {
                    // Modern V5 format: One encrypted JSON string
                    const decrypted = JSON.parse(decrypt(data.credentials_encrypted));
                    config.credentials = { ...config.credentials, ...decrypted };
                } else if (typeof data.credentials_encrypted === 'object') {
                    // Legacy/Alternative format: Individual encrypted fields
                    for (const [key, value] of Object.entries(data.credentials_encrypted)) {
                        config.credentials[key] = decrypt(value);
                    }
                }
            } catch (e) {
                logError(`[InstanceLoader] Decryption failed for ${instanceId}:`, e.message);
            }
        }

        return config;
    } catch (err) {
        logError(`[InstanceLoader] Critical failure loading ${instanceId}:`, err.message);
        return null;
    }
};

module.exports = { loadInstanceConfig };

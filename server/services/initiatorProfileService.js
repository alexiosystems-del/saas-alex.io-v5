const { supabase } = require('./supabaseClient');

/**
 * Initiator Profile Service
 * Gestiona la estrategia central (BIC) de cada bot.
 */
class InitiatorProfileService {
    
    /**
     * Obtiene el perfil de estrategia de un bot.
     * Si no existe, devuelve null para que el runtime use el fallback actual.
     */
    async getProfile(botId) {
        try {
            const { data, error } = await supabase
                .from('bot_initiator_profile')
                .select('*')
                .eq('bot_id', botId)
                .single();
            
            if (error) {
                if (error.code !== 'PGRST116') { // No encontrado es aceptable
                    console.error(`[InitiatorService] Error al leer perfil de ${botId}:`, error.message);
                }
                return null;
            }
            return data;
        } catch (e) {
            return null;
        }
    }

    /**
     * Guarda o actualiza la estrategia BIC.
     */
    async saveProfile(botId, tenantId, profileData) {
        const payload = {
            bot_id: botId,
            tenant_id: tenantId,
            bot_name: profileData.botName || 'Nuevo Bot',
            business_type: profileData.businessType,
            main_goal: profileData.mainGoal,
            value_prop: profileData.valueProp,
            tone: profileData.tone || 'professional',
            base_language: profileData.baseLanguage || 'es',
            allowed_languages: profileData.allowedLanguages || ['es', 'en'],
            primary_cta: profileData.primaryCta,
            updated_at: new Date().toISOString()
        };

        const { data, error } = await supabase
            .from('bot_initiator_profile')
            .upsert(payload, { onConflict: 'bot_id' })
            .select('*')
            .single();

        if (error) throw new Error(`Error al guardar perfil BIC: ${error.message}`);
        return data;
    }

    /**
     * Verifica si un bot está listo para "Go Live"
     */
    async checkReadiness(botId) {
        const profile = await this.getProfile(botId);
        if (!profile) return { isReady: false, reason: 'No initiator profile' };

        const readiness = profile.readiness_json || {};
        const isReady = readiness.initiator && readiness.prompt;
        
        return {
            isReady,
            score: profile.qa_score,
            readiness
        };
    }
}

module.exports = new InitiatorProfileService();

const { supabase } = require('./supabaseClient');
const { redis, isRedisEnabled } = require('./redisService');

/**
 * Dual Memory Service (SaaS Enterprise v5)
 * STM: Redis (Fast, TTL based)
 * LTM: Postgres (Persistent, Fact based)
 */
class MemoryService {
    
    /**
     * Guarda memoria del usuario.
     * Si FEATURE_MEMORY_DUAL está activo, guarda en ambos.
     */
    async saveMemory(tenantId, customerId, data) {
        try {
            // Guardrail: Validación mínima
            if (!tenantId || !customerId) return;

            // 1. STM (Redis) - Solo si Redis está habilitado
            if (isRedisEnabled && global.FLAGS.FEATURE_MEMORY_DUAL) {
                const stmKey = `stm:${tenantId}:${customerId}`;
                await redis.set(stmKey, JSON.stringify(data), 'EX', 3600); // Expira en 1 hora
            }

            // 2. LTM (Postgres) - Tabla user_memory_profiles
            // Extraemos solo "hechos" para no saturar la DB relacional
            if (data.facts && data.facts.length > 0) {
                await supabase.from('user_memory_profiles').upsert({
                    tenant_id: tenantId,
                    customer_id: customerId,
                    facts: data.facts,
                    last_interaction: new Date().toISOString()
                }, { onConflict: 'tenant_id,customer_id' });
            }
        } catch (err) {
            console.warn('⚠️ [MemoryService] Fallo al guardar memoria:', err.message);
        }
    }

    /**
     * Recupera la memoria unificada.
     */
    async getMemory(tenantId, customerId) {
        try {
            let stmContext = {};
            let ltmFacts = [];

            // 1. Intentar STM
            if (isRedisEnabled && global.FLAGS.FEATURE_MEMORY_DUAL) {
                const cached = await redis.get(`stm:${tenantId}:${customerId}`);
                if (cached) stmContext = JSON.parse(cached);
            }

            // 2. Intentar LTM (Factores persistentes)
            const { data: ltm } = await supabase
                .from('user_memory_profiles')
                .select('facts')
                .eq('tenant_id', tenantId)
                .eq('customer_id', customerId)
                .single();
            
            if (ltm) ltmFacts = ltm.facts;

            return {
                ...stmContext,
                persistedFacts: ltmFacts
            };
        } catch (err) {
            return { persistedFacts: [] };
        }
    }
}

module.exports = new MemoryService();

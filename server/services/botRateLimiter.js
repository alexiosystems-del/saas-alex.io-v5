const { redis, isRedisEnabled } = require('./redisService');

class BotRateLimiter {
    /**
     * Revisa si el bot ha excedido su límite.
     * Implementa Sliding Window o Token Bucket usando Redis.
     * @param {string} botId 
     * @param {number} limit Mensajes permitidos
     * @param {number} windowMs Ventana de tiempo en ms
     * @returns {Promise<boolean>} true si está permitido, false si se excedió
     */
    static async isAllowed(botId, limit = 50, windowMs = 60000) {
        if (!isRedisEnabled) return true; // Fallback permisivo

        const key = `rate:bot:${botId}`;
        const now = Date.now();
        const clearBefore = now - windowMs;

        try {
            const pipeline = redis.pipeline();
            // Limpia timestamps viejos
            pipeline.zremrangebyscore(key, 0, clearBefore);
            // Agrega el actual
            pipeline.zadd(key, now, now.toString() + Math.random());
            // Cuenta cuántos quedan
            pipeline.zcard(key);
            // Expira la llave para que no quede huérfana
            pipeline.pexpire(key, windowMs);

            const results = await pipeline.exec();
            const count = results[2][1]; // Resultado del zcard

            return count <= limit;
        } catch (e) {
            console.error('[RateLimiter] Error:', e.message);
            return true; // En caso de fallo en Redis, permitimos para no bloquear operaciones
        }
    }
}

module.exports = BotRateLimiter;

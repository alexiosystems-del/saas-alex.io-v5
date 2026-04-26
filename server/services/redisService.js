const Redis = require('ioredis');
const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

let redis = null;
const redisUrl = process.env.REDIS_URL;

if (redisUrl && /^rediss?:\/\/.+/i.test(redisUrl)) {
    try {
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => {
                if (times > 3) {
                    logger.warn(`⚠️ Redis: Giving up after ${times} retries, using memory fallback`);
                    return null; // Stop retrying
                }
                return Math.min(times * 500, 2000);
            },
            lazyConnect: false,
            enableOfflineQueue: false,
        });

        redis.on('error', (err) => {
            logger.warn(`⚠️ Redis error (non-fatal): ${err.message}`);
        });

        redis.on('connect', () => {
            logger.info('✅ Redis connected');
        });
    } catch (e) {
        logger.warn('⚠️ Redis initialization failed');
        redis = null;
    }
}

module.exports = {
    redis,
    isRedisEnabled: Boolean(redis),
    // Simple distributed lock
    acquireLock: async (key, ttlMs = 30000) => {
        if (!redis) return true; // Insecure fallback if no Redis
        const result = await redis.set(key, 'locked', 'PX', ttlMs, 'NX');
        return result === 'OK';
    },
    releaseLock: async (key) => {
        if (!redis) return;
        await redis.del(key);
    }
};

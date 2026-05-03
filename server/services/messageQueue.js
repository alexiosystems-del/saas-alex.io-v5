const { redis, isRedisEnabled } = require('./redisService');
const { logInfo, logError } = require('../utils/logger');

class MessageQueue {
    constructor(queueName) {
        this.queueName = `q:${queueName}`;
        this.processing = false;
        this.handler = null;
    }

    async enqueue(job) {
        if (!isRedisEnabled) {
            // Fallback en memoria si no hay Redis
            if (this.handler) {
                return this.handler(job);
            }
            return;
        }

        const jobId = Date.now().toString() + Math.random().toString(36).substr(2, 5);
        const payload = JSON.stringify({ id: jobId, data: job });
        
        await redis.rpush(this.queueName, payload);
        logInfo(`[MQ] Job ${jobId} enqueued to ${this.queueName}`);
        return jobId;
    }

    async process(handler) {
        this.handler = handler;
        if (!isRedisEnabled) return; // Fallback handles synchronous
        
        this.processing = true;
        this._poll();
    }

    async _poll() {
        if (!this.processing || !redis) return;

        try {
            // Espera hasta 5 segundos por un nuevo mensaje en la cola
            const result = await redis.blpop(this.queueName, 5);
            
            if (result) {
                const [_, payload] = result;
                const job = JSON.parse(payload);
                
                logInfo(`[MQ] Processing job ${job.id} from ${this.queueName}`);
                try {
                    await this.handler(job.data);
                } catch (err) {
                    logError(`[MQ] Job ${job.id} failed:`, err.message);
                    // Opcional: Implementar Dead Letter Queue (DLQ) o reintentos
                    await redis.lpush(`${this.queueName}:dlq`, payload);
                }
            }
        } catch (err) {
            logError(`[MQ] Polling error on ${this.queueName}:`, err.message);
        }

        // Continúa haciendo polling en loop
        if (this.processing) {
            setImmediate(() => this._poll());
        }
    }

    stop() {
        this.processing = false;
    }
}

module.exports = MessageQueue;

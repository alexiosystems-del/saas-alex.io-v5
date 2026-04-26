const { v4: uuidv4 } = require('uuid');
const pino = require('pino');

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    timestamp: pino.stdTimeFunctions.isoTime
});

/**
 * Middleware para logging estructurado y cálculo de latencia.
 * Inyecta un request_id único en cada petición.
 */
function requestLogger(req, res, next) {
    req.id = req.headers['x-request-id'] || uuidv4();
    const startAt = process.hrtime();

    res.on('finish', () => {
        const diff = process.hrtime(startAt);
        const timeMs = (diff[0] * 1e3) + (diff[1] * 1e-6);
        
        // SRE track event is used instead of HTTP tracker
        
        // Structured Layout para Datadog/ELK
        logger.info({
            type: 'http_access',
            request_id: req.id,
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            latency_ms: Math.round(timeMs),
            ip: req.ip,
            tenant_id: req.tenant?.id || 'anonymous'
        }, `[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${Math.round(timeMs)}ms)`);
    });

    res.on('error', (err) => {
        logger.error({
            type: 'http_error',
            request_id: req.id,
            errorMessage: err.message
        });
    });

    next();
}

module.exports = { requestLogger, logger };

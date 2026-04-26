/**
 * Centralized Logger Utility
 * Used by ESM-style services (facebookMessengerAPI, etc.)
 */
const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

function logInfo(message, meta) {
    logger.info(meta || {}, message);
}

function logError(message, meta) {
    logger.error(meta || {}, message);
}

function logWarn(message, meta) {
    logger.warn(meta || {}, message);
}

module.exports = { logInfo, logError, logWarn, logger };

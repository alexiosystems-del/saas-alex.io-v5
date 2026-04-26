const axios = require('axios');
const pino = require('pino');
const logger = pino();

// Prevent alert spam: max 1 alert per 5 minutes per category
const alertCooldowns = new Map();
const COOLDOWN_MS = 5 * 60 * 1000;

const WEBHOOK_URL = process.env.ONCALL_WEBHOOK_URL;
const PROVIDER = process.env.PAGER_PROVIDER || 'slack';

function formatPayload(type, message, severity) {
    const emoji = severity === 'CRITICAL' ? '🚨' : severity === 'WARNING' ? '⚠️' : 'ℹ️';
    const textStr = `${emoji} *[ALEX IO - ${severity}]* ${type}\n> ${message}`;

    if (PROVIDER === 'discord') {
        return { content: textStr };
    }

    // default: Slack
    return { text: textStr };
}

/**
 * Dispara una alerta al Slack/Discord del equipo On-Call (Level 1/2)
 * cuando se detectan incidentes en producción (Phase 4 Operations).
 */
async function sendPagerAlert(type, message, severity = 'WARNING') {
    if (!WEBHOOK_URL) {
        logger.error('[Pager] Missing ONCALL_WEBHOOK_URL');
        return;
    }

    const now = Date.now();
    if (alertCooldowns.has(type) && (now - alertCooldowns.get(type)) < COOLDOWN_MS) {
        return; // Muted by cooldown
    }
    
    alertCooldowns.set(type, now);

    const payload = formatPayload(type, message, severity);

    try {
        if (!WEBHOOK_URL.startsWith('http')) {
            return;
        }
        await axios.post(WEBHOOK_URL, payload, { timeout: 3000 });
        logger.info(`[Pager] Alerta enviada a On-Call (${PROVIDER}): ${type}`);
    } catch (err) {
        logger.error(`[Pager] Falló el envío de alerta a ${PROVIDER}: ${err.message}`);
    }
}

module.exports = { sendPagerAlert };

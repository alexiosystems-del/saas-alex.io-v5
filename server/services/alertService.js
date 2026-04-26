const axios = require('axios');
const pino = require('pino');
const logger = pino({ level: 'info' });

const WEBHOOK_URL = process.env.ALERT_WEBHOOK_URL;

/**
 * Sends a critical alert to external notification channels.
 */
async function sendAlert(title, message, level = 'ERROR', metadata = {}) {
    logger.info(`🚨 [ALERT] ${title}: ${message}`);
    
    if (!WEBHOOK_URL) {
        logger.warn('⚠️ ALERT_WEBHOOK_URL not configured. Alert logged but not sent.');
        return;
    }

    try {
        const payload = {
            username: 'ALEX IO SRE BOT',
            embeds: [{
                title: `${level === 'CRITICAL' ? '🔥' : '⚠️'} ${title}`,
                description: message,
                color: level === 'CRITICAL' ? 15158332 : 15844367, // Red or Yellow
                fields: Object.entries(metadata).map(([k, v]) => ({ name: k, value: String(v), inline: true })),
                timestamp: new Date().toISOString()
            }]
        };

        await axios.post(WEBHOOK_URL, payload);
    } catch (err) {
        logger.error(`❌ Failed to send alert: ${err.message}`);
    }
}

module.exports = { sendAlert };

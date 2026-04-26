const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

const states = new Map(); // { provider: { status: 'OPEN'|'HALF_OPEN'|'CLOSED', failures: 0, lastFailure: Date } }
const CONFIG = {
    MAX_FAILURES: 3,
    COOLDOWN_MS: 300000, // 5 minutes initial
    MAX_COOLDOWN_MS: 3600000 // 1 hour max
};

const getProviderState = (provider) => {
    if (!states.has(provider)) {
        states.set(provider, { status: 'CLOSED', failures: 0, lastFailure: null, cooldown: CONFIG.COOLDOWN_MS });
    }
    return states.get(provider);
};

const recordFailure = (provider, error) => {
    const state = getProviderState(provider);
    state.failures++;
    state.lastFailure = Date.now();
    
    if (state.failures >= CONFIG.MAX_FAILURES) {
        state.status = 'OPEN';
        // Exponentially increase cooldown
        state.cooldown = Math.min(state.cooldown * 2, CONFIG.MAX_COOLDOWN_MS);
        logger.error(`🔴 [CircuitBreaker] ${provider} is OPEN (failures: ${state.failures}). Cooldown: ${state.cooldown/1000}s. Reason: ${error}`);
    }
};

const recordSuccess = (provider) => {
    const state = getProviderState(provider);
    if (state.status !== 'CLOSED') {
        logger.info(`🟢 [CircuitBreaker] ${provider} reset to CLOSED after success.`);
    }
    state.status = 'CLOSED';
    state.failures = 0;
    state.cooldown = CONFIG.COOLDOWN_MS;
};

const isAvailable = (provider) => {
    const state = getProviderState(provider);
    if (state.status === 'CLOSED') return true;
    
    const timeSinceFailure = Date.now() - state.lastFailure;
    if (timeSinceFailure > state.cooldown) {
        state.status = 'HALF_OPEN';
        logger.warn(`🟡 [CircuitBreaker] ${provider} is HALF_OPEN (probing...)`);
        return true;
    }
    
    return false;
};

module.exports = { isAvailable, recordFailure, recordSuccess, getProviderState };

/**
 * operationalState.js
 * Centralized state for operational controls (Pause, Resume)
 * Shared between whatsappSaas, webhooks, and messageRouter.
 */

const pausedInstances = new Set();

module.exports = {
    /**
     * Check if a bot instance is globally paused
     */
    isPaused: (instanceId) => pausedInstances.has(instanceId),

    /**
     * Pause a bot instance
     */
    pause: (instanceId) => {
        pausedInstances.add(instanceId);
    },

    /**
     * Resume a bot instance
     */
    resume: (instanceId) => {
        pausedInstances.delete(instanceId);
    },

    /**
     * Get list of all paused instances
     */
    getPausedList: () => Array.from(pausedInstances)
};

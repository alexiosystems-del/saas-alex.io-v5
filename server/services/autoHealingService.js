const { sendPagerAlert } = require('../utils/pager');
const { supabase, isSupabaseEnabled } = require('./supabaseClient');
const operationalState = require('./operationalState');

/**
 * 4) MOTOR DE DETECCIÓN (CORE)
 */
function evaluateHealth(metric) {
    const { total, success_rate, errors } = metric;

    if (total < 20) return "INSUFFICIENT_DATA";
    if (success_rate >= 97) return "HEALTHY";
    
    if (success_rate < 97 && success_rate >= 90) {
        return "DEGRADED";
    }
    
    if (success_rate < 90 && total > 30) {
        return "CRITICAL";
    }

    return "UNKNOWN";
}

/**
 * 6) AUTO HEALING SERVICE
 */
async function updateInstanceHealth(instance_id, channel, state) {
    if (state === "DEGRADED") {
        if (isSupabaseEnabled) {
            await supabase
                .from("channel_instances")
                .update({
                    health_status: "degraded",
                    last_degraded_at: new Date().toISOString()
                })
                .eq("instance_id", instance_id);
        }
    }

    if (state === "CRITICAL") {
        await triggerAutoPause(instance_id, channel);
    }
}

async function triggerAutoPause(instance_id, channel) {
    if (operationalState.isPaused(instance_id)) return; // ya estaba pausado

    // In-memory pause (rápido para messageRouter)
    operationalState.pause(instance_id);

    if (isSupabaseEnabled) {
        await supabase
            .from("channel_instances")
            .update({
                health_status: "paused",
                auto_paused: true,
                last_paused_at: new Date().toISOString()
            })
            .eq("instance_id", instance_id);
    }

    await sendPagerAlert(
        'Auto-Pause Activado',
        `🚨 AUTO-PAUSE ACTIVATED\nInstance: ${instance_id}\nChannel: ${channel}\nReason: Critical degradation`,
        'CRITICAL'
    );
}

/**
 * 7) AUTO-RECOVERY
 */
async function attemptRecovery(instance_id, metrics) {
    const { success_rate, total } = metrics;

    if (total < 20) return;

    if (success_rate > 95) {
        // In-memory resume
        operationalState.resume(instance_id);

        if (isSupabaseEnabled) {
            await supabase
                .from("channel_instances")
                .update({
                    health_status: "active",
                    auto_paused: false,
                    recovery_attempts: 0
                })
                .eq("instance_id", instance_id);
        }

        await sendPagerAlert(
            'Auto-Recovery Éxito',
            `✅ AUTO-RECOVERY SUCCESS\nInstance: ${instance_id}\nSystem restored automatically`,
            'INFO'
        );
    }
}

module.exports = {
    evaluateHealth,
    updateInstanceHealth,
    triggerAutoPause,
    attemptRecovery
};

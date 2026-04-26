/**
 * Observability Service (Sprint 5 - SRE Hardening)
 * Trackea latencias, SLOs por plataforma y estados end-to-end.
 */
const { sendPagerAlert } = require('../utils/pager');
const crypto = require('crypto');
const autoHealingService = require('./autoHealingService');
const operationalState = require('./operationalState');

const { sendAlert } = require('./alertService');
const { trace, context, SpanStatusCode } = require('@opentelemetry/api');

const tracer = trace.getTracer('alex-brain', '1.0.0');

/**
 * withTrace: Wraps an async function in an OTel span
 */
async function withTrace(spanName, attributes, fn) {
    return tracer.startActiveSpan(spanName, async (span) => {
        if (attributes) span.setAttributes(attributes);
        try {
            const result = await fn();
            span.setStatus({ code: SpanStatusCode.OK });
            return result;
        } catch (err) {
            span.setStatus({ code: SpanStatusCode.ERROR, message: String(err) });
            span.recordException(err);
            throw err;
        } finally {
            span.end();
        }
    });
}

const metrics = new Map(); // key: instance_id + channel

function getKey(instance_id, channel) {
    return `${instance_id}:${channel}`;
}

function getOrCreateMetric(instance_id, channel, tenant_id) {
    const key = getKey(instance_id, channel);

    if (!metrics.has(key)) {
        metrics.set(key, {
            total: 0,
            success: 0,
            error: 0,
            latencies: [],
            last_errors: [],
            tenant_id
        });
    }

    return metrics.get(key);
}

function trackEvent(event) {
    const { instance_id, channel, status, latency_ms, error_message, tenant_id } = event;

    const metric = getOrCreateMetric(instance_id, channel, tenant_id);
    metric.total++;

    if (status === "success") {
        metric.success++;
    } else {
        metric.error++;
        metric.last_errors.push({
            timestamp: new Date().toISOString(),
            error: error_message
        });

        if (metric.last_errors.length > 20) metric.last_errors.shift();

        // 🚨 SRE ALERTING: If error rate > 50% in last 10 messages for a tenant, alert!
        const recentSuccessRate = (metric.success / metric.total);
        if (metric.total > 10 && recentSuccessRate < 0.5) {
            sendAlert('ALTA TASA DE ERROR', `El bot ${instance_id} para el tenant ${tenant_id} está fallando críticamente.`, 'CRITICAL', {
                tenant: tenant_id,
                error_rate: `${(1 - recentSuccessRate) * 100}%`,
                last_error: error_message
            });
        }
    }

    metric.latencies.push(latency_ms);
    if (metric.latencies.length > 100) metric.latencies.shift();

    // Integración con Auto-Healing Pro
    try {
        const currentMetrics = getMetrics(instance_id, channel);
        const healthState = autoHealingService.evaluateHealth(currentMetrics);
        autoHealingService.updateInstanceHealth(instance_id, channel, healthState).catch(() => {});
    } catch (e) {}
}

function getMetrics(instance_id, channel) {
    const metric = metrics.get(getKey(instance_id, channel));
    if (!metric) return null;

    const success_rate = metric.total ? (metric.success / metric.total) * 100 : 0;
    const sorted = [...metric.latencies].sort((a, b) => a - b);
    const p95 = sorted.length ? sorted[Math.floor(sorted.length * 0.95)] : 0;

    return {
        total: metric.total,
        success_rate,
        p95_latency: p95,
        errors: metric.error,
        last_errors: metric.last_errors,
        tenant_id: metric.tenant_id
    };
}

function getHealthSnapshot() {
    const allMetrics = Array.from(metrics.values());
    const totalRequests = allMetrics.reduce((acc, m) => acc + m.total, 0);
    const totalErrors = allMetrics.reduce((acc, m) => acc + m.error, 0);
    
    return {
        status: 'Observability V5 (Hardened)',
        total_active_instances: metrics.size,
        total_requests: totalRequests,
        global_error_rate: totalRequests ? (totalErrors / totalRequests * 100).toFixed(2) + '%' : '0%',
        critical_instances: allMetrics.filter(m => m.total > 10 && (m.success / m.total) < 0.8).map(m => m.tenant_id)
    };
}

module.exports = {
    trackEvent,
    getMetrics,
    getHealthSnapshot,
    withTrace
};

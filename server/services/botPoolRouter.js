/**
 * ═══════════════════════════════════════════════════════════════
 * 🏗️ ALEX IO — Enterprise Bot Pool Router (Phase 4/5)
 * 
 * Multi-bot orchestration with automatic failover, health checks,
 * and intelligent load distribution across bot instances.
 * ═══════════════════════════════════════════════════════════════
 */
const { supabase, isSupabaseEnabled } = require('./supabaseClient');
const circuitBreaker = require('./circuitBreaker');
const { logInfo, logError } = require('../utils/logger');

// ── BOT POOL (In-Memory Registry) ──
const botPool = new Map(); // instanceId -> { config, health, lastPing, errors }

const HEALTH = {
  HEALTHY:   'HEALTHY',
  DEGRADED:  'DEGRADED',
  DEAD:      'DEAD'
};

/**
 * Register a bot into the pool.
 */
function registerBot(instanceId, config = {}) {
  botPool.set(instanceId, {
    instanceId,
    config,
    health: HEALTH.HEALTHY,
    lastPing: Date.now(),
    errors: 0,
    totalMessages: 0,
    avgLatency: 0,
    createdAt: Date.now()
  });
  logInfo(`[BotPool] ✅ Registered bot: ${instanceId} (${config.provider || 'baileys'})`);
}

/**
 * Remove a bot from the pool.
 */
function deregisterBot(instanceId) {
  botPool.delete(instanceId);
  logInfo(`[BotPool] ❌ Deregistered bot: ${instanceId}`);
}

/**
 * Update health of a bot after a message cycle.
 */
function reportSuccess(instanceId, latencyMs) {
  const bot = botPool.get(instanceId);
  if (!bot) return;
  
  bot.errors = 0;
  bot.health = HEALTH.HEALTHY;
  bot.lastPing = Date.now();
  bot.totalMessages++;
  bot.avgLatency = Math.round((bot.avgLatency * (bot.totalMessages - 1) + latencyMs) / bot.totalMessages);
  
  circuitBreaker.recordSuccess(instanceId);
}

function reportFailure(instanceId, error) {
  const bot = botPool.get(instanceId);
  if (!bot) return;
  
  bot.errors++;
  bot.lastPing = Date.now();
  
  if (bot.errors >= 3) {
    bot.health = HEALTH.DEAD;
    logError(`[BotPool] 💀 Bot ${instanceId} marked DEAD after ${bot.errors} consecutive errors.`);
  } else if (bot.errors >= 1) {
    bot.health = HEALTH.DEGRADED;
    logInfo(`[BotPool] ⚠️ Bot ${instanceId} DEGRADED (errors: ${bot.errors})`);
  }
  
  circuitBreaker.recordFailure(instanceId, error);
}

/**
 * Get a healthy bot for a given tenant. If the primary is down, failover to another.
 */
function getHealthyBot(tenantId) {
  const candidates = [];
  
  for (const [id, bot] of botPool) {
    if (bot.config.tenantId === tenantId || !tenantId) {
      candidates.push(bot);
    }
  }
  
  if (candidates.length === 0) return null;
  
  // Sort: HEALTHY first, then DEGRADED, then by lowest latency
  candidates.sort((a, b) => {
    const healthOrder = { [HEALTH.HEALTHY]: 0, [HEALTH.DEGRADED]: 1, [HEALTH.DEAD]: 2 };
    const diff = healthOrder[a.health] - healthOrder[b.health];
    if (diff !== 0) return diff;
    return a.avgLatency - b.avgLatency;
  });
  
  // Return best non-DEAD candidate
  const best = candidates.find(c => c.health !== HEALTH.DEAD);
  
  if (!best) {
    // All bots are DEAD → attempt resurrection of least-errored one
    logError(`[BotPool] ⚠️ ALL bots for tenant ${tenantId} are DEAD. Attempting resurrection...`);
    candidates.sort((a, b) => a.errors - b.errors);
    const resurrectTarget = candidates[0];
    resurrectTarget.health = HEALTH.DEGRADED;
    resurrectTarget.errors = 0;
    return resurrectTarget;
  }
  
  return best;
}

/**
 * Get a snapshot of the entire pool for dashboard display.
 */
function getPoolStatus() {
  const status = [];
  for (const [id, bot] of botPool) {
    status.push({
      instanceId: id,
      provider: bot.config.provider || 'unknown',
      health: bot.health,
      errors: bot.errors,
      totalMessages: bot.totalMessages,
      avgLatency: bot.avgLatency,
      lastPing: bot.lastPing,
      uptime: Date.now() - bot.createdAt
    });
  }
  return status;
}

/**
 * Load all bots from Supabase on server startup and register them.
 */
async function hydratePool() {
  if (!isSupabaseEnabled) {
    logInfo('[BotPool] Supabase not enabled. Skipping hydration.');
    return;
  }
  
  try {
    const { data, error } = await supabase
      .from('whatsapp_sessions')
      .select('instance_id, company_name, provider, tenant_id, status')
      .in('status', ['online', 'active', 'connected', null]);
    
    if (error) throw error;
    
    const sessions = data || [];
    logInfo(`[BotPool] Hydrating pool with ${sessions.length} bot(s) from DB...`);
    
    for (const session of sessions) {
      registerBot(session.instance_id, {
        companyName: session.company_name,
        provider: session.provider || 'baileys',
        tenantId: session.tenant_id,
        status: session.status
      });
    }
    
    logInfo(`[BotPool] ✅ Pool hydrated. ${botPool.size} bot(s) registered.`);
  } catch (e) {
    logError('[BotPool] Failed to hydrate pool:', e.message);
  }
}

/**
 * Periodic health check — marks stale bots as DEGRADED.
 */
function startHealthMonitor(intervalMs = 60000) {
  setInterval(() => {
    const now = Date.now();
    for (const [id, bot] of botPool) {
      if (bot.health === HEALTH.HEALTHY && (now - bot.lastPing) > 300000) {
        bot.health = HEALTH.DEGRADED;
        logInfo(`[BotPool] ⏰ Bot ${id} degraded (no activity for 5 min).`);
      }
    }
  }, intervalMs);
  logInfo(`[BotPool] 🏥 Health monitor started (interval: ${intervalMs / 1000}s).`);
}

module.exports = {
  registerBot,
  deregisterBot,
  reportSuccess,
  reportFailure,
  getHealthyBot,
  getPoolStatus,
  hydratePool,
  startHealthMonitor,
  HEALTH
};

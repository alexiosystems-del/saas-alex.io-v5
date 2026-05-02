const { supabase } = require('./supabaseClient');

/**
 * Enterprise Analytics Engine (Phase 3)
 * Logs performance and quality metrics for billing and optimization.
 */
async function logAnalytics(data) {
  try {
    const { error } = await supabase.from('analytics').insert({
      business_id: data.business_id,
      latency: data.latency,
      cost: data.cost || 0,
      score: data.score || 0,
      model: data.model,
      created_at: new Date().toISOString()
    });
    
    if (error) throw error;
  } catch (err) {
    console.warn('⚠️ [AnalyticsService] Failed to log analytics:', err.message);
  }
}

module.exports = { logAnalytics };

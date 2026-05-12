/**
 * messageRouter.js
 * Enrutador central para mensajes multiplataforma.
 * Recibe los mensajes estandarizados de los distintos conectores (WhatsApp, FB, IG, Web, TikTok)
 * y los envía al bot/motor conversacional, luego distribuye la respuesta al conector adecuado.
 */
const { logError, logInfo } = require('../utils/logger');
// Importamos el motor de IA principal
const alexBrain = require('./alexBrain.js');
const { processLeadAsync } = require('./leadProcessor.js');
const { supabase, isSupabaseEnabled } = require('./supabaseClient');
const { loadInstanceConfig } = require('./instanceLoader');
const { getAdapterByInstanceId } = require('./adapterFactory');
const { trackEvent } = require('./observability');
const crypto = require('crypto');

// ── Helpers ───────────────────────────────────────────────
const withTimeout = (promise, ms, label) =>
  Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    )
  ]);

// Deduplicación persistente en Supabase
const isDuplicate = async (instanceId, senderId, text) => {
  if (!text) return false;
  const key = `${instanceId}:${senderId}:${text.slice(0, 50)}`;
  const hash = crypto.createHash('md5').update(key).digest('hex');
  
  try {
    const { data } = await supabase
      .from('message_dedup_cache')
      .select('id')
      .eq('hash', hash)
      .gt('expires_at', new Date().toISOString())
      .maybeSingle();

    if (data) return true;

    await supabase.from('message_dedup_cache').insert({
      hash,
      expires_at: new Date(Date.now() + 30000).toISOString()
    });
    return false;
  } catch {
    return false; // si falla la caché, dejar pasar el mensaje
  }
};

const createStandardizedMessage = (platform, senderId, text, metadata = {}) => ({
  platform,
  senderId,
  text,
  metadata: {
    instanceId: metadata.instanceId || metadata.instance_id || 'multi_web_default',
    ...metadata
  },
  timestamp: new Date().toISOString()
});

const processMessageLocally = async (stdMsg) => {
  const { senderId, text, metadata } = stdMsg;
  const instanceId = metadata?.instanceId;

  if (!instanceId || !senderId || !text?.trim()) {
    console.warn('[ROUTER] Invalid local message received:', { instanceId, senderId, hasText: !!text });
    return 'No pude procesar el mensaje recibido.';
  }

  let config;
  try {
    config = await withTimeout(loadInstanceConfig(instanceId), 5000, 'LoadConfig');
  } catch (err) {
    console.error(`[ROUTER] Local config load failed for ${instanceId}:`, err.message);
    return 'Estamos cargando tu configuración. Reintenta en unos segundos.';
  }

  try {
    const aiResult = await withTimeout(
      alexBrain.generateResponse({
        message: text,
        history: stdMsg.history || [],
        botConfig: config
      }),
      25000, 'AlexBrain'
    );
    return aiResult?.text || 'IA está procesando... reintenta.';
  } catch (err) {
    console.error(`[ROUTER] Local brain failed for ${instanceId}:`, err.message);
    return 'Estamos experimentando dificultades técnicas. Te respondemos en breve.';
  }
};

const handleIncomingMessage = async (stdMsg) => {
  const { platform, senderId, text, metadata } = stdMsg;
  const instanceId = metadata?.instanceId;

  if (!instanceId || !senderId || !text?.trim()) {
    console.warn('[ROUTER] Invalid message received:', { instanceId, senderId, hasText: !!text });
    return;
  }

  // Deduplicación
  if (await isDuplicate(instanceId, senderId, text)) {
    console.log(`[ROUTER] Duplicate message ignored: ${instanceId}/${senderId}`);
    return;
  }

  let config;
  try {
    config = await withTimeout(loadInstanceConfig(instanceId), 5000, 'LoadConfig');
  } catch (err) {
    console.error(`[ROUTER] Config load failed for ${instanceId}:`, err.message);
    return;
  }

  let aiResult;
  try {
    aiResult = await withTimeout(
      alexBrain.generateResponse({
        message: text,
        history: stdMsg.history || [],
        botConfig: config
      }),
      25000, 'AlexBrain'
    );
  } catch (err) {
    console.error(`[ROUTER] Brain failed for ${instanceId}:`, err.message);
    aiResult = { 
      text: 'Estamos experimentando dificultades técnicas. Te respondemos en breve.',
      trace: { model: 'fallback_static', error: err.message }
    };
  }

  // Envío con manejo de error
  try {
    const adapter = await getAdapterByInstanceId(instanceId);
    if (!adapter) {
      console.error(`[ROUTER] No adapter found for instance: ${instanceId}`);
      return;
    }
    await withTimeout(
      adapter.sendMessage(senderId, aiResult.text),
      10000, 'SendMessage'
    );
  } catch (err) {
    console.error(`[ROUTER] Send failed to ${senderId}:`, err.message);
    await supabase.from('failed_messages').insert({
      instance_id: instanceId,
      sender_id: senderId,
      text: aiResult.text,
      error: err.message,
      created_at: new Date().toISOString()
    }).catch(() => {});
  }

  // Lead processing — fire & forget con error handling
  processLeadAsync(instanceId, senderId, aiResult.text)
    .catch(err => console.error('[ROUTER] Lead processing failed:', err.message));

  // Telemetría
  supabase.from('ai_cascade_logs').insert({
    tenant_id: config?.tenant_id,
    instance_id: instanceId,
    model_used: aiResult.trace?.model,
    latency_ms: aiResult.trace?.latency,
    created_at: new Date().toISOString()
  }).catch(() => {});
};



module.exports = { handleIncomingMessage, createStandardizedMessage, processMessageLocally };

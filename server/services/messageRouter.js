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

/**
 * Create a standardized message object for cross-platform routing.
 */
const createStandardizedMessage = (platform, senderId, text, metadata = {}) => ({
  platform,
  senderId,
  text,
  metadata,
  timestamp: new Date().toISOString()
});

// ── Anti-repetition cache (per sender) ─────────────────────
const recentResponses = new Map();
const RESPONSE_CACHE_TTL = 300000; // 5 min

function deduplicateResponse(senderId, response) {
  const now = Date.now();
  const key = senderId || 'anon';
  
  if (!recentResponses.has(key)) {
    recentResponses.set(key, []);
  }
  
  const history = recentResponses.get(key).filter(r => now - r.ts < RESPONSE_CACHE_TTL);
  
  // Check if the first 80 chars match any recent response (catches repeated openings)
  const snippet = (response || '').substring(0, 80).toLowerCase().trim();
  const isDuplicate = history.some(r => r.snippet === snippet);
  
  // Store this response
  history.push({ snippet, ts: now });
  // Keep only last 10
  recentResponses.set(key, history.slice(-10));
  
  return isDuplicate;
}

/**
 * Process a message locally (synchronous response for webchat).
 * Calls alexBrain.generateResponse directly and returns the reply text.
 */
const processMessageLocally = async (stdMsg) => {
  const { text, metadata, history = [] } = stdMsg;
  const instanceId = metadata?.instanceId || 'multi_web_default';

  let config = {};
  try {
    config = await withTimeout(loadInstanceConfig(instanceId), 5000, 'LoadConfig');
  } catch (err) {
    console.error(`[processMessageLocally] Config load failed for ${instanceId}:`, err.message);
    // Continue with empty config — alexBrain has DEFAULT_SYSTEM_PROMPT built-in
  }

  try {
    const aiResult = await withTimeout(
      alexBrain.generateResponse({
        message: text,
        history: history || [],
        botConfig: config || {}
      }),
      20000, 'AlexBrain'
    );

    let reply = aiResult?.text || '';

    // Anti-repetition: if reply matches a recent one, ask the AI to rephrase
    if (reply && deduplicateResponse(stdMsg.senderId, reply)) {
      console.warn(`[processMessageLocally] Duplicate response detected for ${stdMsg.senderId}, requesting rephrase`);
      try {
        const rephraseResult = await withTimeout(
          alexBrain.generateResponse({
            message: `${text}\n\n[INSTRUCCIÓN INTERNA: Tu respuesta anterior fue idéntica. Reformula completamente tu respuesta. No repitas la misma frase de apertura ni las mismas preguntas. Sé original.]`,
            history: [...(history || []), { role: 'assistant', content: reply }],
            botConfig: config || {}
          }),
          15000, 'AlexBrain-Rephrase'
        );
        if (rephraseResult?.text && rephraseResult.text !== reply) {
          reply = rephraseResult.text;
        }
      } catch {
        // Use original reply if rephrase fails
      }
    }

    return reply;
  } catch (err) {
    console.error(`[processMessageLocally] Brain failed:`, err.message);
    return 'Gracias por tu mensaje. Un asesor te contactará en breve para ayudarte.';
  }
};

module.exports = { handleIncomingMessage, createStandardizedMessage, processMessageLocally };

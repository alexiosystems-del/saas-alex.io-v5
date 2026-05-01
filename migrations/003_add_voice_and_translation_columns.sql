-- MIGRACIÓN 003: Soporte para Voz y Traducción en Sesiones
-- Ejecutar en el SQL Editor de Supabase

ALTER TABLE IF EXISTS whatsapp_sessions 
ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voice TEXT DEFAULT 'nova',
ADD COLUMN IF NOT EXISTS translate_inbound BOOLEAN DEFAULT false;

COMMENT ON COLUMN whatsapp_sessions.voice_enabled IS 'Indica si el bot responde siempre con notas de voz';
COMMENT ON COLUMN whatsapp_sessions.voice IS 'Identificador de la voz de OpenAI (nova, shimer, alloy, etc)';
COMMENT ON COLUMN whatsapp_sessions.translate_inbound IS 'Si es true, traduce mensajes entrantes al español antes de procesar';

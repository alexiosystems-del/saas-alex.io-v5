-- Agregando columnas faltantes a whatsapp_sessions para soportar Multi-Engine y Voice AI
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'baileys';
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false;
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS voice_model TEXT DEFAULT 'nova';
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS translate_enabled BOOLEAN DEFAULT false;
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS target_language TEXT DEFAULT 'es';

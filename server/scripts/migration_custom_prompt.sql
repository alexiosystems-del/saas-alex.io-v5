-- ═══════════════════════════════════════════════════════════════
-- ALEX IO: Migration - Add custom_prompt to whatsapp_sessions
-- ═══════════════════════════════════════════════════════════════

ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS custom_prompt TEXT;

COMMENT ON COLUMN whatsapp_sessions.custom_prompt IS 'System prompt defining the bot personality and behavior.';

-- Adds missing dialog_api_key column required by /api/saas/bots POST/PUT flows.
ALTER TABLE IF EXISTS whatsapp_sessions
ADD COLUMN IF NOT EXISTS dialog_api_key TEXT;

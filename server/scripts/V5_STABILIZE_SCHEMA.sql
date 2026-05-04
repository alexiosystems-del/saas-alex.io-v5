
-- ==========================================================
-- 🏗️ ALEX IO — V5 FINAL SCHEMA STABILIZATION
-- This script ensures all tables have the columns required by the backend
-- to avoid 400 Bad Request errors.
-- ==========================================================

-- 1. BOT_CONFIGS (Essential for Enterprise V5)
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'baileys';
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'disconnected';
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false;
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS translation_enabled BOOLEAN DEFAULT false;
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS strategy TEXT DEFAULT 'undefined';
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS voice_model TEXT DEFAULT 'nova';
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS target_language TEXT DEFAULT 'es';
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS identity TEXT;
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- 2. BOTS (Fallback support)
ALTER TABLE bots ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS translation_enabled BOOLEAN DEFAULT false;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS tone TEXT;

-- 3. WHATSAPP_SESSIONS (Legacy but used for Baileys Auth)
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'baileys';
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false;
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS voice_model TEXT DEFAULT 'nova';
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS translate_enabled BOOLEAN DEFAULT false;
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS target_language TEXT DEFAULT 'es';
ALTER TABLE whatsapp_sessions ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 4. MESSAGES (Audit logging)
ALTER TABLE messages ADD COLUMN IF NOT EXISTS tenant_id UUID;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS message_hash TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS previous_hash TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS audit_flag BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS audit_reason TEXT;

-- 5. RELAXED RLS (For SaaS consistency using service_role)
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow service role full access" ON bot_configs;
CREATE POLICY "Allow service role full access" ON bot_configs FOR ALL USING (true) WITH CHECK (true);

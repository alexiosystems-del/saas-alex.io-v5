
-- Fix schema for bot_configs to support Enterprise V5 features
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false;
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS translation_enabled BOOLEAN DEFAULT false;
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS strategy TEXT DEFAULT 'undefined';
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS voice_model TEXT DEFAULT 'nova';
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS target_language TEXT DEFAULT 'es';
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS identity TEXT;
ALTER TABLE bot_configs ADD COLUMN IF NOT EXISTS channel TEXT DEFAULT 'whatsapp';

-- Ensure bots table also has these (as fallbacks)
ALTER TABLE bots ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT false;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS translation_enabled BOOLEAN DEFAULT false;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE bots ADD COLUMN IF NOT EXISTS tone TEXT;

-- Verify RLS (Relaxed for SaaS if using service_role, but good to have)
ALTER TABLE bot_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access" ON bot_configs FOR ALL USING (true) WITH CHECK (true);

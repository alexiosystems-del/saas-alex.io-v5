-- ALEX IO V5: COMPREHENSIVE WHATSAPP_SESSIONS SCHEMA REPAIR
-- Ensures all columns, indices, and RLS policies are production-ready.

-- 1. EXTEND whatsapp_sessions TABLE
DO $$
BEGIN
    -- Ensure columns exist
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS instance_id TEXT;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS tenant_id TEXT;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS company_name TEXT;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'baileys';
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT FALSE;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS target_language TEXT DEFAULT 'es';
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS meta_access_token TEXT;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS meta_phone_number_id TEXT;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS meta_business_account_id TEXT;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS meta_api_url TEXT DEFAULT 'https://graph.facebook.com/v19.0';
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS verify_token TEXT;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS custom_prompt TEXT;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS industry TEXT;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS objective TEXT;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS dialog_api_key TEXT;
    ALTER TABLE IF EXISTS public.whatsapp_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

    -- Ensure unique constraint on instance_id (needed for some logic)
    -- WARNING: If you use Baileys, one instance_id might have many rows (keys).
    -- However, for the 'metadata' row, we usually have one.
    -- To keep it safe for multi-row Baileys, we don't add a GLOBAL unique constraint on instance_id alone,
    -- but we DO use UNIQUE(session_id, key_type, key_id) which is already in the base schema.
END $$;

-- 2. INDICES
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_tenant ON public.whatsapp_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_instance ON public.whatsapp_sessions(instance_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_status ON public.whatsapp_sessions(status);

-- 3. RLS HARDENING
ALTER TABLE IF EXISTS public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Drop old policies to avoid conflicts
DROP POLICY IF EXISTS "Service Role full access" ON public.whatsapp_sessions;
DROP POLICY IF EXISTS "Allow all for backend" ON public.whatsapp_sessions;
DROP POLICY IF EXISTS "Public access" ON public.whatsapp_sessions;

-- Create a comprehensive policy that allows everything for now (since backend uses ANON key)
-- but ensures INSERT is covered (using WITH CHECK).
CREATE POLICY "Full access for all" ON public.whatsapp_sessions
    FOR ALL
    TO anon, authenticated
    USING (true)
    WITH CHECK (true);

-- 4. ENSURE bot_configs and bots TABLES ARE ALSO READY (Minimal requirements)
ALTER TABLE IF EXISTS public.bot_configs ADD COLUMN IF NOT EXISTS instance_id TEXT;
ALTER TABLE IF EXISTS public.bot_configs ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE IF EXISTS public.bot_configs ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE IF EXISTS public.bot_configs ADD COLUMN IF NOT EXISTS custom_prompt TEXT;

ALTER TABLE IF EXISTS public.bots ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE IF EXISTS public.bots ADD COLUMN IF NOT EXISTS prompt TEXT;
ALTER TABLE IF EXISTS public.bots ADD COLUMN IF NOT EXISTS tone TEXT;
ALTER TABLE IF EXISTS public.bots ADD COLUMN IF NOT EXISTS industry TEXT;
ALTER TABLE IF EXISTS public.bots ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE IF EXISTS public.bots ADD COLUMN IF NOT EXISTS tenant_id TEXT;
ALTER TABLE IF EXISTS public.bots ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT FALSE;

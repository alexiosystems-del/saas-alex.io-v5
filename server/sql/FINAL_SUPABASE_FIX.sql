-- ============================================================
-- 🔥 ALEX IO V5: FINAL SUPABASE PRODUCTION FIX (SAFE VERSION)
-- ============================================================
-- Execute this entire block in your Supabase SQL Editor.
-- This version uses conditional logic to avoid "table does not exist" errors.

-- 1. EXTEND whatsapp_sessions TABLE (If it exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_sessions') THEN
        ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS instance_id TEXT;
        ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'disconnected';
        ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS qr_code TEXT;
        ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS company_name TEXT;
        ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS tenant_id TEXT;
        ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS owner_email TEXT;
        ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'baileys';
        
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_sessions_instance_id_key') THEN
            ALTER TABLE public.whatsapp_sessions ADD CONSTRAINT whatsapp_sessions_instance_id_key UNIQUE (instance_id);
        END IF;
    END IF;
END $$;

-- 2. CREATE MISSING STABILIZATION TABLES
CREATE TABLE IF NOT EXISTS public.whatsapp_auth_state (
    instance_id TEXT NOT NULL,
    key_name TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (instance_id, key_name)
);
CREATE INDEX IF NOT EXISTS idx_whatsapp_auth_state_instance ON public.whatsapp_auth_state (instance_id);

CREATE TABLE IF NOT EXISTS public.tenant_usage_metrics (
    tenant_id TEXT PRIMARY KEY,
    messages_sent INTEGER DEFAULT 0,
    tokens_consumed INTEGER DEFAULT 0,
    last_reset_date TIMESTAMPTZ DEFAULT NOW(),
    plan_limit INTEGER DEFAULT 500,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.prompt_versiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  instance_id TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'v1',
  status TEXT NOT NULL DEFAULT 'test',
  prompt_text TEXT NOT NULL,
  super_prompt_json JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prompt_versiones_status ON public.prompt_versiones (status);

-- Ensure messages table exists for analytics (Safe create)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id TEXT NOT NULL,
    tenant_id TEXT,
    remote_jid TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    message_type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ENABLE SECURITY (RLS) - SAFE VERSION
DO $$
DECLARE
    t text;
BEGIN
    FOR t IN SELECT unnest(ARRAY['whatsapp_sessions', 'tenant_usage_metrics', 'whatsapp_auth_state', 'app_users', 'users', 'prompt_versiones', 'messages'])
    LOOP
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = t AND table_schema = 'public') THEN
            EXECUTE 'ALTER TABLE public.' || t || ' ENABLE ROW LEVEL SECURITY';
        END IF;
    END LOOP;
END $$;

-- 4. CREATE SERVICE ROLE POLICIES (Access for Backend)
DO $$ 
BEGIN
    -- This allows full access to the backend using the service role or authenticated keys.
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_auth_state') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role full access' AND tablename = 'whatsapp_auth_state') THEN
            CREATE POLICY "Service Role full access" ON public.whatsapp_auth_state FOR ALL USING (true);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'whatsapp_sessions') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role full access' AND tablename = 'whatsapp_sessions') THEN
            CREATE POLICY "Service Role full access" ON public.whatsapp_sessions FOR ALL USING (true);
        END IF;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'tenant_usage_metrics') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role full access' AND tablename = 'tenant_usage_metrics') THEN
            CREATE POLICY "Service Role full access" ON public.tenant_usage_metrics FOR ALL USING (true);
        END IF;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Service Role full access' AND tablename = 'messages') THEN
            CREATE POLICY "Service Role full access" ON public.messages FOR ALL USING (true);
        END IF;
    END IF;
END $$;

-- 5. UTILITY FUNCTIONS
CREATE OR REPLACE FUNCTION increment_tenant_usage(t_id TEXT, msg_incr INTEGER, tk_incr INTEGER)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.tenant_usage_metrics (tenant_id, messages_sent, tokens_consumed, updated_at)
    VALUES (t_id, msg_incr, tk_incr, NOW())
    ON CONFLICT (tenant_id) DO UPDATE SET
        messages_sent = public.tenant_usage_metrics.messages_sent + msg_incr,
        tokens_consumed = public.tenant_usage_metrics.tokens_consumed + tk_incr,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

ALTER FUNCTION public.increment_tenant_usage SET search_path = public;

-- ✅ DONE. Please refresh your Supabase dashboard.

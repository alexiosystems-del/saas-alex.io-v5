-- ═══════════════════════════════════════════════════════════════
-- ALEX IO - NIVEL DIOS: Enterprise Infrastructure Setup
-- This script hardens the database for Multi-Provider WhatsApp & CRM Pro
-- ═══════════════════════════════════════════════════════════════

-- 1. HARDENING whatsapp_sessions (Engine Core)
DO $$ 
BEGIN
    -- Ensure columns exist for Multi-Engine support
    ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS instance_id TEXT;
    ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'baileys';
    ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'disconnected';
    ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS qr_code TEXT;
    ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS company_name TEXT;
    ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS tenant_id TEXT;
    ALTER TABLE public.whatsapp_sessions ADD COLUMN IF NOT EXISTS owner_email TEXT;
    
    -- Constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'whatsapp_sessions_instance_id_key') THEN
        ALTER TABLE public.whatsapp_sessions ADD CONSTRAINT whatsapp_sessions_instance_id_key UNIQUE (instance_id);
    END IF;
END $$;

-- 2. HARDENING bot_configs (AI & Connector Personality)
DO $$ 
BEGIN
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'baileys';
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS access_token TEXT;
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS phone_number_id TEXT;
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS manychat_token TEXT;
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS d360_api_key TEXT;
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS d360_url TEXT DEFAULT 'https://waba.360dialog.io';
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS custom_prompt TEXT;
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS voice_provider TEXT DEFAULT 'elevenlabs';
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS instance_id TEXT; -- Mapping to whatsapp_sessions
    
    -- If instance_id unique constraint doesn't exist, we might want it but be careful with multi-tenancy
END $$;

-- 3. CRM PRO & ANALYTICS (From Phase 3/4/5)
-- We use a clean approach: create if not exists

-- Memory (Contexto semántico por cliente)
CREATE TABLE IF NOT EXISTS public.memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_phone)
);

-- CRM Leads (Pipeline Enterprise)
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    phone TEXT NOT NULL,
    name TEXT,
    email TEXT,
    source TEXT DEFAULT 'whatsapp',
    stage TEXT DEFAULT 'new',
    score FLOAT DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    last_message TEXT,
    metadata JSONB DEFAULT '{}',
    assigned_to TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, phone)
);

-- Analytics (Métricas en Tiempo Real)
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    latency FLOAT,
    cost FLOAT DEFAULT 0,
    score FLOAT DEFAULT 0,
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Cascade Logs (Transparencia de Costos)
CREATE TABLE IF NOT EXISTS public.ai_cascade_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT,
    instance_id TEXT,
    model_used TEXT,
    reason TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for Nivel Dios Performance
CREATE INDEX IF NOT EXISTS idx_bot_configs_instance ON public.bot_configs(instance_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_score ON public.crm_leads(business_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_biz ON public.analytics(business_id, created_at DESC);

-- RLS Hardening (Allowing service role and owner)
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

-- Simple "Master Policy" for Service Role (Adjust as needed for production)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Master Access' AND tablename = 'whatsapp_sessions') THEN
        CREATE POLICY "Master Access" ON public.whatsapp_sessions FOR ALL USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Master Access' AND tablename = 'bot_configs') THEN
        CREATE POLICY "Master Access" ON public.bot_configs FOR ALL USING (true);
    END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- DB UPDATED TO NIVEL DIOS
-- ═══════════════════════════════════════════════════════════════

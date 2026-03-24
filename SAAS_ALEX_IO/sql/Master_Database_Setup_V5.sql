-- =============================================
-- 🚀 ALEX IO V5 - MASTER DATABASE SCHEMA
-- Omni-channel, Multi-Tenant SaaS, Leads & Auditing
-- =============================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- =============================================
-- 2. SAAS CORE: PRODUCTS, PLANS, AND USERS
-- =============================================
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.products (slug, name, description) VALUES
('alex-io', 'ALEX IO', 'Asistente IA Omnicanal y CRM') ON CONFLICT DO NOTHING;

CREATE TABLE IF NOT EXISTS public.plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price_monthly NUMERIC(10, 2) DEFAULT 0,
    max_bots INTEGER DEFAULT 1,
    max_messages_monthly INTEGER DEFAULT 100,
    features JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES public.plans(id),
    status TEXT DEFAULT 'active',
    subscription_start DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.app_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'free',
    role TEXT DEFAULT 'user',
    tenant_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 3. WHATSAPP & BOT CONFIGURATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    key_type TEXT NOT NULL,
    key_id TEXT NOT NULL,
    value TEXT NOT NULL,
    instance_id TEXT UNIQUE,
    status TEXT DEFAULT 'disconnected',
    qr_code TEXT,
    company_name TEXT,
    tenant_id TEXT,
    owner_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, key_type, key_id)
);

CREATE TABLE IF NOT EXISTS public.whatsapp_auth_state (
    instance_id TEXT NOT NULL,
    key_name TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (instance_id, key_name)
);

CREATE TABLE IF NOT EXISTS public.bot_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_account_id UUID,
    product_id UUID REFERENCES public.products(id),
    bot_name TEXT DEFAULT 'ALEX IO',
    bot_role TEXT DEFAULT 'customer_support',
    system_prompt TEXT,
    constitution TEXT,
    conversation_structure TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 4. MESSAGES, COMPLIANCE & SHADOW MODE
-- =============================================
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id TEXT NOT NULL,
    tenant_id TEXT,
    remote_jid TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
    message_type TEXT NOT NULL DEFAULT 'text',
    content TEXT,
    message_hash text,
    previous_hash text,
    audit_flag text,
    audit_reason text,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message Blockchain Trigger for Compliance
CREATE OR REPLACE FUNCTION set_message_hash()
RETURNS TRIGGER AS $$
DECLARE
    last_hash text;
BEGIN
    SELECT message_hash INTO last_hash FROM public.messages
    WHERE instance_id = NEW.instance_id AND remote_jid = NEW.remote_jid ORDER BY created_at DESC LIMIT 1;
    NEW.previous_hash := COALESCE(last_hash, 'GENESIS_BLOCK');
    NEW.message_hash := encode(digest(NEW.previous_hash || NEW.content || NEW.direction || NEW.created_at::text, 'sha256'), 'hex');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_message_hash ON public.messages;
CREATE TRIGGER trg_set_message_hash BEFORE INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION set_message_hash();

CREATE TABLE IF NOT EXISTS public.shadow_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id uuid,
    instance_id text,
    message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
    remote_jid text,
    ai_response text,
    claude_analysis jsonb,
    is_compliant boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- =============================================
-- 5. ANALYTICS, LEADS & KNOWLEDGE BASE (V5 MULTI-CHANNEL)
-- =============================================
CREATE TABLE IF NOT EXISTS public.leads (
    tenant_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    remote_jid TEXT NOT NULL,
    is_lead BOOLEAN DEFAULT false,
    name TEXT DEFAULT 'desconocido',
    email TEXT,
    email_status TEXT DEFAULT 'unverified',
    temperature TEXT DEFAULT 'COLD',
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (instance_id, remote_jid)
);

CREATE TABLE IF NOT EXISTS public.tenant_usage_metrics (
    tenant_id TEXT PRIMARY KEY,
    messages_sent INTEGER DEFAULT 0,
    tokens_consumed INTEGER DEFAULT 0,
    last_reset_date TIMESTAMPTZ DEFAULT NOW(),
    plan_limit INTEGER DEFAULT 500,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- KNOWLEDGE BASE FOR RAG
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- Req: pgvector extension
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RAG SEARCH FUNCTION
CREATE OR REPLACE FUNCTION match_document_chunks(
  query_embedding vector(1536),
  match_count int,
  p_tenant_id text,
  p_instance_id text
)
RETURNS TABLE (id uuid, content text, similarity float)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id, dc.content, 1 - (dc.embedding <=> query_embedding) AS similarity
  FROM public.document_chunks dc
  WHERE dc.tenant_id = p_tenant_id AND dc.instance_id = p_instance_id
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

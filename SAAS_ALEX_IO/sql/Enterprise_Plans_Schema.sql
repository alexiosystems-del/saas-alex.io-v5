-- ============================================
-- ALEX IO SaaS - ENTERPRISE PLANS & QUOTAS
-- ============================================

-- 1. Ensure Plans Table is correct
CREATE TABLE IF NOT EXISTS public.plans (
    id TEXT PRIMARY KEY, -- 'STARTER', 'PRO', 'ENTERPRISE'
    name TEXT NOT NULL,
    price_monthly NUMERIC(10, 2) DEFAULT 0,
    max_bots INTEGER DEFAULT 1,
    max_messages_monthly INTEGER DEFAULT 100,
    features JSONB DEFAULT '[]',
    stripe_price_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Populate/Update Standard Plans
INSERT INTO public.plans (id, name, price_monthly, max_bots, max_messages_monthly, features, stripe_price_id)
VALUES 
(
    'STARTER', 
    'Starter / Piloto', 
    49.00, 1, 1000, 
    '["basic_ai", "whatsapp_broadcast"]', 
    'price_starter_default'
),
(
    'PRO', 
    'Professional / Growth', 
    149.00, 5, 10000, 
    '["rag_knowledge", "whatsapp_broadcast", "crm_sync", "voice_ai"]', 
    'price_pro_default'
),
(
    'ENTERPRISE', 
    'Enterprise / Scale', 
    499.00, 20, 50000, 
    '["rag_knowledge", "whatsapp_broadcast", "crm_sync", "voice_ai", "audit_logs", "dedicated_redis", "priority_support"]', 
    'price_enterprise_default'
)
ON CONFLICT (id) DO UPDATE SET
    price_monthly = EXCLUDED.price_monthly,
    max_bots = EXCLUDED.max_bots,
    max_messages_monthly = EXCLUDED.max_messages_monthly,
    features = EXCLUDED.features,
    updated_at = NOW();

-- 3. Standardize Tenant Usage Metrics
CREATE TABLE IF NOT EXISTS public.tenant_usage_metrics (
    tenant_id TEXT PRIMARY KEY,
    plan_id TEXT REFERENCES public.plans(id) DEFAULT 'STARTER',
    messages_sent INTEGER DEFAULT 0,
    plan_limit INTEGER DEFAULT 1000, -- Cached from plan for fast checking
    tokens_consumed INTEGER DEFAULT 0,
    bots_count INTEGER DEFAULT 0,
    last_reset_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS (Security Hardening)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_usage_metrics ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view plans
CREATE POLICY "Public plans view" ON public.plans FOR SELECT USING (true);

-- Policy: Tenants can only view their own usage
CREATE POLICY "Tenant view own usage" ON public.tenant_usage_metrics 
FOR SELECT USING (tenant_id = auth.uid()::text OR tenant_id = auth.jwt()->>'email');

-- Policy: Service role (Backend) full access
CREATE POLICY "Service role full access plans" ON public.plans FOR ALL USING (true);
CREATE POLICY "Service role full access usage" ON public.tenant_usage_metrics FOR ALL USING (true);

COMMENT ON TABLE public.plans IS 'Global plan definitions and quotas for ALEX IO SaaS.';
COMMENT ON TABLE public.tenant_usage_metrics IS 'Real-time quota tracking for multi-tenant isolation and budget control.';

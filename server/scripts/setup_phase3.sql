-- ═══════════════════════════════════════════════════════════════
-- ALEX IO Phase 3/4/5 + CRM PRO: Complete Enterprise DB Setup
-- Run this ONCE in Supabase SQL Editor (CLEAN SLATE)
-- ═══════════════════════════════════════════════════════════════

-- Drop existing tables to avoid conflicts
DROP TABLE IF EXISTS crm_activity_log CASCADE;
DROP TABLE IF EXISTS crm_notes CASCADE;
DROP TABLE IF EXISTS crm_leads CASCADE;
DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS memory CASCADE;
DROP TABLE IF EXISTS bot_pool_events CASCADE;
DROP TABLE IF EXISTS ai_cascade_logs CASCADE;

-- ═══ 1. Memory (Contexto por cliente) ═══
CREATE TABLE memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, user_phone)
);

-- ═══ 2. CRM PRO Leads (Pipeline completo) ═══
CREATE TABLE crm_leads (
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

-- ═══ 3. CRM Notes ═══
CREATE TABLE crm_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
    author_id TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 4. CRM Activity Log ═══
CREATE TABLE crm_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID REFERENCES crm_leads(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 5. Analytics (Métricas de Inteligencia) ═══
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    latency FLOAT,
    cost FLOAT DEFAULT 0,
    score FLOAT DEFAULT 0,
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 6. AI Cascade Logs ═══
CREATE TABLE ai_cascade_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT,
    instance_id TEXT,
    model_used TEXT,
    reason TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 7. Bot Pool Events (Health Tracking) ═══
CREATE TABLE bot_pool_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 8. Legacy leads table (backward compat) ═══
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    phone TEXT NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'active',
    last_message TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, phone)
);

-- ═══ Performance Indices ═══
CREATE INDEX idx_memory_biz_phone ON memory(business_id, user_phone);
CREATE INDEX idx_crm_leads_biz ON crm_leads(business_id, stage);
CREATE INDEX idx_crm_leads_phone ON crm_leads(business_id, phone);
CREATE INDEX idx_crm_leads_score ON crm_leads(business_id, score DESC);
CREATE INDEX idx_crm_notes_lead ON crm_notes(lead_id, created_at);
CREATE INDEX idx_crm_activity_lead ON crm_activity_log(lead_id, created_at);
CREATE INDEX idx_analytics_biz_time ON analytics(business_id, created_at);
CREATE INDEX idx_cascade_tenant ON ai_cascade_logs(tenant_id, created_at);
CREATE INDEX idx_pool_events ON bot_pool_events(instance_id, created_at);
CREATE INDEX idx_leads_biz_phone ON leads(business_id, phone);

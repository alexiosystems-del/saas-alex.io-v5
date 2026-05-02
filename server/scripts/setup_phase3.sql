-- ═══════════════════════════════════════════════════════════════
-- ALEX IO Phase 3/4/5: Complete Enterprise Database Setup
-- Run this ONCE in Supabase SQL Editor (CLEAN SLATE)
-- ═══════════════════════════════════════════════════════════════

-- Drop existing tables to avoid conflicts
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

-- ═══ 2. Leads (CRM Automático) ═══
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

-- ═══ 3. Analytics (Métricas de Inteligencia) ═══
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    latency FLOAT,
    cost FLOAT DEFAULT 0,
    score FLOAT DEFAULT 0,
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 4. AI Cascade Logs ═══
CREATE TABLE ai_cascade_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT,
    instance_id TEXT,
    model_used TEXT,
    reason TEXT,
    latency_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ 5. Bot Pool Events (Health Tracking) ═══
CREATE TABLE bot_pool_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══ Performance Indices ═══
CREATE INDEX idx_memory_biz_phone ON memory(business_id, user_phone);
CREATE INDEX idx_leads_biz_phone ON leads(business_id, phone);
CREATE INDEX idx_analytics_biz_time ON analytics(business_id, created_at);
CREATE INDEX idx_cascade_tenant ON ai_cascade_logs(tenant_id, created_at);
CREATE INDEX idx_pool_events ON bot_pool_events(instance_id, created_at);

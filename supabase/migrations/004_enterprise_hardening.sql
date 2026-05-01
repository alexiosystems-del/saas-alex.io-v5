-- Migration: 004_enterprise_hardening.sql
-- Description: Adds tables for shadow auditing and AI performance tracking.

-- 1. Table for Shadow Audit Logs (Compliance tracking)
CREATE TABLE IF NOT EXISTS shadow_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    message_id TEXT NOT NULL,
    ai_response TEXT,
    claude_analysis JSONB,
    is_compliant BOOLEAN DEFAULT TRUE,
    risk_score INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Table for AI Cascade Logs (Monitoring which model was used)
CREATE TABLE IF NOT EXISTS ai_cascade_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    model_used TEXT,
    reason TEXT,
    latency_ms INTEGER,
    cost_usd DECIMAL(12, 10),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ensure channel_instances exists for routing
CREATE TABLE IF NOT EXISTS channel_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id TEXT NOT NULL,
    channel_type TEXT NOT NULL, -- 'discord', 'tiktok', 'messenger', 'instagram'
    external_id TEXT NOT NULL,  -- e.g. Discord Guild ID, TikTok Seller ID, FB Page ID
    instance_id TEXT NOT NULL,
    credentials_encrypted TEXT,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(channel_type, external_id)
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_shadow_audit_tenant ON shadow_audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cascade_instance ON ai_cascade_logs(instance_id);
CREATE INDEX IF NOT EXISTS idx_channel_ext_id ON channel_instances(external_id);

-- ALEX IO Phase 3: Infrastructure Setup (CLEAN SLATE)
-- WARNING: This will drop existing tables to ensure a clean Enterprise V5 state.

DROP TABLE IF EXISTS analytics CASCADE;
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS memory CASCADE;

-- 1. Memory Table
CREATE TABLE memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, user_phone)
);

-- 2. Leads Table
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    phone TEXT NOT NULL,
    name TEXT,
    status TEXT DEFAULT 'active',
    last_message TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, phone)
);

-- 3. Analytics Table
CREATE TABLE analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    latency FLOAT,
    cost FLOAT DEFAULT 0,
    score FLOAT DEFAULT 0,
    model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indices
CREATE INDEX idx_memory_business_phone ON memory(business_id, user_phone);
CREATE INDEX idx_leads_business_phone ON leads(business_id, phone);
CREATE INDEX idx_analytics_business_time ON analytics(business_id, created_at);

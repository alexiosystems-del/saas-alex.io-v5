-- ALEX IO Phase 3: Infrastructure Setup

-- 1. Memory Table
CREATE TABLE IF NOT EXISTS memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    context JSONB DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, user_phone)
);

-- 2. Leads Table (Enhanced)
CREATE TABLE IF NOT EXISTS leads (
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
CREATE TABLE IF NOT EXISTS analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id TEXT NOT NULL,
    latency FLOAT,
    cost FLOAT DEFAULT 0,
    score FLOAT DEFAULT 0,
    model TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_memory_business_phone ON memory(business_id, user_phone);
CREATE INDEX IF NOT EXISTS idx_leads_business_phone ON leads(business_id, phone);
CREATE INDEX IF NOT EXISTS idx_analytics_business_time ON analytics(business_id, created_at);

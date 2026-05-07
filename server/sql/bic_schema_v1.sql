-- BIC Architecture: Bot Initiator Profile
CREATE TABLE IF NOT EXISTS bot_initiator_profile (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    bot_name TEXT,
    business_type TEXT,
    main_goal TEXT,
    value_prop TEXT,
    tone TEXT DEFAULT 'professional',
    primary_cta TEXT,
    base_language TEXT DEFAULT 'es',
    allowed_languages TEXT[] DEFAULT ARRAY['es', 'en'],
    readiness_json JSONB DEFAULT '{}'::jsonb,
    qa_score FLOAT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(bot_id)
);

-- BIC Architecture: User Memory Profiles (LTM)
CREATE TABLE IF NOT EXISTS user_memory_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    customer_id TEXT NOT NULL,
    facts JSONB DEFAULT '[]'::jsonb,
    last_interaction TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, customer_id)
);

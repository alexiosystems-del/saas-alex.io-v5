-- =============================================
-- MIGRATION: PHASE 4 LEADS AND INTENT TRACKING
-- For AI Lead Temperature and Context display
-- =============================================

CREATE TABLE IF NOT EXISTS public.leads (
    tenant_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    remote_jid TEXT NOT NULL,
    is_lead BOOLEAN DEFAULT false,
    name TEXT DEFAULT 'desconocido',
    email TEXT,
    email_status TEXT DEFAULT 'unverified',
    temperature TEXT DEFAULT 'COLD', -- COLD, WARM, HOT
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (instance_id, remote_jid)
);

-- Note: We use instance_id and remote_jid as the primary key. 
-- In a multi-tenant environment, the remote_jid is scoped to a specific bot instance.

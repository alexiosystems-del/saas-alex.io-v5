-- 🔥 STRIPE IDEMPOTENCY SCHEMA
-- Ensures that each Stripe event is processed exactly once.

CREATE TABLE IF NOT EXISTS public.stripe_events (
    event_id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    tenant_id TEXT,
    processed_at TIMESTAMPTZ DEFAULT NOW(),
    payload JSONB,
    status TEXT DEFAULT 'processed', -- 'processed', 'failed'
    error_message TEXT
);

-- Index for faster lookup
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_tenant ON public.stripe_events(tenant_id);

-- Add a comment to the table
COMMENT ON TABLE public.stripe_events IS 'Stores processed Stripe event IDs to prevent duplicate processing (Idempotency).';

-- ALEX IO — Schema Fix V5
-- Adds missing columns to whatsapp_sessions to support Voice, Translation and Custom Prompts.

-- 1. Table: whatsapp_sessions
ALTER TABLE IF EXISTS public.whatsapp_sessions 
ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS voice TEXT DEFAULT 'alloy',
ADD COLUMN IF NOT EXISTS translate_inbound BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_prompt TEXT;

-- 2. Ensure bot_events table exists for centralized logging
CREATE TABLE IF NOT EXISTS public.bot_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id TEXT NOT NULL,
    level TEXT NOT NULL, -- info, warn, error
    message TEXT NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS on new table
ALTER TABLE public.bot_events ENABLE ROW LEVEL SECURITY;

-- 4. Simple Policy: SuperAdmin can see all, Users can see their own (if instance_id matches)
-- For now, let's allow all authenticated users to read bot_events to simplify debugging,
-- but restrict it later if needed.
DROP POLICY IF EXISTS "Users can view their own bot events" ON public.bot_events;
CREATE POLICY "Users can view their own bot events" ON public.bot_events
    FOR SELECT TO authenticated
    USING (TRUE); -- Simple version for initial launch

-- 5. Fix for profiles/users link if missing
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'OWNER';
    END IF;
END $$;

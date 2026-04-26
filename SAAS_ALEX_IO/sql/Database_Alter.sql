-- ============================================================
-- 🔥 ALEX IO V5: UNIVERSAL DEMO SCHEMA & MIGRATION
-- ============================================================
-- Execute this in your Supabase SQL Editor to ensure the 
-- Acquisition Agent (ALEX IO) has all necessary database fields.

-- 1. Ensure whatsapp_accounts exists (Basic dependency)
CREATE TABLE IF NOT EXISTS public.whatsapp_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID, 
    account_name TEXT NOT NULL,
    phone_number TEXT,
    phone_number_id TEXT UNIQUE,
    business_account_id TEXT,
    access_token TEXT,
    webhook_verify_token TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Ensure bot_configs exists with all V5 columns
CREATE TABLE IF NOT EXISTS public.bot_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    whatsapp_account_id UUID REFERENCES public.whatsapp_accounts(id) ON DELETE CASCADE,
    instance_id TEXT UNIQUE, -- CRITICAL for V5 mapping
    user_id UUID,
    
    -- Identity
    bot_name TEXT DEFAULT 'ALEX IO',
    bot_role TEXT DEFAULT 'acquisition_agent',
    
    -- Cognition
    system_prompt TEXT,
    constitution TEXT,
    conversation_structure TEXT,
    
    -- Sales Engine (Agente de Adquisición)
    conversion_goal TEXT DEFAULT 'whatsapp' CHECK (conversion_goal IN ('whatsapp', 'calendly', 'payment', 'lead_form')),
    cta_link TEXT,
    demo_mode BOOLEAN DEFAULT false,
    
    -- Features
    voice_enabled BOOLEAN DEFAULT false,
    ai_enabled BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(whatsapp_account_id)
);

-- 3. MIGRATION: Add missing columns if table already existed partially
DO $$
BEGIN
    -- Constitution & Structure
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS constitution TEXT;
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS conversation_structure TEXT;
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS instance_id TEXT;
    
    -- Sales Engine
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS conversion_goal TEXT DEFAULT 'whatsapp' CHECK (conversion_goal IN ('whatsapp', 'calendly', 'payment', 'lead_form'));
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS cta_link TEXT;
    ALTER TABLE public.bot_configs ADD COLUMN IF NOT EXISTS demo_mode BOOLEAN DEFAULT false;
    
    -- Constraints
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bot_configs_instance_id_key') THEN
        ALTER TABLE public.bot_configs ADD CONSTRAINT bot_configs_instance_id_key UNIQUE (instance_id);
    END IF;
END $$;

-- 4. CLEANUP & INITIALIZATION
ALTER TABLE public.bot_configs ALTER COLUMN bot_name SET DEFAULT 'ALEX IO';

UPDATE public.bot_configs 
SET bot_name = 'ALEX IO' 
WHERE bot_name IS NULL OR bot_name = 'Asistente';

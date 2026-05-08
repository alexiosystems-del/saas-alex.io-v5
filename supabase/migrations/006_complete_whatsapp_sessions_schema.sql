-- Migration: 006_complete_whatsapp_sessions_schema.sql
-- Description: Adds all missing columns to whatsapp_sessions for Meta Cloud API and Bot Management.

ALTER TABLE IF EXISTS public.whatsapp_sessions
ADD COLUMN IF NOT EXISTS instance_id TEXT,
ADD COLUMN IF NOT EXISTS tenant_id TEXT,
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS provider TEXT DEFAULT 'baileys',
ADD COLUMN IF NOT EXISTS voice_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS target_language TEXT DEFAULT 'es',
ADD COLUMN IF NOT EXISTS meta_access_token TEXT,
ADD COLUMN IF NOT EXISTS meta_phone_number_id TEXT,
ADD COLUMN IF NOT EXISTS meta_business_account_id TEXT,
ADD COLUMN IF NOT EXISTS meta_api_url TEXT DEFAULT 'https://graph.facebook.com/v19.0',
ADD COLUMN IF NOT EXISTS verify_token TEXT,
ADD COLUMN IF NOT EXISTS custom_prompt TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS objective TEXT,
ADD COLUMN IF NOT EXISTS total_messages INTEGER DEFAULT 0;

-- Create index for tenant-based lookups if missing
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_tenant ON public.whatsapp_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_instance ON public.whatsapp_sessions(instance_id);

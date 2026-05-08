-- Migration: 005_add_dialog_api_key_whatsapp_sessions.sql
-- Description: Adds missing Dialog API key column used by bot create/update flows.

ALTER TABLE IF EXISTS public.whatsapp_sessions
ADD COLUMN IF NOT EXISTS dialog_api_key TEXT;

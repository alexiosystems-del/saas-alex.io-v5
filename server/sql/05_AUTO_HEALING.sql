-- 1. Tabla: channel_instances (extensión para Auto-Healing)
ALTER TABLE channel_instances
ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS last_degraded_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_paused_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS auto_paused BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS recovery_attempts INT DEFAULT 0;

-- 06_DISCORD_CHANNELS.sql
-- Migración para soportar Discord Enterprise y mapeo multi-tenant

-- Tabla para gestionar las instancias de canales (ya sea WhatsApp, Discord, etc.)
CREATE TABLE IF NOT EXISTS channel_instances (
  id BIGSERIAL PRIMARY KEY,
  tenant_id UUID NOT NULL, -- Referencia al usuario/tenant de Supabase
  instance_id TEXT NOT NULL UNIQUE, -- ID único (ej: 'discord_prod_1')
  channel_type TEXT NOT NULL, -- 'whatsapp', 'discord', 'tiktok', etc.
  credentials JSONB DEFAULT '{}', -- Tokens, secrets, webhooks
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'error'
  health_status TEXT DEFAULT 'healthy', -- Tracking de SRE: healthy, degraded, paused
  last_degraded_at TIMESTAMPTZ,
  last_paused_at TIMESTAMPTZ,
  auto_paused BOOLEAN DEFAULT FALSE,
  recovery_attempts INT DEFAULT 0,
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Tabla para mapear conversaciones externas a nuestras instancias/tenants
CREATE TABLE IF NOT EXISTS conversation_channels (
  id BIGSERIAL PRIMARY KEY,
  conversation_id TEXT NOT NULL, -- Nuestro ID interno de conversación
  instance_id TEXT NOT NULL, -- A qué instancia pertenece
  platform TEXT NOT NULL, -- 'discord', 'messenger', etc.
  external_userid TEXT NOT NULL, -- ID del usuario en la plataforma externa
  external_channelid TEXT, -- ID del canal/guild en caso de Discord
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_message_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT fk_instance FOREIGN KEY (instance_id) REFERENCES channel_instances(instance_id) ON DELETE CASCADE
);

-- Índices para búsqueda rápida durante el ruteo de webhooks
CREATE INDEX IF NOT EXISTS idx_channel_instances_tenant ON channel_instances(tenant_id);
CREATE INDEX IF NOT EXISTS idx_conv_channels_external ON conversation_channels(external_userid, platform);
CREATE INDEX IF NOT EXISTS idx_conv_channels_instance ON conversation_channels(instance_id);

-- 1. Tabla: whatsapp_auth_state (Para persistencia multi-tenant Baileys)
CREATE TABLE IF NOT EXISTS whatsapp_auth_state (
  id            BIGSERIAL PRIMARY KEY,
  instance_id   TEXT        NOT NULL,
  key_id        TEXT        NOT NULL,
  key_type      TEXT        NOT NULL,
  data          JSONB       NOT NULL,
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_auth_state UNIQUE (instance_id, key_id, key_type)
);

CREATE INDEX IF NOT EXISTS idx_auth_state_instance 
ON whatsapp_auth_state (instance_id);

-- 2. Tabla: prompt_versiones (Para versionado y estados de prompts AI)
CREATE TABLE IF NOT EXISTS prompt_versiones (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         TEXT        NOT NULL,
  instance_id       TEXT        NOT NULL,
  version           TEXT        NOT NULL DEFAULT 'v1',
  status            TEXT        NOT NULL DEFAULT 'test'
                    CHECK (status IN ('test', 'active', 'archived')),

  prompt_text       TEXT,
  super_prompt_json JSONB,

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_prompt_tenant   ON prompt_versiones (tenant_id);
CREATE INDEX IF NOT EXISTS idx_prompt_instance ON prompt_versiones (instance_id);
CREATE INDEX IF NOT EXISTS idx_prompt_status   ON prompt_versiones (status);

-- 3. Constraint Crítica (Obligatoria: 1 solo prompt activo por instancia)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_prompt_per_instance
ON prompt_versiones(instance_id)
WHERE status = 'active';

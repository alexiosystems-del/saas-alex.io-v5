-- ==========================================================
-- 🏗️ ALEX IO — ENTERPRISE SAAS SCHEMA FIX (V3 - COMPLETE)
-- ==========================================================

-- USERS (avoiding reserved word 'user')
CREATE TABLE IF NOT EXISTS app_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOTS
CREATE TABLE IF NOT EXISTS bots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT DEFAULT 'demo-testing',
  name TEXT NOT NULL,
  prompt TEXT,
  tone TEXT DEFAULT 'professional',
  industry TEXT,
  objective TEXT,
  voice_enabled BOOLEAN DEFAULT false,
  translation_enabled BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- BOT CONFIGS
CREATE TABLE IF NOT EXISTS bot_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES bots(id) ON DELETE CASCADE,
  channel TEXT DEFAULT 'whatsapp',
  voice_model TEXT DEFAULT 'MINIMAX-ZH',
  translation_enabled BOOLEAN DEFAULT false,
  config JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEADS
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'NUEVOS',
  temperature TEXT DEFAULT 'COLD',
  lead_score NUMERIC DEFAULT 0,
  bot_id UUID REFERENCES bots(id),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LEAD TAGS
CREATE TABLE IF NOT EXISTS lead_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOMER MEMORIES (FIX CRITICAL ERROR)
CREATE TABLE IF NOT EXISTS customer_memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id TEXT NOT NULL,
  bot_id UUID REFERENCES bots(id),
  memory TEXT NOT NULL,
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RAG SOURCES
CREATE TABLE IF NOT EXISTS rag_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES bots(id),
  name TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  content TEXT,
  status TEXT DEFAULT 'INDEXED',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SESSIONS (for recovery)
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id TEXT NOT NULL,
  bot_id UUID REFERENCES bots(id),
  platform TEXT DEFAULT 'web',
  status TEXT DEFAULT 'active',
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI USAGE TRACKING
CREATE TABLE IF NOT EXISTS ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_id UUID REFERENCES bots(id),
  provider TEXT,
  tokens_used INTEGER DEFAULT 0,
  cost NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_temperature ON leads(temperature);
CREATE INDEX IF NOT EXISTS idx_customer_memories_customer ON customer_memories(customer_id);
CREATE INDEX IF NOT EXISTS idx_sessions_sender ON chat_sessions(sender_id);

-- SEED DEMO BOT
INSERT INTO bots (name, prompt, tone, industry, objective)
VALUES (
  'ALEX IO - Demo',
  'Eres ALEX IO, un asistente inteligente experto en ayudar con negocios. Respondes de forma clara, profesional y útil.',
  'professional',
  'SaaS',
  'Ayudar a usuarios con consultas sobre el sistema'
)
ON CONFLICT DO NOTHING;

-- ==========================================================
-- 🏗️ ALEX IO — ENTERPRISE SAAS SCHEMA FIX (V2 - GOLD)
-- ==========================================================

-- USERS (avoid reserved words)
create table if not exists app_users (
  id uuid primary key default gen_random_uuid(),
  email text,
  created_at timestamp default now()
);

-- BOTS
create table if not exists bots (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prompt text,
  tone text default 'professional',
  industry text default 'general',
  objective text default 'assist customers',
  voice_enabled boolean default false,
  translation_enabled boolean default false,
  status text default 'active',
  created_at timestamptz default now()
);

-- BOT CONFIG
create table if not exists bot_configs (
  id uuid primary key default gen_random_uuid(),
  bot_id uuid references bots(id) on delete cascade,
  instance_id text unique,
  channel text default 'baileys',
  status text default 'disconnected',
  settings jsonb default '{}',
  created_at timestamptz default now()
);

-- LEADS
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  status text default 'NEW',
  temperature text default 'COLD',
  bot_id uuid,
  created_at timestamp default now()
);

-- TAGS
create table if not exists lead_tags (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  tag text
);

-- MEMORIES (FIX ERROR)
create table if not exists customer_memories (
  id uuid primary key default gen_random_uuid(),
  customer_id text,
  memory text,
  created_at timestamp default now()
);

-- RAG FILES
create table if not exists rag_sources (
  id uuid primary key default gen_random_uuid(),
  name text,
  type text,
  content text,
  status text default 'INDEXED',
  created_at timestamp default now()
);

-- SEED DATA (Optional but recommended for testing)
insert into bots (name, prompt, industry, objective) 
values ('Bot Demo', 'Eres un asistente experto.', 'General', 'Ventas')
on conflict do nothing;

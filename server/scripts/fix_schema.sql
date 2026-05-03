-- EXTENSION
create extension if not exists "uuid-ossp";

-- =========================
-- WHATSAPP SESSIONS
-- =========================
create table if not exists whatsapp_sessions (
  id uuid primary key default uuid_generate_v4(),
  instance_id text,
  company_name text,
  provider text default 'baileys',
  status text default 'pending',
  voice_enabled boolean default false,
  target_language text default 'es',
  created_at timestamp default now()
);

-- =========================
-- BOTS
-- =========================
create table if not exists bots (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid,
  config jsonb,
  prompt text,
  created_at timestamp default now()
);

-- =========================
-- BOT CONFIGS (IA)
-- =========================
create table if not exists bot_configs (
  id uuid primary key default uuid_generate_v4(),
  bot_id text,
  prompt text,
  created_at timestamp default now()
);

-- =========================
-- MESSAGES (LIVE CHAT)
-- =========================
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  "user" text,
  text text,
  translation text,
  response text,
  created_at timestamp default now()
);

-- =========================
-- INDEXES (ESCALA)
-- =========================
create index if not exists idx_messages_created
on messages(created_at desc);

create index if not exists idx_bots_user
on bots(user_id);

-- =========================
-- FIX COLUMNAS (SI YA EXISTEN)
-- =========================
alter table whatsapp_sessions
add column if not exists provider text;

alter table whatsapp_sessions
add column if not exists voice_enabled boolean;

alter table whatsapp_sessions
add column if not exists target_language text;

alter table messages
add column if not exists translation text;

alter table messages
add column if not exists response text;

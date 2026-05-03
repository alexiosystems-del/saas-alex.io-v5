-- ==========================================================
-- 🏗️ ALEX IO — ENTERPRISE SAAS SCHEMA FIX (GOLD RELEASE)
-- ==========================================================

-- EXTENSION
create extension if not exists "pgcrypto";

-- =========================
-- TENANTS
-- =========================
create table if not exists tenants (
  id uuid primary key default gen_random_uuid(),
  name text,
  created_at timestamp default now()
);

-- INSERT DEFAULT TENANT (CRITICAL FOR ORPHAN PREVENTION)
insert into tenants (id, name)
values ('11111111-1111-1111-1111-111111111111', 'default')
on conflict do nothing;

-- =========================
-- BOTS
-- =========================
create table if not exists bots (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  name text not null,
  prompt text not null,
  model text default 'gpt-4o',
  temperature float default 0.7,
  active boolean default true,
  voice_enabled boolean default false,
  translation_enabled boolean default false,
  created_at timestamp default now()
);

-- =========================
-- LEADS
-- =========================
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  name text,
  phone text,
  email text,
  status text default 'new',
  tags text[] default '{}',
  created_at timestamp default now()
);

-- =========================
-- MEMORIES
-- =========================
create table if not exists customer_memories (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  customer_id text not null,
  memory text,
  created_at timestamp default now()
);

-- =========================
-- SEED BOT (INITIAL HYDRATION)
-- =========================
insert into bots (tenant_id, name, prompt)
values (
  '11111111-1111-1111-1111-111111111111',
  'Bot Demo',
  'Eres un asistente de ventas que responde claro, corto y convierte.'
)
on conflict do nothing;

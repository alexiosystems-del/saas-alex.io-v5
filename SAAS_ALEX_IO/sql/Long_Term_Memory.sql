-- =============================================
-- ALEX BRIAN — Memoria Larga (pgvector)
-- Ejecutar en Supabase SQL Editor
-- =============================================

-- 1. EXTENSIONES
-- ─────────────────────────────────────────────
create extension if not exists vector;
create extension if not exists "pgcrypto";


-- 2. TABLA PRINCIPAL: customer_memories
-- ─────────────────────────────────────────────
-- Cada fila es un "hecho" semántico sobre un cliente.
-- El embedding permite búsqueda por similaridad con pgvector.

create table if not exists customer_memories (
  id            uuid        primary key default gen_random_uuid(),
  tenant_id     uuid        not null references tenants(id) on delete cascade,
  customer_id   text        not null,
  content       text        not null,
  embedding     vector(1536),
  category      text        not null default 'fact',
  importance    int         not null default 3 check (importance between 1 and 5),
  source        text        not null default 'auto',
  access_count  int         not null default 0,
  last_accessed timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- category:  'preference' | 'issue' | 'purchase' | 'fact' | 'context'
-- importance: 1 (trivial) → 5 (crítico, siempre incluir)
-- source:    'auto' (extraído por IA) | 'manual' (operador lo cargó)


-- 3. ÍNDICES
-- ─────────────────────────────────────────────

-- Búsqueda vectorial HNSW (rápida, en memoria)
create index if not exists idx_memories_hnsw
  on customer_memories
  using hnsw (embedding vector_cosine_ops)
  with (m = 16, ef_construction = 64);

-- Filtros frecuentes del dispatcher
create index if not exists idx_memories_customer
  on customer_memories (tenant_id, customer_id, importance desc);

create index if not exists idx_memories_category
  on customer_memories (tenant_id, customer_id, category);

create index if not exists idx_memories_expires
  on customer_memories (expires_at)
  where expires_at is not null;


-- 4. FUNCIÓN: buscar memorias relevantes
-- ─────────────────────────────────────────────
-- Llamada por cada worker antes de construir el contexto.
-- Combina similaridad semántica con importancia para rankear.

create or replace function match_customer_memories(
  p_tenant_id    uuid,
  p_customer_id  text,
  p_embedding    vector(1536),
  p_limit        int     default 5,
  p_min_sim      float   default 0.70  -- similaridad mínima (0-1)
)
returns table (
  id          uuid,
  content     text,
  category    text,
  importance  int,
  similarity  float
)
language sql stable as $$
  select
    id,
    content,
    category,
    importance,
    round((1 - (embedding <=> p_embedding))::numeric, 4)::float as similarity
  from customer_memories
  where tenant_id   = p_tenant_id
    and customer_id = p_customer_id
    and (expires_at is null or expires_at > now())
    and (1 - (embedding <=> p_embedding)) >= p_min_sim
  order by
    (importance * 0.4 + (1 - (embedding <=> p_embedding)) * 0.6) desc
  limit p_limit;
$$;

-- Fórmula de ranking:
--   40% importancia + 60% similaridad semántica
-- Ajustar pesos según comportamiento en producción.


-- 5. FUNCIÓN: guardar una memoria nueva
-- ─────────────────────────────────────────────
-- Evita duplicados: si ya existe un hecho muy similar (>0.92),
-- actualiza la importancia en lugar de insertar otra fila.

create or replace function upsert_customer_memory(
  p_tenant_id   uuid,
  p_customer_id text,
  p_content     text,
  p_embedding   vector(1536),
  p_category    text    default 'fact',
  p_importance  int     default 3,
  p_source      text    default 'auto',
  p_expires_at  timestamptz default null,
  p_dup_threshold float default 0.92
)
returns uuid language plpgsql as $$
declare
  v_existing_id uuid;
  v_new_id      uuid;
begin
  -- Buscar duplicado cercano
  select id into v_existing_id
  from customer_memories
  where tenant_id   = p_tenant_id
    and customer_id = p_customer_id
    and (1 - (embedding <=> p_embedding)) >= p_dup_threshold
  order by embedding <=> p_embedding
  limit 1;

  if found then
    -- Actualizar importancia si la nueva es mayor
    update customer_memories
    set importance  = greatest(importance, p_importance),
        updated_at  = now()
    where id = v_existing_id;
    return v_existing_id;
  end if;

  -- Insertar nueva memoria
  insert into customer_memories
    (tenant_id, customer_id, content, embedding, category, importance, source, expires_at)
  values
    (p_tenant_id, p_customer_id, p_content, p_embedding, p_category, p_importance, p_source, p_expires_at)
  returning id into v_new_id;

  return v_new_id;
end;
$$;


-- 6. FUNCIÓN: registrar acceso a una memoria
-- ─────────────────────────────────────────────
-- Cada vez que una memoria se usa en un contexto,
-- se registra. Sirve para limpiar las que nunca se usan.

create or replace function touch_memories(p_ids uuid[])
returns void language sql as $$
  update customer_memories
  set access_count  = access_count + 1,
      last_accessed = now()
  where id = any(p_ids);
$$;


-- 7. FUNCIÓN: limpiar memorias vencidas y sin uso
-- ─────────────────────────────────────────────
-- Correr como cron job semanal en Supabase (pg_cron).

create or replace function purge_stale_memories(
  p_days_without_access int default 60
)
returns int language plpgsql as $$
declare
  v_deleted int;
begin
  delete from customer_memories
  where
    -- Expiradas explícitamente
    (expires_at is not null and expires_at < now())
    or
    -- Nunca accedidas y muy viejas (importancia baja)
    (
      access_count = 0
      and importance <= 2
      and created_at < now() - make_interval(days => p_days_without_access)
    );

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;


-- 8. ROW LEVEL SECURITY
-- ─────────────────────────────────────────────
alter table customer_memories enable row level security;

create policy "tenant_isolation_memories"
  on customer_memories for all
  using (tenant_id = auth.uid());


-- 9. VISTA: resumen de memoria por cliente
-- ─────────────────────────────────────────────
create or replace view customer_memory_summary as
select
  tenant_id,
  customer_id,
  count(*)                                          as total_memories,
  count(*) filter (where importance >= 4)           as high_importance,
  count(*) filter (where source = 'auto')           as auto_generated,
  count(*) filter (where source = 'manual')         as manual,
  round(avg(importance)::numeric, 1)                as avg_importance,
  round(avg(access_count)::numeric, 1)              as avg_accesses,
  max(created_at)                                   as last_memory_at,
  max(last_accessed)                                as last_accessed_at
from customer_memories
where expires_at is null or expires_at > now()
group by tenant_id, customer_id;

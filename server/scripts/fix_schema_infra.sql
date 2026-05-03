-- =========================
-- SYSTEM LOGS
-- =========================
create table if not exists system_logs (
    id uuid primary key default uuid_generate_v4(),
    level text,
    source text,
    message text,
    metadata jsonb,
    created_at timestamp default now()
);

-- MULTI-TENANT EN MESSAGES
alter table messages
add column if not exists tenant_id uuid;

create index if not exists idx_messages_tenant
on messages(tenant_id);

create index if not exists idx_system_logs_created
on system_logs(created_at desc);

-- FIX PARA AGREGAR created_at a tablas existentes
alter table whatsapp_sessions
add column if not exists created_at timestamp default now();

alter table bot_configs
add column if not exists created_at timestamp default now();

alter table bots
add column if not exists created_at timestamp default now();

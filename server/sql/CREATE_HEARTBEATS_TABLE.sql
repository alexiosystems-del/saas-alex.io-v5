-- ====================================================================
-- TABLA: system_heartbeats — Monitoreo de uptime 24/7
-- El servidor escribe un heartbeat cada 10 minutos.
-- Si hay un gap > 15 min, significa que hubo una caída.
-- ====================================================================

CREATE TABLE IF NOT EXISTS public.system_heartbeats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamptz DEFAULT now() NOT NULL,
    hostname text,
    uptime_seconds integer,
    memory_rss_mb integer,
    memory_heap_mb integer,
    active_bots integer DEFAULT 0,
    version text,
    status text DEFAULT 'alive' -- 'alive' | 'shutdown' | 'error'
);

-- Index para queries de monitoreo rápidas
CREATE INDEX IF NOT EXISTS idx_heartbeats_created_at 
ON public.system_heartbeats (created_at DESC);

-- Auto-purge: eliminar heartbeats > 7 días (opcional, evita que la tabla crezca infinito)
-- Ejecutar manualmente o con pg_cron si lo tenés habilitado:
-- DELETE FROM system_heartbeats WHERE created_at < now() - interval '7 days';

-- Verificar uptime de las últimas 24h:
-- SELECT created_at, uptime_seconds, memory_rss_mb, active_bots, status
-- FROM system_heartbeats
-- WHERE created_at > now() - interval '24 hours'
-- ORDER BY created_at DESC;

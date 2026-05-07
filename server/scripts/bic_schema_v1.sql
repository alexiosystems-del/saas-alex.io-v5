-- ========================================================
-- SCHEMA: Bot Initiator Core (BIC) v1.0
-- Objetivo: Almacenar la estrategia comercial y memoria
-- ========================================================

-- 1. Perfil del Iniciador del Bot
-- Aquí vive la "intención" y el "nicho" del agente.
CREATE TABLE IF NOT EXISTS public.bot_initiator_profile (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bot_id TEXT NOT NULL UNIQUE, -- Relación con la instancia/bot
    tenant_id UUID NOT NULL,
    bot_name TEXT NOT NULL,
    business_type TEXT, -- E-commerce, SaaS, Real Estate, etc.
    main_goal TEXT, -- ventas, soporte, agendamiento
    value_prop TEXT, -- Oferta estrella o propuesta de valor
    tone TEXT DEFAULT 'professional', -- professional, close, premium
    base_language TEXT DEFAULT 'es',
    allowed_languages TEXT[] DEFAULT '{es,en}',
    primary_cta TEXT, -- Link de Calendly, WhatsApp, etc.
    qa_score FLOAT DEFAULT 0, -- Resultado de la validación del prompt
    readiness_json JSONB DEFAULT '{"initiator": true, "prompt": false, "rag": false, "connectors": false}',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Memoria de Usuario (LTM - Long Term Memory)
-- Estructura para persistir hechos conocidos del cliente.
CREATE TABLE IF NOT EXISTS public.user_memory_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id TEXT NOT NULL, -- JID de WhatsApp o ID de usuario
    facts JSONB DEFAULT '[]', -- [{fact: "le gusta X", category: "preference", timestamp: "..."}]
    lead_score INTEGER DEFAULT 0,
    last_interaction TIMESTAMPTZ DEFAULT now(),
    UNIQUE(tenant_id, customer_id)
);

-- 3. Índices para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_bic_bot_id ON public.bot_initiator_profile(bot_id);
CREATE INDEX IF NOT EXISTS idx_bic_tenant_id ON public.bot_initiator_profile(tenant_id);
CREATE INDEX IF NOT EXISTS idx_memory_customer ON public.user_memory_profiles(customer_id);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.bot_initiator_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_memory_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (Permitir acceso al backend con service_role o filtrado por tenant_id)
-- Nota: En producción, estas políticas se ajustan según el rol.

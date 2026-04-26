-- =============================================
-- ALEX IO: COMPLETE SUPABASE STABILITY FIX
-- =============================================

-- 1. Enable pgvector (Standard for RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create Table 'document_chunks' (Fixes Knowledge/RAG upload)
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    document_name TEXT NOT NULL,
    chunk_content TEXT NOT NULL,
    embedding VECTOR(1536), -- Req: OpenAI format
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Table 'whatsapp_auth_state' (Fixes Render persistence)
CREATE TABLE IF NOT EXISTS public.whatsapp_auth_state (
    instance_id TEXT NOT NULL,
    key_name TEXT NOT NULL,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (instance_id, key_name)
);

-- 4. Standardized RAG Search Function
CREATE OR REPLACE FUNCTION match_document_chunks(
    query_embedding VECTOR(1536),
    match_tenant_id TEXT,
    match_instance_id TEXT,
    match_count INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    document_name TEXT,
    chunk_content TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dc.id,
        dc.document_name,
        dc.chunk_content,
        1 - (dc.embedding <=> query_embedding) AS similarity
    FROM public.document_chunks dc
    WHERE dc.tenant_id = match_tenant_id AND dc.instance_id = match_instance_id
    ORDER BY dc.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

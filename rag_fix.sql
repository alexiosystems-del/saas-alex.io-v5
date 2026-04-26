-- =============================================
-- RAG FIX: SUPER-SCHEDMA FOR DOCUMENT CHUNKS
-- =============================================

-- 1. Enable pgvector (Standard for RAG)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create/Fix Table 'document_chunks'
-- Ensures columns 'chunk_content' and 'document_name' exist.
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    document_name TEXT NOT NULL,
    chunk_content TEXT NOT NULL,
    embedding VECTOR(1536), -- Req: OpenAI format
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Standardized Search Function
-- This matches what ragService.js expects.
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

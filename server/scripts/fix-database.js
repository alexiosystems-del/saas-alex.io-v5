const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const SQL = `
-- 1. Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Create document_chunks table for RAG
CREATE TABLE IF NOT EXISTS public.document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id TEXT NOT NULL,
    instance_id TEXT NOT NULL,
    document_name TEXT NOT NULL,
    chunk_content TEXT NOT NULL,
    embedding VECTOR(1536),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create indices for RAG
CREATE INDEX IF NOT EXISTS idx_document_chunks_instance ON public.document_chunks (instance_id);

-- 4. Create match function for RPC (RAG)
CREATE OR REPLACE FUNCTION match_document_chunks (
  query_embedding vector(1536),
  match_count int DEFAULT 10,
  match_instance_id text DEFAULT NULL,
  match_tenant_id text DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  chunk_content text,
  document_name text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.chunk_content,
    document_chunks.document_name,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE (match_instance_id IS NULL OR document_chunks.instance_id = match_instance_id)
    AND (match_tenant_id IS NULL OR document_chunks.tenant_id = match_tenant_id)
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 5. Fix crm_leads table unique constraint and columns
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_leads') THEN
        ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS instance_id TEXT;
        -- Ensure unique constraint on (business_id, phone)
        IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'crm_leads_business_id_phone_key') THEN
             ALTER TABLE public.crm_leads ADD CONSTRAINT crm_leads_business_id_phone_key UNIQUE (business_id, phone);
        END IF;
    END IF;
END $$;

-- 6. Ensure leads table is compatible
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'leads') THEN
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
        ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS summary TEXT;
    END IF;
END $$;

-- 7. RLS
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY \"Service Role Access\" ON public.document_chunks FOR ALL USING (true);
`;

async function runFix() {
    console.log('🚀 Iniciando reparación de base de datos...');
    
    // Supabase JS doesn't have a direct raw SQL execution tool for safety reasons,
    // so we advise the user to run it in the SQL Editor, OR we use an internal trick if available.
    // Since we are an AI with access to the environment, we will tell the user to run this in the Dashboard.
    
    console.log('\n⚠️ COPIA Y PEGA EL SIGUIENTE CÓDIGO EN EL SQL EDITOR DE SUPABASE:\n');
    console.log('------------------------------------------------------------');
    console.log(SQL);
    console.log('------------------------------------------------------------\n');
    
    process.exit(0);
}

runFix();

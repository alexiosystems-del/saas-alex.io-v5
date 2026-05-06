require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
    console.log('--- DIAGNÓSTICO DE CONEXIÓN ---');
    
    // 1. Verificar Tabla whatsapp_auth_state (Para el QR)
    const { data: authData, error: authError } = await supabase.from('whatsapp_auth_state').select('count').limit(1);
    if (authError) {
        console.log('❌ Error en whatsapp_auth_state:', authError.message);
    } else {
        console.log('✅ Tabla whatsapp_auth_state accesible.');
    }

    // 2. Verificar Tabla document_chunks (Para el RAG)
    const { data: ragData, error: ragError } = await supabase.from('document_chunks').select('count').limit(1);
    if (ragError) {
        console.log('❌ Error en document_chunks:', ragError.message);
    } else {
        console.log('✅ Tabla document_chunks accesible.');
    }

    // 3. Verificar Función match_document_chunks
    const fakeVector = new Array(1536).fill(0);
    const { error: rpcError } = await supabase.rpc('match_document_chunks', {
        query_embedding: fakeVector,
        match_tenant_id: 'test',
        match_instance_id: 'test',
        match_count: 1
    });
    if (rpcError) {
        console.log('❌ Error en RPC match_document_chunks:', rpcError.message);
    } else {
        console.log('✅ Función RPC match_document_chunks funcionando.');
    }

    // 4. Verificar Tabla crm_leads (Para el CRM)
    const { error: crmError } = await supabase.from('crm_leads').select('count').limit(1);
    if (crmError) {
        console.log('❌ Error en crm_leads:', crmError.message);
    } else {
        console.log('✅ Tabla crm_leads accesible.');
    }

    process.exit(0);
}

runDiagnostics();

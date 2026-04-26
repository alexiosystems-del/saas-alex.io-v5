require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDetails() {
    console.log('🔍 Verificando detalles técnicos...');

    // 1. Probar un insert en document_chunks (con un vector falso de 1536)
    console.log('🧪 Probando inserción en "document_chunks"...');
    const fakeVector = new Array(1536).fill(0);
    const { error: insertError } = await supabase.from('document_chunks').insert({
        instance_id: 'test_check',
        document_name: 'test_check.txt',
        chunk_content: 'test content',
        embedding: fakeVector
    }).select();

    if (insertError) {
        console.error('❌ Error de inserción:', insertError.message);
        console.error('Detalles:', insertError.details);
        console.error('Pista:', insertError.hint);
    } else {
        console.log('✅ Inserción de prueba EXITOSA.');
        // Limpiar
        await supabase.from('document_chunks').delete().eq('instance_id', 'test_check');
    }

    // 2. Verificar RPC
    console.log('📡 Verificando función RPC "match_document_chunks"...');
    const { error: rpcError } = await supabase.rpc('match_document_chunks', {
        query_embedding: fakeVector,
        match_tenant_id: '00000000-0000-0000-0000-000000000000', // UUID falso
        match_instance_id: 'none',
        match_count: 1
    });

    if (rpcError) {
        console.error('❌ Error de RPC:', rpcError.message);
        if (rpcError.message.includes('not found')) {
            console.log('💡 La función SQL "match_document_chunks" NO está creada.');
        }
    } else {
        console.log('✅ Función RPC "match_document_chunks" existe y funciona.');
    }
}

checkDetails();

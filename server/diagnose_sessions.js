require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function runDiagnostics() {
    console.log('--- DIAGNÓSTICO DE WHATSAPP_SESSIONS ---');
    
    // Verificar Tabla whatsapp_sessions
    const { data, error } = await supabase.from('whatsapp_sessions').select('count').limit(1);
    if (error) {
        console.log('❌ Error en whatsapp_sessions:', error.message);
    } else {
        console.log('✅ Tabla whatsapp_sessions accesible.');
    }

    process.exit(0);
}

runDiagnostics();

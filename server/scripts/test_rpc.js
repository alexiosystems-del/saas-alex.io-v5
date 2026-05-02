require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function tryExec() {
    console.log('🧪 Testing if exec_sql RPC exists...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: 'SELECT 1' });
    
    if (error) {
        console.log('❌ exec_sql RPC not found or failed:', error.message);
    } else {
        console.log('✅ exec_sql RPC FOUND! Data:', data);
    }
}

tryExec();

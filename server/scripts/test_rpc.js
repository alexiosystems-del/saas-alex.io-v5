const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testRpc() {
    console.log('🧪 Testing exec_sql RPC...');
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: 'SELECT 1;' });
    if (error) {
        console.error('❌ RPC exec_sql failed:', error.message);
    } else {
        console.log('✅ RPC exec_sql is available!', data);
    }
}

testRpc();

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
    console.log('Testing connection to:', supabaseUrl);
    try {
        const { data, error } = await supabase.from('app_users').select('count', { count: 'exact', head: true });
        if (error) {
            console.error('❌ Supabase error:', error.message);
        } else {
            console.log('✅ Connection successful. Row count:', data);
        }
    } catch (err) {
        console.error('❌ Fetch error:', err.message);
    }
}

testConnection();

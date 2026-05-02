require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function listTables() {
    console.log('📋 Listing all tables in public schema...');
    // There is no direct "list tables" in supabase-js, but we can query information_schema if we had an RPC.
    // Since we don't, we will try to select from a common table like 'users' or 'profiles'.
    
    const tablesToTry = ['whatsapp_sessions', 'bot_configs', 'crm_leads', 'memory', 'users'];
    for (const t of tablesToTry) {
        const { error } = await supabase.from(t).select('count', { count: 'exact', head: true });
        if (error) {
            console.log(`❌ ${t}: ${error.message}`);
        } else {
            console.log(`✅ ${t}: OK`);
        }
    }
}

listTables();

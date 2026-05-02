require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkLevelGod() {
    console.log('🚀 Checking "Nivel Dios" Infrastructure...');
    
    const tables = [
        'whatsapp_sessions',
        'bot_configs',
        'crm_leads',
        'memory',
        'analytics',
        'ai_cascade_logs'
    ];

    for (const table of tables) {
        const { error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.log(`❌ Table ${table}: MISSING or ERROR (${error.message})`);
        } else {
            console.log(`✅ Table ${table}: OK`);
        }
    }

    // Check specific columns in bot_configs
    console.log('\n🔍 Checking Critical Columns in bot_configs...');
    const { data: config, error: configError } = await supabase.from('bot_configs').select('*').limit(1);
    
    if (config && config.length > 0) {
        const row = config[0];
        const godColumns = ['provider', 'd360_api_key', 'access_token', 'phone_number_id', 'manychat_token'];
        godColumns.forEach(col => {
            if (col in row) {
                console.log(`✅ Column ${col}: OK`);
            } else {
                console.log(`❌ Column ${col}: MISSING`);
            }
        });
    } else {
        console.log('⚠️ No rows in bot_configs to check columns via JS. Please run LEVEL_GOD_SETUP.sql in Supabase.');
    }
}

checkLevelGod();

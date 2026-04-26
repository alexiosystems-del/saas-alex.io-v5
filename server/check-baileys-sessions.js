require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSessions() {
    console.log('🔍 Checking Baileys Sessions in Supabase...');
    try {
        const { data: sessions, error } = await supabase
            .from('whatsapp_sessions')
            .select('instance_id, status, updated_at, company_name');

        if (error) {
            console.error('❌ Error fetching sessions:', error.message);
            return;
        }

        if (!sessions || sessions.length === 0) {
            console.log('ℹ️ No sessions found in whatsapp_sessions table.');
        } else {
            console.table(sessions);
        }

        // Also check bot_configs
        const { data: configs, error: configError } = await supabase
            .from('bot_configs')
            .select('id, system_prompt, user_id');
        
        if (configError) {
             console.error('❌ Error fetching bot_configs:', configError.message);
        } else {
            console.log('\n🤖 Bot Configurations:');
            console.table(configs.map(c => ({ id: c.id, user_id: c.user_id, has_prompt: !!c.system_prompt })));
        }

    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }
}

checkSessions();

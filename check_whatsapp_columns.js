
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './server/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing SUPABASE_URL or SUPABASE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
    console.log('🔍 Checking whatsapp_sessions schema...');
    
    const columnsToCheck = [
        'id', 
        'instance_id',
        'tenant_id',
        'company_name',
        'status',
        'provider',
        'voice_enabled',
        'target_language',
        'meta_access_token', 
        'meta_phone_number_id', 
        'dialog_api_key', 
        'custom_prompt',
        'updated_at'
    ];

    for (const col of columnsToCheck) {
        try {
            const { error } = await supabase.from('whatsapp_sessions').select(col).limit(1);
            if (error) {
                console.error(`❌ Column [${col}] error: ${error.message}`);
            } else {
                console.log(`✅ Column [${col}] is present.`);
            }
        } catch (e) {
            console.error(`❌ Column [${col}] crash: ${e.message}`);
        }
    }
}

diagnose();

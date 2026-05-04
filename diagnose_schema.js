
const { supabase } = require('./server/services/supabaseClient');

async function checkSchema() {
    console.log('🔍 [DIAGNOSTIC] Checking table schemas...');

    // 1. Check whatsapp_sessions
    console.log('\n--- Checking whatsapp_sessions ---');
    const { error: wsError } = await supabase
        .from('whatsapp_sessions')
        .select('id, tenant_id, instance_id, status')
        .limit(1);
    if (wsError) console.error('❌ Error:', wsError.message);
    else console.log('✅ Base columns OK');

    // 2. Check bot_configs
    console.log('\n--- Checking bot_configs ---');
    const bcColumns = ['id', 'bot_id', 'instance_id', 'voice_enabled', 'translation_enabled', 'strategy'];
    for (const col of bcColumns) {
        const { error } = await supabase.from('bot_configs').select(col).limit(1);
        if (error) console.error(`❌ Column [${col}] missing or inaccessible:`, error.message);
        else console.log(`✅ Column [${col}] OK`);
    }

    // 3. Check bots
    console.log('\n--- Checking bots ---');
    const bColumns = ['id', 'name', 'prompt', 'voice_enabled', 'translation_enabled'];
    for (const col of bColumns) {
        const { error } = await supabase.from('bots').select(col).limit(1);
        if (error) console.error(`❌ Column [${col}] missing or inaccessible:`, error.message);
        else console.log(`✅ Column [${col}] OK`);
    }
}

checkSchema().catch(console.error);

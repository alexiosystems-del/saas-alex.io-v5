const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const alexBrain = require('./services/alexBrain');
const { supabaseAdmin } = require('./services/supabaseClient');

async function smokeTest() {
    console.log('🧪 Starting ALEX IO E2E Smoke Test...');
    
    // Dynamically find a bot from provision
    const { data: activeBots } = await supabaseAdmin.from('bots').select('*').eq('status', 'active').limit(1);
    if (!activeBots || activeBots.length === 0) {
        console.error('❌ No active bots found in DB. Run provision first.');
        process.exit(1);
    }
    
    const testBot = activeBots[0];
    console.log(`🤖 Testing with bot: ${testBot.name} (ID: ${testBot.id})`);
    
    // Ensure we have a tenantId (fallback to system if missing in row)
    const tenantId = testBot.tenant_id || '3fe010bd-bfd3-4865-8a49-4a8e28abb4c7';

    const testMessage = "Hola, estoy interesado en comprar un departamento en la zona norte.";
    
    console.log('Step 1: AI Brain Response...');
    const response = await alexBrain.generateResponse({
        message: testMessage,
        history: [],
        botConfig: { 
            bot_id: testBot.id, 
            bot_name: testBot.name,
            tenantId: tenantId 
        },
        metadata: {}
    });

    if (response && response.text) {
        console.log('✅ AI Response received:', response.text.substring(0, 50) + '...');
        console.log('   Model used:', response.trace?.model || 'unknown');
    } else {
        console.error('❌ AI Response failed.');
    }

    console.log('Step 2: Database Check (bot_initiator_profile)...');
    const { data: profile } = await supabaseAdmin
        .from('bot_initiator_profile')
        .select('*')
        .eq('bot_id', testBot.id)
        .single();
    
    if (profile) {
        console.log('✅ BIC Profile found for test bot.');
    } else {
        console.warn('⚠️ BIC Profile not found (Legacy mode check).');
    }

    console.log('🏁 Smoke Test Complete.');
}

smokeTest();

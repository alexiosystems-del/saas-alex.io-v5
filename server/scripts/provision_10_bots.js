const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { supabaseAdmin } = require('../services/supabaseClient');

async function provision() {
    console.log('🚀 Provisioning 10 Active Bots (Manual Sync Mode)...');
    
    if (!supabaseAdmin) {
        console.error('❌ Supabase Admin client not available.');
        process.exit(1);
    }

    const tenants = [
        'Elite Real Estate', 'SaaS Alpha', 'AutoSales Global', 'EduTech Pro', 
        'HealthConnect', 'Fintech Secure', 'Logistic AI', 'Retail Bot 24/7', 
        'GymFlow AI', 'TravelSmart'
    ];

    for (const name of tenants) {
        try {
            console.log(`Processing: ${name}...`);
            const botName = `Alex AI - ${name}`;
            
            // 1. Check/Insert Bot
            let { data: existing } = await supabaseAdmin.from('bots').select('id').eq('name', botName).maybeSingle();
            
            let botId;
            if (existing) {
                botId = existing.id;
                console.log(`   Found existing: ${botId}`);
            } else {
                const { data: botData, error: bErr } = await supabaseAdmin
                    .from('bots')
                    .insert({
                        name: botName,
                        status: 'active',
                        industry: 'Enterprise',
                        objective: 'Sales Conversion',
                        tone: 'professional'
                    })
                    .select()
                    .single();
                if (bErr) throw bErr;
                botId = botData.id;
                console.log(`   Created new: ${botId}`);
            }

            // 2. Sync Bot Config
            const { error: cErr } = await supabaseAdmin
                .from('bot_configs')
                .upsert({
                    bot_id: botId,
                    channel: 'whatsapp',
                    config: {
                        model_cascade: ['gemini', 'gpt', 'claude'],
                        voiceMode: 'always'
                    }
                }, { onConflict: 'bot_id' });
            
            if (cErr) console.warn(`   ⚠️ Config Warning: ${cErr.message}`);

            console.log(`✅ ${name} sync complete.`);
        } catch (err) {
            console.error(`❌ Failed to process ${name}:`, err.message);
        }
    }

    console.log('🏁 Provisioning complete.');
}

provision();

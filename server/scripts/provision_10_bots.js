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
            let tenantId = '3fe010bd-bfd3-4865-8a49-4a8e28abb4c7'; // Official System Tenant
            if (existing) {
                botId = existing.id;
                console.log(`   Found existing: ${botId} (Tenant: ${tenantId})`);
            } else {
                const { data: botData, error: bErr } = await supabaseAdmin
                    .from('bots')
                    .insert({
                        name: botName,
                        status: 'active',
                        industry: 'Enterprise',
                        objective: 'Sales Conversion',
                        tone: 'professional',
                        tenant_id: tenantId
                    })
                    .select()
                    .single();
                if (bErr) throw bErr;
                botId = botData.id;
                console.log(`   Created new: ${botId}`);
            }

            // 2. Sync BIC Profile (Fase 2 Architecture)
            const { error: pErr } = await supabaseAdmin
                .from('bot_initiator_profile')
                .upsert({
                    bot_id: botId,
                    tenant_id: tenantId,
                    bot_name: botName,
                    business_type: 'Enterprise SaaS',
                    main_goal: 'Cierre de ventas y agendamiento',
                    value_prop: 'Infraestructura Universal de Comunicación IA',
                    tone: 'professional',
                    primary_cta: 'Agendar Demo',
                    base_language: 'es',
                    updated_at: new Date().toISOString()
                }, { onConflict: 'bot_id' });
            
            if (pErr) console.warn(`   ⚠️ BIC Warning: ${pErr.message}`);

            console.log(`✅ ${name} provisioned in BIC.`);
        } catch (err) {
            console.error(`❌ Failed to process ${name}:`, err.message);
        }
    }

    console.log('🏁 Provisioning complete.');
}

provision();

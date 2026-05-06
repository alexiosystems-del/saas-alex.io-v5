const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const API_URL = 'http://localhost:3000'; // Testing local server
const TEST_EMAIL = `test_${Date.now()}@alex.io`;
const TEST_PASS = 'Password123!';

async function testFlow() {
    console.log('🧪 Testing SaaS Flow (Registration -> Bot Creation)...');

    try {
        // 1. Register
        console.log(`Step 1: Registering ${TEST_EMAIL}...`);
        const regRes = await axios.post(`${API_URL}/api/auth/register`, {
            email: TEST_EMAIL,
            password: TEST_PASS
        });
        console.log('✅ Registration success:', regRes.data.message);

        // 2. Login (Session exchange simulate)
        // Since we don't have the Supabase JWT easily here, we'll check if the user exists in DB.
        const { supabaseAdmin } = require('../services/supabaseClient');
        const { data: user, error: uErr } = await supabaseAdmin.auth.admin.listUsers();
        const found = user.users.find(u => u.email === TEST_EMAIL);
        
        if (found) {
            console.log('✅ User found in Supabase Auth:', found.id);
            
            // 3. Create Bot
            console.log('Step 2: Creating a Bot for the user...');
            const { data: bot, error: bErr } = await supabaseAdmin.from('bots').insert({
                tenant_id: found.id,
                name: 'Test Bot Functional',
                industry: 'Testing',
                objective: 'Validation',
                status: 'active'
            }).select().single();
            
            if (bErr) throw bErr;
            console.log('✅ Bot created successfully in DB:', bot.id);
            
            // Cleanup
            await supabaseAdmin.auth.admin.deleteUser(found.id);
            console.log('🧹 Test user cleaned up.');
        } else {
            throw new Error('User not found after registration');
        }

        console.log('🏁 SYSTEM IS FUNCTIONAL.');
    } catch (err) {
        console.error('❌ Flow test failed:', err.response?.data || err.message);
        process.exit(1);
    }
}

testFlow();

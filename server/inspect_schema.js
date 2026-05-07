const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { supabaseAdmin } = require('./services/supabaseClient');

async function checkSchema() {
    console.log('--- Inspecting bot_configs schema ---');
    if (!supabaseAdmin) {
        console.error('Supabase Admin is NULL');
        return;
    }
    const { data, error } = await supabaseAdmin.from('bot_configs').select('*').limit(1);
    if (error) {
        console.error('Error:', error);
    } else {
        console.log('Columns found:', Object.keys(data[0] || {}));
    }
}
checkSchema();

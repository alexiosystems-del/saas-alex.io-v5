const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });
const { supabaseAdmin } = require('./services/supabaseClient');

async function findTenant() {
    console.log('--- Searching for valid tenant_id ---');
    if (!supabaseAdmin) return;
    
    // Try profiles
    const { data: p } = await supabaseAdmin.from('profiles').select('id').limit(1);
    if (p?.[0]) { console.log('Found in profiles:', p[0].id); return; }
    
    // Try whatsapp_sessions
    const { data: s } = await supabaseAdmin.from('whatsapp_sessions').select('tenant_id').limit(1);
    if (s?.[0]) { console.log('Found in whatsapp_sessions:', s[0].tenant_id); return; }
    
    console.log('No tenant found. Using zero UUID.');
}
findTenant();

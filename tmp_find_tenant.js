const { supabase } = require('./server/services/supabaseClient');
async function find() {
    const { data } = await supabase.from('whatsapp_sessions').select('tenant_id').eq('instance_id', 'alex_1775642923684').single();
    console.log('TENANT_ID:', data?.tenant_id);
}
find();

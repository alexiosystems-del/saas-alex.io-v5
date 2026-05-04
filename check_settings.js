
const { supabase } = require('./server/services/supabaseClient');

async function checkSettings() {
    const { data, error } = await supabase.from('bot_configs').select('settings').limit(1);
    if (error) {
        console.error('❌ Column [settings] missing:', error.message);
    } else {
        console.log('✅ Column [settings] OK');
    }
}
checkSettings();

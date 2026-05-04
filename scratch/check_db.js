const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: 'C:/Users/Admin2/.gemini/antigravity/scratch/antigravity/core-v5-stable/server/.env' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
    const { data: selectData, error: selectError } = await supabase.from('whatsapp_sessions').select('*').limit(1);
    if (selectError) {
        console.error('Direct select failed:', selectError.message);
    } else {
        console.log('Columns found in whatsapp_sessions:', Object.keys(selectData[0] || {}));
    }
}

checkColumns();

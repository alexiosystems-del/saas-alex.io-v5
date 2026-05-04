const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkColumns() {
    const { data, error } = await supabase
        .from('bot_configs')
        .select('objective')
        .limit(1);

    if (error) {
        console.error('❌ bot_configs objective MISSING:', error.message);
    } else {
        console.log('✅ bot_configs objective EXISTS');
    }
}

checkColumns();

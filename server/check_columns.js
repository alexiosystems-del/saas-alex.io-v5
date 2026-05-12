
const { supabaseAdmin } = require('./services/supabaseClient');

async function checkColumns() {
    try {
        console.log('--- CHECKING COLUMNS FOR "bots" ---');
        const { data, error } = await supabaseAdmin.rpc('get_table_columns', { table_name_param: 'bots' });
        
        if (error) {
            console.error('RPC failed, trying query...');
            const { data: cols, error: qErr } = await supabaseAdmin.from('bots').select('*').limit(0);
            if (qErr) {
                console.error('Query failed:', qErr.message);
            } else {
                console.log('Columns found:', Object.keys(cols[0] || {}));
            }
        } else {
            console.log('Columns (RPC):', data);
        }

        console.log('\n--- CHECKING COLUMNS FOR "bot_configs" ---');
        const { data: cols2, error: qErr2 } = await supabaseAdmin.from('bot_configs').select('*').limit(0);
        if (qErr2) {
            console.error('Query failed:', qErr2.message);
        } else {
            console.log('Columns found:', Object.keys(cols2[0] || {}));
        }
    } catch (e) {
        console.error('Error:', e.message);
    }
}

checkColumns();

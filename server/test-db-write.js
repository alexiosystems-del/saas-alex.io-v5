require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testWrite() {
    console.log('🧪 Testing write to whatsapp_sessions...');
    const testId = 'test_' + Date.now();
    try {
        const { data, error } = await supabase
            .from('whatsapp_sessions')
            .upsert({
                instance_id: testId,
                session_id: testId,
                key_type: 'metadata',
                key_id: 'status',
                value: '{}',
                status: 'testing'
            });

        if (error) {
            console.error('❌ Write failed:', error.message);
            if (error.message.includes('row-level security')) {
                console.error('💡 RLS is likely blocking the write for this key.');
            }
        } else {
            console.log('✅ Write successful!');
            // Cleanup
            await supabase.from('whatsapp_sessions').delete().eq('instance_id', testId);
            console.log('🧹 Cleanup successful!');
        }
    } catch (err) {
        console.error('❌ Unexpected error:', err.message);
    }
}

testWrite();

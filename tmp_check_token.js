const { supabase } = require('./server/services/supabaseClient');
const { decrypt } = require('./server/utils/encryptionHelper');
async function find() {
    const { data } = await supabase.from('whatsapp_sessions').select('credentials_encrypted').eq('instance_id', 'alex_1775642923684').single();
    if (data && data.credentials_encrypted) {
        const decrypted = JSON.parse(decrypt(data.credentials_encrypted));
        console.log('MANYCHAT_TOKEN:', decrypted.manychatToken);
    }
}
find();

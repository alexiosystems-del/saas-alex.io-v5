const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

// --- VALIDATE KEY ---
// Supabase's real modern keys can start with sb_secret_ / sb_publishable_.
// Only reject clearly placeholder/example values.
const isDummyKey = (key) => {
    if (!key) return true;

    const normalized = String(key).trim();
    if (!normalized) return true;

    const placeholderSnippets = [
        'your_service_role_key',
        'your_supabase_key',
        'your_anon_key',
        'your-anon-key',
        'your-service-role-key',
        'placeholder',
        'changeme',
        'dummy'
    ];

    return placeholderSnippets.some((snippet) => normalized.toLowerCase().includes(snippet));
};


const isKeyValid = (key) => {
    if (!key) return false;
    const normalized = String(key).trim();
    return normalized.startsWith('eyJ') && !normalized.includes('placeholder') && !normalized.includes('dummy');
};

const supabaseKey = (isKeyValid(process.env.SUPABASE_SERVICE_ROLE_KEY) ? process.env.SUPABASE_SERVICE_ROLE_KEY : null)
    || (isKeyValid(process.env.SUPABASE_ANON_KEY) ? process.env.SUPABASE_ANON_KEY : null)
    || (isKeyValid(process.env.SUPABASE_KEY) ? process.env.SUPABASE_KEY : null)
    || (isKeyValid(process.env.VITE_SUPABASE_ANON_KEY) ? process.env.VITE_SUPABASE_ANON_KEY : null);

let supabase = null;
let supabaseAdmin = null;

console.log(`[BOOT] Supabase Config: URL=${supabaseUrl ? supabaseUrl.substring(0, 20) : 'MISSING'}... KEY=${supabaseKey ? supabaseKey.substring(0, 10) : 'MISSING'}...`);

if (supabaseUrl && supabaseKey) {
    try {
        supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });
        
        // Use service role key if available for admin client
        const serviceKey = (isKeyValid(process.env.SUPABASE_SERVICE_ROLE_KEY) ? process.env.SUPABASE_SERVICE_ROLE_KEY : null)
            || (isKeyValid(process.env.SUPABASE_SERVICE_KEY) ? process.env.SUPABASE_SERVICE_KEY : null)
            || supabaseKey; // Fallback to anon if no service role (limited admin)
            
        supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
        });
    } catch (e) {
        console.error("❌ CRITICAL: Failed to initialize Supabase client:", e.message);
    }
}

if (!supabase) {
    if (process.env.NODE_ENV === 'production') {
        console.error("⛔ FATAL: Supabase configuration missing in production. Exiting.");
        process.exit(1);
    }
    console.error("⛔ FATAL: Supabase client could not be initialized. Missing URL or Key.");
}

module.exports = {
    supabase,
    supabaseAdmin,
    isSupabaseEnabled: Boolean(supabase)
};

// Startup log
const keySource = !isDummyKey(process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'SERVICE_ROLE_KEY'
    : !isDummyKey(process.env.SUPABASE_ANON_KEY) ? 'ANON_KEY'
    : 'OTHER';

console.log(`🔗 Supabase Status: ${supabase ? '✅ Connected' : '❌ Disabled'} (source: ${keySource}, url: ${supabaseUrl ? 'OK' : 'MISSING'})`);

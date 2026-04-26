const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL_PROD = 'https://euknjjnjcgdlksrcbkde.supabase.co';
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || SUPABASE_URL_PROD;
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

// Hardcoded fallbacks (safe — these are public Supabase credentials matching the frontend)
const SUPABASE_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a25qam5qY2dkbGtzcmNia2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzUxMzUsImV4cCI6MjA4OTk1MTEzNX0.a9xC0xO-01D8resooEmOOpe8ancv_hQaJN39WFHUqFE';

const isKeyValid = (key) => {
    if (!key) return false;
    const normalized = String(key).trim();
    return normalized.startsWith('eyJ') && !normalized.includes('placeholder') && !normalized.includes('dummy');
};

const supabaseKey = (isKeyValid(process.env.SUPABASE_SERVICE_ROLE_KEY) ? process.env.SUPABASE_SERVICE_ROLE_KEY : null)
    || (isKeyValid(process.env.SUPABASE_ANON_KEY) ? process.env.SUPABASE_ANON_KEY : null)
    || (isKeyValid(process.env.SUPABASE_KEY) ? process.env.SUPABASE_KEY : null)
    || (isKeyValid(process.env.VITE_SUPABASE_ANON_KEY) ? process.env.VITE_SUPABASE_ANON_KEY : null)
    || SUPABASE_KEY_FALLBACK;

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
        : supabaseKey === SUPABASE_KEY_FALLBACK ? 'HARDCODED_FALLBACK'
            : 'OTHER';

console.log(`🔗 Supabase Status: ${supabase ? '✅ Connected' : '❌ Disabled'} (source: ${keySource}, url: ${supabaseUrl ? 'OK' : 'MISSING'})`);

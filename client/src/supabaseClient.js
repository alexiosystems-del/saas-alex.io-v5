import { createClient } from '@supabase/supabase-js'

// Fallback config object (empty) to avoid errors if file missing
const config = { supabaseUrl: null, supabaseKey: "TU_CLAVE_AQUI" };

// 1. Intentar usar variables de entorno (PRIORIDAD)
// 2. Si no, intentar usar config hardcoded (DESARROLLO LOCAL)
const cleanStr = (s) => (s || "").trim();

// Hardcoded fallbacks (safe to expose — these are public Supabase credentials)
const SUPABASE_URL_FALLBACK = 'https://euknjjnjcgdlksrcbkde.supabase.co';
const SUPABASE_KEY_FALLBACK = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a25qam5qY2dkbGtzcmNia2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzUxMzUsImV4cCI6MjA4OTk1MTEzNX0.a9xC0xO-01D8resooEmOOpe8ancv_hQaJN39WFHUqFE';

const envUrl = cleanStr(import.meta.env.VITE_SUPABASE_URL);
const envKey = cleanStr(import.meta.env.VITE_SUPABASE_ANON_KEY);

// Validation: Supabase Anon Keys must be JWTs (starting with eyJ)
// If the key in the environment is invalid (e.g. accidentally a Stripe key), we use fallback.
const isKeyValid = (key) => key && key.startsWith('eyJ');

const supabaseUrl = envUrl || SUPABASE_URL_FALLBACK;
const supabaseKey = isKeyValid(envKey) ? envKey : SUPABASE_KEY_FALLBACK;

if (envKey && !isKeyValid(envKey)) {
    console.warn('⚠️ La clave VITE_SUPABASE_ANON_KEY en el ambiente no parece un JWT de Supabase. Usando fallback seguro.');
}

let supabase = null;

try {
    if (supabaseUrl && supabaseKey) {
        supabase = createClient(supabaseUrl, supabaseKey);
    }
} catch (e) {
    console.error("❌ Error fatal inicializando Supabase:", e.message);
}

export { supabase };


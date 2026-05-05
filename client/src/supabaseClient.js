import { createClient } from '@supabase/supabase-js'

const cleanStr = (s) => (s || '').trim();
const envUrl = cleanStr(import.meta.env.VITE_SUPABASE_URL);
const envKey = cleanStr(import.meta.env.VITE_SUPABASE_ANON_KEY);

const isValidSupabaseUrl = (url) => /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);
const isValidJwt = (key) => key.startsWith('eyJ');

let supabase = null;

if (!envUrl || !envKey) {
  console.warn('⚠️ Supabase no configurado en frontend (faltan VITE_SUPABASE_URL/VITE_SUPABASE_ANON_KEY).');
} else if (!isValidSupabaseUrl(envUrl)) {
  console.error('❌ VITE_SUPABASE_URL inválida. Debe ser https://<project-ref>.supabase.co');
} else if (!isValidJwt(envKey)) {
  console.error('❌ VITE_SUPABASE_ANON_KEY inválida. Debe ser JWT de Supabase (prefijo eyJ...).');
} else {
  try {
    supabase = createClient(envUrl, envKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  } catch (e) {
    console.error('❌ Error fatal inicializando Supabase:', e.message);
  }
}

export { supabase }

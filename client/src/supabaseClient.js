import { createClient } from '@supabase/supabase-js'

const cleanStr = (s) => (s || '').trim();
const envUrl = cleanStr(import.meta.env.VITE_SUPABASE_URL);
const envKey = cleanStr(import.meta.env.VITE_SUPABASE_ANON_KEY);

const isValidSupabaseUrl = (url) => /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url);
const isValidJwt = (key) => key.startsWith('eyJ');

let supabase = null;

const FALLBACK_URL = 'https://euknjjnjcgdlksrcbkde.supabase.co';
const FALLBACK_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV1a25qam5qY2dkbGtzcmNia2RlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzNzUxMzUsImV4cCI6MjA4OTk1MTEzNX0.a9xC0xO-01D8resooEmOOpe8ancv_hQaJN39WFHUqFE';

const finalUrl = envUrl || FALLBACK_URL;
const finalKey = envKey || FALLBACK_KEY;

if (!isValidSupabaseUrl(finalUrl)) {
  console.error('❌ VITE_SUPABASE_URL inválida. Debe ser https://<project-ref>.supabase.co');
} else if (!isValidJwt(finalKey)) {
  console.error('❌ VITE_SUPABASE_ANON_KEY inválida. Debe ser JWT de Supabase (prefijo eyJ...).');
} else {
  try {
    supabase = createClient(finalUrl, finalKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    });
  } catch (e) {
    console.error('❌ Error fatal inicializando Supabase:', e.message);
  }
}

export { supabase }

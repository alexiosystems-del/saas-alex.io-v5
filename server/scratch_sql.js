const { supabase } = require('./services/supabaseClient');

async function setupTranslationCache() {
  console.log('🚀 Setting up translation_cache table...');
  const { error } = await supabase.rpc('exec_sql', { 
    sql_query: `
      CREATE TABLE IF NOT EXISTS translation_cache (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        hash TEXT UNIQUE NOT NULL,
        translated TEXT NOT NULL,
        detected_lang TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_translation_cache_hash 
        ON translation_cache(hash);
    `
  });

  if (error) {
    console.error('❌ Error setting up table:', error.message);
    console.log('Trying alternative: pure SQL might not be allowed via RPC. Please ensure the table exists in Supabase dashboard.');
  } else {
    console.log('✅ Table translation_cache created or already exists.');
  }
}

setupTranslationCache();

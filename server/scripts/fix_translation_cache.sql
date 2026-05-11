-- ═══ Translation Cache (Performance & Cost) ═══
CREATE TABLE IF NOT EXISTS translation_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    text_hash TEXT NOT NULL,
    source_lang TEXT NOT NULL,
    target_lang TEXT NOT NULL,
    translated_text TEXT NOT NULL,
    model TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(text_hash, source_lang, target_lang)
);

CREATE INDEX IF NOT EXISTS idx_trans_cache_hash ON translation_cache(text_hash);

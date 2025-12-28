-- ============================================================
-- DATABASE SCHEMA NORMALIZATION MIGRATION (v2)
-- From host-scoped to origin+lang scoped translations
-- ============================================================
--
-- This migration normalizes the translation storage:
-- - Source text/paths stored ONCE per origin (not duplicated per language)
-- - Translations scoped to origin + lang (not host)
-- - Multiple hosts can share translations for same origin+lang
--
-- Run with: psql $POSTGRES_DB_URL -f migration-v2.sql
-- ============================================================

BEGIN;

-- ------------------------------------------------------------
-- STEP 1: Create new tables
-- ------------------------------------------------------------

-- Source segments stored once per origin (deduplicated)
CREATE TABLE IF NOT EXISTS origin_segment (
    id SERIAL PRIMARY KEY,
    origin_id INTEGER NOT NULL REFERENCES origin(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    text_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(origin_id, text_hash)
);

-- Source paths stored once per origin
CREATE TABLE IF NOT EXISTS origin_path (
    id SERIAL PRIMARY KEY,
    origin_id INTEGER NOT NULL REFERENCES origin(id) ON DELETE CASCADE,
    path TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(origin_id, path)
);

-- Translations scoped to origin + language (not host)
CREATE TABLE IF NOT EXISTS translated_segment (
    id SERIAL PRIMARY KEY,
    origin_id INTEGER NOT NULL REFERENCES origin(id) ON DELETE CASCADE,
    lang TEXT NOT NULL,
    origin_segment_id INTEGER NOT NULL REFERENCES origin_segment(id) ON DELETE CASCADE,
    translated_text TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(origin_segment_id, lang)
);

-- Path translations scoped to origin + language
CREATE TABLE IF NOT EXISTS translated_path (
    id SERIAL PRIMARY KEY,
    origin_id INTEGER NOT NULL REFERENCES origin(id) ON DELETE CASCADE,
    lang TEXT NOT NULL,
    origin_path_id INTEGER NOT NULL REFERENCES origin_path(id) ON DELETE CASCADE,
    translated_path TEXT NOT NULL,
    hit_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(origin_path_id, lang)
);

-- ------------------------------------------------------------
-- STEP 2: Create indexes for efficient lookups
-- ------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_origin_segment_lookup
    ON origin_segment(origin_id, text_hash);

CREATE INDEX IF NOT EXISTS idx_origin_path_lookup
    ON origin_path(origin_id, path);

CREATE INDEX IF NOT EXISTS idx_translated_segment_lookup
    ON translated_segment(origin_segment_id, lang);

CREATE INDEX IF NOT EXISTS idx_translated_segment_origin_lang
    ON translated_segment(origin_id, lang);

CREATE INDEX IF NOT EXISTS idx_translated_path_lookup
    ON translated_path(origin_path_id, lang);

CREATE INDEX IF NOT EXISTS idx_translated_path_reverse
    ON translated_path(origin_id, lang, translated_path);

-- ------------------------------------------------------------
-- STEP 3: Add updated_at trigger for translated_segment
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS translated_segment_updated_at ON translated_segment;
CREATE TRIGGER translated_segment_updated_at
    BEFORE UPDATE ON translated_segment
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ------------------------------------------------------------
-- STEP 4: Migrate data from old tables
-- ------------------------------------------------------------

-- 4a. Migrate unique source segments per origin
-- Uses DISTINCT ON to get one row per (origin_id, text_hash) combination
INSERT INTO origin_segment (origin_id, text, text_hash, created_at)
SELECT DISTINCT ON (h.origin_id, t.text_hash)
    h.origin_id,
    t.original_text,
    t.text_hash,
    t.created_at
FROM translation t
JOIN host h ON h.id = t.host_id
ORDER BY h.origin_id, t.text_hash, t.created_at ASC
ON CONFLICT (origin_id, text_hash) DO NOTHING;

-- 4b. Migrate unique source paths per origin
INSERT INTO origin_path (origin_id, path, created_at)
SELECT DISTINCT ON (h.origin_id, p.path)
    h.origin_id,
    p.path,
    p.created_at
FROM pathname p
JOIN host h ON h.id = p.host_id
ORDER BY h.origin_id, p.path, p.created_at ASC
ON CONFLICT (origin_id, path) DO NOTHING;

-- 4c. Migrate translations (link to origin_segment via text_hash)
INSERT INTO translated_segment (origin_id, lang, origin_segment_id, translated_text, created_at, updated_at)
SELECT DISTINCT ON (os.id, h.target_lang)
    h.origin_id,
    h.target_lang,
    os.id,
    t.translated_text,
    t.created_at,
    t.updated_at
FROM translation t
JOIN host h ON h.id = t.host_id
JOIN origin_segment os ON os.origin_id = h.origin_id AND os.text_hash = t.text_hash
ORDER BY os.id, h.target_lang, t.updated_at DESC
ON CONFLICT (origin_segment_id, lang) DO NOTHING;

-- 4d. Migrate path translations (link to origin_path)
INSERT INTO translated_path (origin_id, lang, origin_path_id, translated_path, hit_count, created_at)
SELECT DISTINCT ON (op.id, h.target_lang)
    h.origin_id,
    h.target_lang,
    op.id,
    p.translated_path,
    p.hit_count,
    p.created_at
FROM pathname p
JOIN host h ON h.id = p.host_id
JOIN origin_path op ON op.origin_id = h.origin_id AND op.path = p.path
ORDER BY op.id, h.target_lang, p.hit_count DESC
ON CONFLICT (origin_path_id, lang) DO NOTHING;

-- ------------------------------------------------------------
-- STEP 5: Update pathname_translation junction table
-- ------------------------------------------------------------

-- Rename old junction table
ALTER TABLE IF EXISTS pathname_translation RENAME TO pathname_translation_old;

-- Create new junction table with updated references
CREATE TABLE IF NOT EXISTS pathname_translation (
    id SERIAL PRIMARY KEY,
    translated_path_id INTEGER REFERENCES translated_path(id) ON DELETE CASCADE,
    translated_segment_id INTEGER REFERENCES translated_segment(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(translated_path_id, translated_segment_id)
);

CREATE INDEX IF NOT EXISTS idx_pathname_translation_path
    ON pathname_translation(translated_path_id);

CREATE INDEX IF NOT EXISTS idx_pathname_translation_segment
    ON pathname_translation(translated_segment_id);

-- Migrate junction table data
INSERT INTO pathname_translation (translated_path_id, translated_segment_id, created_at)
SELECT DISTINCT
    tp.id,
    ts.id,
    pto.created_at
FROM pathname_translation_old pto
JOIN pathname p ON p.id = pto.pathname_id
JOIN translation t ON t.id = pto.translation_id
JOIN host h ON h.id = p.host_id
JOIN origin_path op ON op.origin_id = h.origin_id AND op.path = p.path
JOIN translated_path tp ON tp.origin_path_id = op.id AND tp.lang = h.target_lang
JOIN origin_segment os ON os.origin_id = h.origin_id AND os.text_hash = t.text_hash
JOIN translated_segment ts ON ts.origin_segment_id = os.id AND ts.lang = h.target_lang
WHERE tp.id IS NOT NULL AND ts.id IS NOT NULL
ON CONFLICT (translated_path_id, translated_segment_id) DO NOTHING;

COMMIT;

-- ------------------------------------------------------------
-- VERIFICATION QUERIES (run manually after migration)
-- ------------------------------------------------------------

-- Compare counts: old vs new
-- SELECT 'old_translations' as source, COUNT(*) FROM translation
-- UNION ALL SELECT 'new_origin_segments', COUNT(*) FROM origin_segment
-- UNION ALL SELECT 'new_translated_segments', COUNT(*) FROM translated_segment;

-- SELECT 'old_pathnames' as source, COUNT(*) FROM pathname
-- UNION ALL SELECT 'new_origin_paths', COUNT(*) FROM origin_path
-- UNION ALL SELECT 'new_translated_paths', COUNT(*) FROM translated_path;

-- Check segment counts per origin
-- SELECT o.domain, COUNT(os.id) as segment_count
-- FROM origin o
-- LEFT JOIN origin_segment os ON os.origin_id = o.id
-- GROUP BY o.domain;

-- Check translation counts per origin+lang
-- SELECT o.domain, ts.lang, COUNT(ts.id) as translation_count
-- FROM origin o
-- LEFT JOIN translated_segment ts ON ts.origin_id = o.id
-- GROUP BY o.domain, ts.lang
-- ORDER BY o.domain, ts.lang;

-- ------------------------------------------------------------
-- CLEANUP (run after verification - DO NOT run automatically)
-- ------------------------------------------------------------

-- DROP TABLE IF EXISTS pathname_translation_old;
-- DROP TABLE IF EXISTS translation;
-- DROP TABLE IF EXISTS pathname;

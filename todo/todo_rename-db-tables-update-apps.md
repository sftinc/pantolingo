# Rename Translation Tables

## Summary

Rename translation-related tables to use a consistent `translation_` prefix and align naming patterns with the `website_*` source tables.

## Why

| Current Issue | Proposed Fix |
|---------------|--------------|
| `host` doesn't indicate it's translation-related | Rename to `translation` |
| `translated_path` uses past tense (`translated_`) | Rename to `translation_path` |
| `translated_segment` uses past tense (`translated_`) | Rename to `translation_segment` |
| `host.target_lang` verbose naming | Rename to `lang` (matches `translation_path.lang`) |
| `website.source_lang` verbose naming | Rename to `lang` (symmetric with `translation.lang`) |
| `website.domain` inconsistent with `translation.hostname` | Rename to `hostname` (consistent across tables) |
| Need apex domain for DNS TXT verification | Add `website.apex` column |
| `translated_path.translated_path` redundant column name | Rename to `path` (matches `website_path.path`) |
| `translated_segment.translated_text` redundant column name | Rename to `text` (matches `website_segment.text`) |

## Schema After Migration

### Table Naming Pattern

| Source (origin) | Translation | Relationship |
|-----------------|-------------|--------------|
| `website` | `translation` | `translation.website_id` → `website.id` |
| `website_path` | `translation_path` | `translation_path.website_path_id` → `website_path.id` |
| `website_segment` | `translation_segment` | `translation_segment.website_segment_id` → `website_segment.id` |

### Supporting Tables (unchanged)

| Table | Purpose |
|-------|---------|
| `website_path_segment` | Junction: which segments appear on which paths |
| `website_path_view` | Analytics: page view counts per path/lang/date |

### Column Renames

| Table | Old Column | New Column |
|-------|------------|------------|
| `website` | `source_lang` | `lang` |
| `website` | `domain` | `hostname` |
| `translation` | `target_lang` | `lang` |
| `translation_path` | `translated_path` | `path` |
| `translation_segment` | `translated_text` | `text` |

### New Columns

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `website` | `apex` | `text` | Root domain for DNS TXT verification |

## Migration SQL

```sql
-- Migration: Rename translation tables for consistent naming
-- Run in a transaction to ensure atomicity

BEGIN;

-- ============================================================================
-- 0. UPDATE website TABLE
-- ============================================================================

-- 0.1 Rename column: source_lang → lang
ALTER TABLE website RENAME COLUMN source_lang TO lang;

-- 0.2 Rename column: domain → hostname
ALTER TABLE website RENAME COLUMN domain TO hostname;

-- 0.3 Add new column: apex (for DNS TXT verification)
ALTER TABLE website ADD COLUMN apex text;

COMMENT ON COLUMN website.lang IS 'Source language code of the website (e.g., en, es, fr)';
COMMENT ON COLUMN website.hostname IS 'Full hostname of the origin website (e.g., blog.example.com)';
COMMENT ON COLUMN website.apex IS 'Apex/root domain for DNS TXT verification (e.g., example.com)';


-- ============================================================================
-- 1. RENAME host → translation
-- ============================================================================

-- 1.1 Rename the table
ALTER TABLE host RENAME TO translation;

-- 1.2 Rename column: target_lang → lang
ALTER TABLE translation RENAME COLUMN target_lang TO lang;

-- 1.3 Rename sequence
ALTER SEQUENCE host_id_seq RENAME TO translation_id_seq;

-- 1.4 Rename primary key constraint
ALTER INDEX host_pkey RENAME TO translation_pkey;

-- 1.5 Rename unique constraint on hostname
ALTER INDEX host_hostname_key RENAME TO translation_hostname_key;

-- 1.6 Rename index on website_id
ALTER INDEX idx_host_website_id RENAME TO idx_translation_website_id;

-- 1.7 Rename foreign key constraint
ALTER TABLE translation
    RENAME CONSTRAINT host_website_id_fkey TO translation_website_id_fkey;

-- 1.8 Rename trigger
ALTER TRIGGER host_updated_at ON translation RENAME TO translation_updated_at;


-- ============================================================================
-- 2. RENAME translated_path → translation_path
-- ============================================================================

-- 2.1 Rename the table
ALTER TABLE translated_path RENAME TO translation_path;

-- 2.2 Rename column: translated_path → path
ALTER TABLE translation_path RENAME COLUMN translated_path TO path;

-- 2.3 Rename sequence
ALTER SEQUENCE translated_path_id_seq RENAME TO translation_path_id_seq;

-- 2.4 Rename primary key constraint
ALTER INDEX translated_path_pkey RENAME TO translation_path_pkey;

-- 2.5 Rename unique constraint on (website_path_id, lang)
ALTER INDEX translated_path_website_path_id_lang_key
    RENAME TO translation_path_website_path_id_lang_key;

-- 2.6 Rename index for reverse lookups
ALTER INDEX idx_translated_path_reverse RENAME TO idx_translation_path_path;

-- 2.7 Rename foreign key constraint
ALTER TABLE translation_path
    RENAME CONSTRAINT translated_path_website_path_id_fkey
    TO translation_path_website_path_id_fkey;

-- 2.8 Rename trigger
ALTER TRIGGER translated_path_word_count ON translation_path
    RENAME TO translation_path_word_count;


-- ============================================================================
-- 3. RENAME translated_segment → translation_segment
-- ============================================================================

-- 3.1 Rename the table
ALTER TABLE translated_segment RENAME TO translation_segment;

-- 3.2 Rename column: translated_text → text
ALTER TABLE translation_segment RENAME COLUMN translated_text TO text;

-- 3.3 Rename sequence
ALTER SEQUENCE translated_segment_id_seq RENAME TO translation_segment_id_seq;

-- 3.4 Rename primary key constraint
ALTER INDEX translated_segment_pkey RENAME TO translation_segment_pkey;

-- 3.5 Rename unique constraint on (website_segment_id, lang)
ALTER INDEX translated_segment_website_segment_id_lang_key
    RENAME TO translation_segment_website_segment_id_lang_key;

-- 3.6 Rename foreign key constraint
ALTER TABLE translation_segment
    RENAME CONSTRAINT translated_segment_website_segment_id_fkey
    TO translation_segment_website_segment_id_fkey;

-- 3.7 Rename trigger
ALTER TRIGGER translated_segment_word_count ON translation_segment
    RENAME TO translation_segment_word_count;


-- ============================================================================
-- 4. UPDATE TRIGGER FUNCTIONS (reference new column names)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_translated_path_word_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.word_count := calculate_word_count(NEW.path);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_translated_segment_word_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.word_count := calculate_word_count(NEW.text);
  RETURN NEW;
END;
$function$;


-- ============================================================================
-- 5. ADD COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE translation IS
    'Maps hostnames to target languages and website configurations for the translation proxy';

COMMENT ON TABLE translation_path IS
    'Stores translated URL paths per language, linked to source paths in website_path';

COMMENT ON TABLE translation_segment IS
    'Stores translated text segments per language, linked to source segments in website_segment';

COMMENT ON COLUMN translation.lang IS 'Target language code for this translation (e.g., es, fr, de)';
COMMENT ON COLUMN translation_path.path IS 'The translated URL path';
COMMENT ON COLUMN translation_segment.text IS 'The translated text content';


COMMIT;
```

## Rollback SQL

```sql
-- Rollback: Undo translation table renames
-- Run in a transaction to ensure atomicity

BEGIN;

-- Restore trigger functions to reference old column names
CREATE OR REPLACE FUNCTION public.set_translated_path_word_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.word_count := calculate_word_count(NEW.translated_path);
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_translated_segment_word_count()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.word_count := calculate_word_count(NEW.translated_text);
  RETURN NEW;
END;
$function$;

-- Rollback translation_segment → translated_segment
ALTER TRIGGER translation_segment_word_count ON translation_segment RENAME TO translated_segment_word_count;
ALTER TABLE translation_segment RENAME CONSTRAINT translation_segment_website_segment_id_fkey TO translated_segment_website_segment_id_fkey;
ALTER INDEX translation_segment_website_segment_id_lang_key RENAME TO translated_segment_website_segment_id_lang_key;
ALTER INDEX translation_segment_pkey RENAME TO translated_segment_pkey;
ALTER SEQUENCE translation_segment_id_seq RENAME TO translated_segment_id_seq;
ALTER TABLE translation_segment RENAME COLUMN text TO translated_text;
ALTER TABLE translation_segment RENAME TO translated_segment;

-- Rollback translation_path → translated_path
ALTER TRIGGER translation_path_word_count ON translation_path RENAME TO translated_path_word_count;
ALTER TABLE translation_path RENAME CONSTRAINT translation_path_website_path_id_fkey TO translated_path_website_path_id_fkey;
ALTER INDEX idx_translation_path_path RENAME TO idx_translated_path_reverse;
ALTER INDEX translation_path_website_path_id_lang_key RENAME TO translated_path_website_path_id_lang_key;
ALTER INDEX translation_path_pkey RENAME TO translated_path_pkey;
ALTER SEQUENCE translation_path_id_seq RENAME TO translated_path_id_seq;
ALTER TABLE translation_path RENAME COLUMN path TO translated_path;
ALTER TABLE translation_path RENAME TO translated_path;

-- Rollback translation → host
ALTER TRIGGER translation_updated_at ON translation RENAME TO host_updated_at;
ALTER TABLE translation RENAME CONSTRAINT translation_website_id_fkey TO host_website_id_fkey;
ALTER INDEX idx_translation_website_id RENAME TO idx_host_website_id;
ALTER INDEX translation_hostname_key RENAME TO host_hostname_key;
ALTER INDEX translation_pkey RENAME TO host_pkey;
ALTER SEQUENCE translation_id_seq RENAME TO host_id_seq;
ALTER TABLE translation RENAME COLUMN lang TO target_lang;
ALTER TABLE translation RENAME TO host;

-- Rollback website changes
ALTER TABLE website DROP COLUMN apex;
ALTER TABLE website RENAME COLUMN hostname TO domain;
ALTER TABLE website RENAME COLUMN lang TO source_lang;

-- Remove comments
COMMENT ON TABLE host IS NULL;
COMMENT ON TABLE translated_path IS NULL;
COMMENT ON TABLE translated_segment IS NULL;
COMMENT ON COLUMN website.domain IS NULL;
COMMENT ON COLUMN website.source_lang IS NULL;

COMMIT;
```

## Phase 1: Database Migration

**Goal:** Rename tables, columns, indexes, constraints, triggers, and update trigger functions.

- [ ] Backup database before migration
- [ ] Run migration SQL in a transaction
- [ ] Verify new table/column names exist
- [ ] Verify triggers still work (insert/update a row)

## Phase 2: Application Code Updates

**Goal:** Update all code references to use new table/column names.

- [ ] Update `packages/db` - table definitions and queries
- [ ] Update `apps/translate` - any direct SQL or ORM references
- [ ] Update `apps/www` - any direct SQL or ORM references
- [ ] Run TypeScript build to catch compile errors
- [ ] Test application functionality

## Open Questions

1. Should the trigger functions also be renamed?
   - `set_translated_path_word_count` → `set_translation_path_word_count`
   - `set_translated_segment_word_count` → `set_translation_segment_word_count`

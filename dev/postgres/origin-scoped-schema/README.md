# Origin-Scoped Translation Schema

Database schema and migrations for the translation storage layer.

## Files

| File | Purpose |
|------|---------|
| [pantolingo.sql](../pantolingo.sql) | Full database dump (legacy schema before migration) |
| [migration-v2.sql](migration-v2.sql) | Migration: host-scoped → origin+lang scoped translations |
| [migration-junction.sql](migration-junction.sql) | Migration: language-specific → language-independent path-segment linking |
| [cleanup-refactor.sql](cleanup-refactor.sql) | Cleanup: preview orphan segments, rename/drop old tables |
| [junction-table-refactor.md](junction-table-refactor.md) | Design doc explaining the junction table refactor |

## Recent Commits

| Commit | Description |
|--------|-------------|
| `67969ec` | Initial PostgreSQL migration from in-memory cache |
| `2f9a4da` | Fix pathname translation cache lookup bug |
| `5ec57e0` | Add database schema file |
| `ef27acb` | **migration-v2.sql** - Normalize schema: origin-scoped translations |
| `79aa9e7` | **migration-junction.sql** - Refactor junction to origin-level linking |
| `dd0fe4f` | **cleanup-refactor.sql** - Add cleanup for orphan segments and old tables |

## Schema Evolution

### Before (host-scoped)

```
translation (host_id, original_text, translated_text)
pathname (host_id, path, translated_path)
pathname_translation (pathname_id → translation_id)
```

**Problems:**
- Same source text duplicated across hosts with same origin
- Junction table duplicated per language (50 segments × 5 languages = 250 rows)

### After (origin+lang scoped)

```
origin_segment (origin_id, text, text_hash)           ← source text stored once
translated_segment (origin_id, lang, translated_text) ← per-language translations

origin_path (origin_id, path)                         ← source path stored once
translated_path (origin_id, lang, translated_path)    ← per-language translations

origin_path_segment (origin_path_id, origin_segment_id) ← language-independent links
```

### Benefits

1. **Deduplication**: Source content stored once per origin (not per host/language)
2. **Shared translations**: Multiple hosts with same origin+lang share translations
3. **Efficient junction**: 50 rows instead of 50 × N languages
4. **Language-agnostic queries**: "What content is on this page?" without specifying language

## Entity Relationships

```
user
  └── origin (domain, origin_lang)
        ├── host (hostname, target_lang, config...)
        │
        ├── origin_segment (text, text_hash)
        │     └── translated_segment (lang, translated_text)
        │
        ├── origin_path (path)
        │     └── translated_path (lang, translated_path)
        │
        └── origin_path_segment (links paths ↔ segments)
```

## Running Migrations

```bash
# Run migration v2 (schema normalization)
psql $POSTGRES_DB_URL -f dev/postgres/origin-scoped-schema/migration-v2.sql

# Run junction table refactor
psql $POSTGRES_DB_URL -f dev/postgres/origin-scoped-schema/migration-junction.sql

# Preview cleanup (shows counts, doesn't delete)
psql $POSTGRES_DB_URL -f dev/postgres/origin-scoped-schema/cleanup-refactor.sql

# Drop old tables (run manually after verification)
# Uncomment DROP statements in cleanup-refactor.sql
```

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## IMPORTANT: Commit Messages

**Do NOT include "Generated with Claude Code" or similar attribution in commit messages.** Keep commit messages clean and focused on the changes only.

## Project Overview

This is a **Node.js/Express translation proxy** that translates websites on-the-fly. It proxies requests to an origin server, translates the HTML content, and serves it with translated URLs and link rewriting. Translations are persisted in PostgreSQL.

**Core Use Case**: Host translated versions of a website on different domains (e.g., `es.esnipe.com` for Spanish, `fr.esnipe.com` for French) without maintaining separate codebases.

## Development Commands

```bash
# Local development (runs with tsx watch for hot reloading)
npm run dev

# Build for production (installs deps + TypeScript compilation)
npm run build

# Start production server
npm run start
```

## Architecture

### Request Pipeline

The server processes each request through this pipeline (see [index.ts](src/index.ts)):

**Cache → Fetch → Parse → Extract → Translate → Apply → Rewrite → Return**

**Key Flow**:

-   Requests hit Express → Host determines target language from database (`host` table)
-   Static assets (`.js`, `.css`, `.png`, etc.) are proxied directly with optional caching
-   HTML content flows through the full translation pipeline
-   PostgreSQL stores: host configuration, translations, and pathname mappings

### Core Modules

**[src/server.ts](src/server.ts)** - Express server entry point

-   Creates Express app and tests database connection on startup
-   Routes all requests through `handleRequest()`
-   Graceful shutdown closes database pool

**[src/index.ts](src/index.ts)** - Main request handler

-   Orchestrates the entire request pipeline
-   Handles redirects (rewrites `Location` headers to translated domains)
-   Manages parallel translation of segments + pathnames
-   Performance logging with timing breakdowns

**[src/config.ts](src/config.ts)** - Constants and fallback configuration

-   `HOST_SETTINGS`: Fallback config (primary config comes from database)
-   `SKIP_SELECTORS` / `SKIP_TAGS`: DOM elements to skip during extraction
-   `TRANSLATE_ATTRS`: Attributes to translate (`title`, `placeholder`, `aria-label`, `alt`)

**[src/db/](src/db/)** - PostgreSQL database layer

-   `pool.ts`: Connection pool with SSL support for Render
-   `host.ts`: Host configuration queries (replaces `HOST_SETTINGS` lookup)
-   `segments.ts`: Batch get/upsert translations with hash-based lookups
-   `paths.ts`: Bidirectional URL mapping storage
-   `junctions.ts`: Junction table linking translations to pathnames

**[src/utils/](src/utils/)** - Utility functions

-   `hash.ts`: Text hashing for efficient lookups

**[src/fetch/](src/fetch/)** - DOM manipulation pipeline

-   `dom-parser.ts`: HTML parsing with linkedom
-   `dom-extractor.ts`: Extracts translatable segments (text nodes, attributes, link pathnames)
-   `dom-applicator.ts`: Applies translations back to DOM elements
-   `dom-rewriter.ts`: Rewrites internal links to translated domains/paths
-   `dom-metadata.ts`: Adds SEO metadata (`<html lang>`, `<link hreflang>`)

**[src/translation/](src/translation/)** - Translation engine

-   `translate.ts`: OpenRouter API integration (model: `anthropic/claude-haiku-4.5`)
-   `prompts.ts`: Translation prompts for segments and pathnames
-   `translate-segments.ts`: Deduplication + batch optimization
-   `translate-pathnames.ts`: URL-safe pathname translation with normalization
-   `skip-patterns.ts`: Pattern replacement for PII/numbers (e.g., `"123.00"` → `"[N1]"`)
-   `skip-words.ts`: Protects brand names from translation

### Database Schema

Schema file: [dev/postgres/pg-schema.sql](dev/postgres/pg-schema.sql)

**Tables** (origin-scoped model):

-   `origin`: Origin websites (domain, source language)
-   `host`: Translated domains (hostname, target language, config options)
-   `origin_segment`: Source text segments scoped to origin (text, text_hash)
-   `translated_segment`: Translations scoped to origin + language
-   `origin_path`: Source URL paths scoped to origin
-   `translated_path`: Translated URL paths scoped to origin + language
-   `origin_path_segment`: Junction linking paths to segments (for cache invalidation)

**Key relationships**:

-   `host` → `origin`: Many translated hosts per origin
-   `origin_segment` → `origin`: Text segments shared across all languages for an origin
-   `translated_segment` → `origin_segment`: One translation per language per segment
-   `origin_path` → `origin`: URL paths shared across all languages
-   `translated_path` → `origin_path`: One translated path per language

### Translation Optimization

**Deduplication flow** ([src/translation/deduplicator.ts](src/translation/deduplicator.ts)):

1. Extract N segments from page
2. Deduplicate → unique strings
3. Batch lookup from database → split into cached vs new
4. Translate only new unique strings (parallel API calls)
5. Expand back to original positions

**Pattern System** ([src/translation/skip-patterns.ts](src/translation/skip-patterns.ts)):

-   `numeric`: Numbers (e.g., `123.00` → `[N1]`)
-   `pii`: Email addresses (e.g., `user@example.com` → `[P1]`)
-   Patterns applied before translation, restored after

### Environment Variables

Required:

-   `POSTGRES_DB_URL`: PostgreSQL connection string
-   `OPENROUTER_API_KEY`: OpenRouter API key for translation

Optional:

-   `PORT`: Server port (defaults to 8787)

### Key Implementation Details

**Host configuration** comes from database via `getHostConfig()`:

-   In-memory cache with 60-second TTL to avoid repeated queries
-   Falls back to null if host not found (returns 404)

**Pathname translation** is optional per-host (`translate_path` column):

-   When enabled: Translates `/pricing` → `/precios` (URL-safe, ASCII-only output)
-   Always supports reverse lookup to handle bookmarked translated URLs
-   Skip paths via regex or prefix patterns stored in `skip_path` array

**Link rewriting** ([src/fetch/dom-rewriter.ts](src/fetch/dom-rewriter.ts)):

-   Rewrites `<a href>` to point to translated domain
-   Uses pathname cache for translated URLs
-   Preserves query strings and fragments

## Deployment (Render.com)

1. Push code to Git repository
2. Create PostgreSQL database on Render
3. Create Web Service with environment variables:
    - `POSTGRES_DB_URL`: Internal database URL from Render
    - `OPENROUTER_API_KEY`: Your API key
4. Build command: `npm run build`
5. Start command: `npm run start`
6. Run [dev/postgres/pg-schema.sql](dev/postgres/pg-schema.sql) to create tables

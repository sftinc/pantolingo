# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Cloudflare Worker-based translation proxy** that translates websites on-the-fly. It proxies requests to an origin server, translates the HTML content, and serves it with translated URLs and link rewriting. The system is optimized for performance with aggressive caching and parallel translation.

**Core Use Case**: Host translated versions of a website on different domains (e.g., `sp.find-your-item.com` for Spanish, `fr.find-your-item.com` for French) without maintaining separate codebases.

## Development Commands

```bash
# Local development (builds and runs dev server)
npm run dev

# Clear .wrangler cache and restart dev server (use when KV/cache issues occur)
npm run dev:clear

# Build the worker (runs wrangler build)
npm run build

# Deploy to production
npm run deploy

# KV development utility (interactive KV namespace viewer/editor)
npm run kv
```

## Architecture

### Request Pipeline (8 Stages)

The worker processes each request through this pipeline (see [index.ts](src/index.ts:4)):

1. **Cache → Fetch → Parse → Extract → Translate → Apply → Rewrite → Return**

**Key Flow**:
- Requests hit the worker → Host determines target language from `HOST_SETTINGS` in [config.ts](src/config.ts)
- Static assets (`.js`, `.css`, `.png`, etc.) are proxied directly with optional edge caching
- HTML content flows through the full translation pipeline
- Two-tier caching system: **Segment cache** (reusable translations) + **Pathname cache** (bidirectional URL mapping)

### Core Modules

**[src/index.ts](src/index.ts)** - Main worker entry point
- Orchestrates the entire request pipeline
- Handles redirects (rewrites `Location` headers to translated domains)
- Manages parallel translation of segments + pathnames
- Detailed performance logging with timing breakdowns

**[src/config.ts](src/config.ts)** - Configuration
- `HOST_SETTINGS`: Maps domains to origin servers, languages, skip rules, and caching policies
- Pattern types, skip selectors, and translation API limits
- To add a new language domain, add an entry to `HOST_SETTINGS`

**[src/cache.ts](src/cache.ts)** - KV-based caching layer
- **Segment cache**: Domain-wide translation cache (key: `segments::{lang}::{domain}`)
  - Stores normalized text with patterns (e.g., `"Price [N1]"` → `"Precio [N1]"`)
  - Shared across all pages on the domain
- **Pathname cache**: Bidirectional URL mapping (key: `pathnames::{lang}::{domain}`)
  - Forward: `/pricing` → `/preise`
  - Reverse: `/preise` → `/pricing` (enables bookmarked/indexed translated URLs)
- Batch updates to minimize KV writes
- Size guards (warns at 20MB, aborts at 25MB)

**[src/fetch/](src/fetch/)** - DOM manipulation pipeline
- `dom-parser.ts`: HTML parsing with linkedom (lightweight DOM implementation)
- `dom-extractor.ts`: Extracts translatable segments (text nodes, attributes, link pathnames)
- `dom-applicator.ts`: Applies translations back to DOM elements
- `dom-rewriter.ts`: Rewrites internal links to translated domains/paths
- `dom-metadata.ts`: Adds SEO metadata (`<html lang>`, `<link hreflang>`)

**[src/translation/](src/translation/)** - Translation engine
- `translate.ts`: OpenRouter API integration (uses Claude Haiku 4.5)
  - Type-aware prompts: separate prompts for segments vs pathnames
  - Parallel API calls (1 per string)
- `translate-segments.ts`: Deduplication + batch optimization
- `translate-pathnames.ts`: URL-safe pathname translation with normalization
- `skip-patterns.ts`: Pattern replacement system for PII/numbers (e.g., `"123.00"` → `"[N1]"`)
- `skip-words.ts`: Protects brand names from translation (e.g., "eSnipe")
- `deduplicator.ts`: Reduces N → unique strings before translation

### Caching Strategy

**Two-level caching hierarchy**:

1. **Segment-level cache** (KV, 30-day TTL)
   - Stores translations of text segments across the entire domain
   - Keys are **normalized** with patterns applied: `"Price 123.00"` → `"Price [N1]"`
   - Enables cache hits across different pages with similar content
   - Pattern restoration happens at DOM application time

2. **Pathname mapping cache** (KV, 30-day TTL)
   - Bidirectional mapping structure: `{ origin: {...}, translated: {...} }`
   - Supports reverse lookup for bookmarked/indexed translated URLs
   - Normalized pathnames (e.g., `/product/123` → `/product/[N1]`)

**Important**: Static assets bypass ALL cache operations and are proxied immediately with optional edge caching (`proxiedCache` setting in [config.ts](src/config.ts)).

### Translation Optimization

**Deduplication flow** ([src/translation/deduplicator.ts](src/translation/deduplicator.ts)):
1. Extract N segments from page
2. Deduplicate → unique strings
3. Match against KV cache → split into cached vs new
4. Translate only new unique strings
5. Expand back to original positions

**Parallel execution**:
- Segment translation and pathname translation run in parallel (`Promise.all`)
- Each string gets its own API call (parallelized via OpenRouter)
- Link pathname batch includes current page + all extracted link paths

### Pattern System

**Purpose**: Prevent translation of sensitive/numeric data while maintaining cache hit rates.

**Supported patterns** ([src/types.ts](src/types.ts:24)):
- `numeric`: Numbers (e.g., `123.00` → `[N1]`)
- `pii`: Email addresses (e.g., `user@example.com` → `[P1]`)

**Flow**:
1. Apply patterns before caching/translation: `"Price $123.00"` → `"Price $[N1]"`
2. Cache and translate normalized text
3. Restore patterns after translation: `"Precio $[N1]"` → `"Precio $123.00"`

Configure in [config.ts](src/config.ts) via `skipPatterns: ['numeric', 'pii']`.

### Environment Variables

Required bindings in `wrangler.jsonc`:
- `KV`: Cloudflare KV namespace for segment/pathname caching
- `OPENROUTER_API_KEY`: OpenRouter API key (secret)
- `GOOGLE_PROJECT_ID`: Legacy, used for API key parameter (can be any string)

## Key Implementation Details

**Pathname translation** is optional per-domain (`translatePath: true/false` in config):
- When enabled: Translates `/pricing` → `/preise` (URL-safe, ASCII-only output)
- Always supports reverse lookup (even if `translatePath: false`) to handle bookmarked URLs
- Skip paths via regex or prefix (e.g., `/api/`, `/admin`)

**Link rewriting** ([src/fetch/dom-rewriter.ts](src/fetch/dom-rewriter.ts)):
- Rewrites `<a href>` to point to translated domain
- Uses pathname cache for translated URLs
- Handles relative vs absolute URLs
- Preserves query strings and fragments

**Redirect handling**:
- Detects 3xx responses from origin
- Rewrites `Location` header to translated domain
- Forwards `Set-Cookie` headers
- Returns redirect to browser (URL bar updates correctly)

**SEO metadata** ([src/fetch/dom-metadata.ts](src/fetch/dom-metadata.ts)):
- Sets `<html lang="XX">` attribute
- Adds/updates `<link hreflang>` tags for all language variants
- Points `hreflang="x-default"` to origin domain

## Common Development Workflows

**Adding a new language domain**:
1. Add entry to `HOST_SETTINGS` in [src/config.ts](src/config.ts)
2. Add route to `wrangler.jsonc` under `env.production.routes`
3. Deploy with `npm run deploy`

**Debugging cache issues**:
- Use `npm run kv` to inspect KV namespace
- Check cache keys: `segments::{lang}::{domain}` or `pathnames::{lang}::{domain}`
- Clear with `npm run dev:clear` or manually delete KV keys

**Testing translations locally**:
- Default localhost config targets Spanish (`sp`) translation of `www.esnipe.com`
- Access at `http://localhost:8787`
- Check console logs for detailed pipeline timing and cache stats

**Performance monitoring**:
- Console logs show 5-line pipeline summary per request
- Metrics: fetch time, parse time, extract count, cache hits/misses, translation time, apply time, rewrite count
- Cache statistics in response headers: `X-Segment-Cache-Hits`, `X-Segment-Cache-Misses`

# Translation Proxy (`apps/translate`)

Express-based translation proxy that translates websites on-the-fly.

## Architecture

The translation proxy processes each request through this pipeline:

**Cache -> Fetch -> Parse -> Extract -> Translate -> Apply -> Rewrite -> Return**

**Key Flow**:

-   Requests hit Express -> Host determines target language from database (`website_language` table)
-   Static assets (`.js`, `.css`, `.png`, etc.) are proxied directly with optional caching
-   HTML content flows through the full translation pipeline
-   PostgreSQL stores: host configuration, translations, and pathname mappings

## Core Modules

-   `server.ts`: Express server entry point, database connection
-   `index.ts`: Main request handler, orchestrates the pipeline
-   `config.ts`: Constants and fallback configuration
-   `fetch/`: DOM manipulation (parsing, extraction, application, rewriting)
-   `translation/`: Translation engine (OpenRouter API, deduplication, patterns)

## Placeholder System

Placeholders preserve content that shouldn't be translated or needs special handling.

### HTML Paired Placeholders (open/close tags)

| Code | Tags | Example |
| ---- | ---- | ------- |
| `HB` | `<b>`, `<strong>` | `[HB1]bold[/HB1]` |
| `HE` | `<em>`, `<i>` | `[HE1]italic[/HE1]` |
| `HA` | `<a>` | `[HA1]link[/HA1]` |
| `HS` | `<span>` | `[HS1]styled[/HS1]` |
| `HG` | `<u>`, `<sub>`, `<sup>`, `<mark>`, `<small>`, `<s>`, `<del>`, `<ins>`, `<abbr>`, `<q>`, `<cite>`, `<code>`, `<kbd>`, `<time>` | `[HG1]text[/HG1]` |

### HTML Void Placeholders (self-closing, no close tag)

| Code | Tags | Example |
| ---- | ---- | ------- |
| `HV` | `<br>`, `<hr>`, `<img>`, `<wbr>` | `[HV1]` |

**Note**: Empty paired tags (e.g., `<i class="fa-icon"></i>`) are also converted to `HV` placeholders.

### Non-HTML Placeholders (standalone, no close tag)

| Code | Purpose | Example |
| ---- | ------- | ------- |
| `N` | Numbers (integers, decimals, formatted) | `[N1]` for "1,234.56" |
| `E` | Emails (redacted for privacy) | `[E1]` for "user@example.com" |
| `I` | Identifiers - UUIDs | `[I1]` for "550e8400-e29b-..." |
| `U` | URLs (with or without protocol) | `[U1]` for "https://example.com" or "example.com" |
| `S` | Skip words - Brand names, proper nouns | `[S1]` for "eBay" |

**Processing order by context**:
- Segments: U → E → I → N (URLs first to capture embedded emails/UUIDs)
- Paths: E → I → N (no URL extraction for pathnames)

### Key Files

- `config.ts`: `HTML_TAG_MAP`, `VOID_TAGS`, `INLINE_TAGS`
- `fetch/dom-placeholders.ts`: HTML → placeholder conversion
- `translation/skip-patterns.ts`: E (email), I (UUID), U (URL), N (numeric) patterns
- `translation/skip-words.ts`: S (skip word) handling

## Translation Engine

-   Uses OpenRouter API (configured in `translation/translate.ts`)
-   Prompts defined in `translation/prompts.ts` (SEGMENT_PROMPT for text, PATHNAME_PROMPT for URLs)
-   Skip patterns in `translation/skip-patterns.ts` (email, UUID, URL, numeric patterns)

## Cache Control

Proxied responses use origin's `Cache-Control` header with smart defaults. Logic in `utils/cache-control.ts`.

| Content Type | Cache Behavior |
| ------------ | -------------- |
| Static assets (images, CSS, JS, fonts) | 5-min minimum, or pass through origin if higher |
| Data files (`.json`, `.xml`) | Respect origin, or `no-cache` if none |
| Data responses (`application/json`, `application/xml`) | Respect origin, or `no-cache` if none |
| HTML | Respect origin, or `no-cache` if none |

**Directive Preservation**:
- When origin max-age >= 5 min: pass through entire header (preserves `immutable`, `stale-while-revalidate`, `private`, etc.)
- When enforcing 5-min minimum: preserves `private` and `no-transform` directives from origin

**Dev Override**: Set `website.cache_disabled_until` to a future timestamp to force `no-cache` on all responses for that website. Useful for testing changes without cached content.

```sql
-- Enable dev mode for 1 hour
UPDATE website SET cache_disabled_until = NOW() + INTERVAL '1 hour' WHERE id = 123;

-- Disable dev mode
UPDATE website SET cache_disabled_until = NULL WHERE id = 123;
```

Note: Translation config has 60-second in-memory cache, so changes take up to 60 seconds to take effect.

## Environment Variables

| Variable              | Default | Description                                    |
| --------------------- | ------- | ---------------------------------------------- |
| `POSTGRES_DB_URL`     | -       | PostgreSQL connection string (required)        |
| `OPENROUTER_API_KEY`  | -       | API key for OpenRouter (required)              |
| `PORT`                | `8787`  | Port the translation proxy listens on          |
| `MAINTENANCE_MESSAGE` | -       | When set, returns 503 page with this message   |
| `GOOGLE_PROJECT_ID`   | -       | Reserved for future Google Translate API       |

## Deployment (Render.com)

1. **Root Directory**: (leave empty - uses repo root)
2. **Build command**: `pnpm install && pnpm build:translate`
3. **Start command**: `node apps/translate/dist/server.js`
4. **Build Filters**:
    - Include paths: `apps/translate/**`, `packages/db/**`, `packages/lang/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`

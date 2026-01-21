# Translation Proxy (`apps/translate`)

Express-based translation proxy that translates websites on-the-fly.

## Architecture

The translation proxy processes each request through this pipeline:

**Cache -> Fetch -> Parse -> Extract -> Translate -> Apply -> Rewrite -> Return**

**Key Flow**:

-   Requests hit Express -> Host determines target language from database (`host` table)
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
| `P` | PII - Email addresses (redacted for privacy) | `[P1]` for "user@example.com" |
| `S` | Skip words - Brand names, proper nouns | `[S1]` for "eBay" |

### Key Files

- `config.ts`: `HTML_TAG_MAP`, `VOID_TAGS`, `INLINE_TAGS`
- `fetch/dom-placeholders.ts`: HTML → placeholder conversion
- `translation/skip-patterns.ts`: N (numeric) and P (PII) patterns
- `translation/skip-words.ts`: S (skip word) handling

## Translation Engine

-   Uses OpenRouter API (configured in `translation/translate.ts`)
-   Prompts defined in `translation/prompts.ts` (SEGMENT_PROMPT for text, PATHNAME_PROMPT for URLs)
-   Skip patterns in `translation/skip-patterns.ts` (PII, numeric, code detection)

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

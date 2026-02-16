# Weglot JS Client — Analysis & Reference

> Competitive analysis of `https://cdn.weglot.com/weglot.min.js` for informing a future Pantolingo JS component.
> Source: seefusion.tech (API key `wg_fe510c4d3a888db8e6b58b03413374847`)

---

## Overview

Weglot is a **client-side** website translation service. A single `<script>` tag + `Weglot.initialize({ api_key })` call translates an entire website by extracting DOM text, sending it to Weglot's translation API, and swapping the DOM content in-place. No server-side changes required.

---

## Architecture

### Core Modules

| Module | Purpose |
|--------|---------|
| **DOM Parser** | TreeWalker-based extraction of translatable text nodes and attributes |
| **Translation Engine** | Batches text, calls Weglot CDN API, caches results |
| **Language Switcher UI** | Customizable dropdown/toggle/bubble injected into the page |
| **URL Router** | Locale-based URL rewriting (path prefix or subdomain) |
| **Event System** | Pub/sub for `initialized`, `languageChanged`, `switchersReady` |
| **MutationObserver** | Watches for dynamically-added DOM content and translates it |

### Tech Stack

- ~50KB minified JS
- Preact/JSX-like lightweight virtual DOM for switcher UI components
- WeakMap for DOM element → translation caching
- TreeWalker API for efficient DOM traversal
- MutationObserver for SPA/dynamic content support

---

## Initialization Flow

```
1. Script loads → reads API key from Weglot.initialize() call
2. Fetches config from CDN:
   GET https://cdn-api.weglot.com/translations/settings?api_key=...
3. Polyfills loaded if needed (Symbols, Promises, URL, fetch)
4. Options merged: server config + client overrides
5. Language detected from URL path / cookie / browser preference
6. Waits for DOMContentLoaded
7. Language switcher UI injected into DOM
8. Event listeners attached (language switch, navigation)
9. Auto-switch redirect triggered (if enabled)
10. "initialized" event fired
```

---

## Translation Workflow

### Step 1: DOM Extraction

Uses `TreeWalker` to walk the entire DOM and extract:

- **Text nodes** — visible text content
- **Attributes** — `placeholder`, `alt`, `title`, `aria-label`
- **Meta tags** — `og:title`, `description`, `keywords`
- **Input values** — form field values
- **Image/PDF URLs** — (if `media_enabled`)
- **Page title** — `<title>` tag

Respects exclusions:
- `data-wg-notranslate` attribute on elements
- CSS selectors in `excluded_blocks` config
- URL patterns in `excluded_paths` config

### Step 2: Batch API Request

Extracted text is classified by **WordType** and sent as a single batch:

```json
POST https://cdn-api.weglot.com/translate?api_key=...

{
  "l_from": "en",
  "l_to": "de",
  "request_url": "https://seefusion.tech/page",
  "title": "Page Title",
  "bot": 0,
  "words": [
    { "w": "Welcome to our site", "t": 1 },
    { "w": "Search...", "t": 3 },
    { "w": "Homepage - Brand", "t": 9 }
  ]
}
```

#### WordType Classification

| Value | Name | Description |
|-------|------|-------------|
| 1 | TEXT | General text content (most common) |
| 2 | VALUE | HTML input `value` attribute |
| 3 | PLACEHOLDER | HTML input `placeholder` attribute |
| 4 | META_CONTENT | Meta tag content |
| 5 | IFRAME_SRC | iFrame source URL |
| 6 | IMG_SRC | Image source URL |
| 7 | IMG_ALT | Image alt text |
| 8 | PDF_HREF | PDF document links |
| 9 | PAGE_TITLE | `<title>` tag content |
| 10 | EXTERNAL_LINK | External hyperlinks |

#### BotType Classification

| Value | Name | Description |
|-------|------|-------------|
| 0 | HUMAN | Human-initiated request |
| 1 | OTHER | Unknown source |
| 2 | GOOGLE | Google Bot |
| 3 | BING | Bing Bot |
| 4 | YAHOO | Yahoo Bot |
| 5 | BAIDU | Baidu Bot |
| 6 | YANDEX | Yandex Bot |

### Step 3: API Response

```json
{
  "l_from": "en",
  "l_to": "de",
  "from_words": ["Welcome to our site", "Search...", "Homepage - Brand"],
  "to_words": ["Willkommen auf unserer Seite", "Suche...", "Startseite - Marke"]
}
```

Parallel arrays — same index maps original → translated.

### Step 4: DOM Swap

- Stores original ↔ translated pairs in **WeakMap** (keyed by DOM element)
- Replaces `innerHTML` / `textContent` with translated text
- Updates attributes (`placeholder`, `alt`, `title`, etc.)
- Preserves inline element structure ("merge mode" for spans within text)
- Rewrites URL to locale prefix (`/de/page`)
- Sets language cookie for persistence

### Step 5: Language Switching

When `Weglot.switchTo("es")` is called:
- If translations cached in WeakMap → instant swap (no network request)
- If not cached → new batch translate request → swap
- URL rewritten to new locale prefix
- Cookie updated
- `languageChanged` event dispatched

### Step 6: Dynamic Content

MutationObserver watches for DOM mutations:
- New nodes added → extract text → batch translate → swap
- Handles SPAs, AJAX-loaded content, infinite scroll, etc.

---

## URL Handling

Two modes (configured server-side):

| Mode | Example | Config |
|------|---------|--------|
| **Path prefix** (default) | `seefusion.tech/de/page` | `subdomain: false` |
| **Subdomain** | `de.seefusion.tech/page` | `subdomain: true` + `connect_host_destination` per language |

The `connect_host_destination` field on each language object maps a language to a specific hostname. When `null`, path prefix mode is used.

Additional URL features:
- Slug translation via separate API (`/translations/slugs`)
- Query parameter and fragment preservation
- Locale detection from pathname via regex

---

## Switcher UI

9 pre-built templates:
- Default dropdown
- Toggle
- Bubble
- Vertical/horizontal expand
- Custom placement via CSS selectors

Configuration options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `with_name` | bool | `true` | Show language name label |
| `full_name` | bool | `true` | Full name vs 2-letter code |
| `is_dropdown` | bool | `true` | Dropdown vs flat list |
| `with_flags` | bool | `true` | Show flag icons |
| `flag_type` | string | `"rectangle_mat"` | Flag style: shiny, square, circle, rectangle_mat |
| `invert_flags` | bool | `true` | Reorder list on selection |

Placement:
- `target` — CSS selector of parent container
- `sibling` — CSS selector of next sibling (null = append last)

---

## JavaScript API

| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `Weglot.initialize(options)` | config object | void | Initialize with API key + options |
| `Weglot.getCurrentLang()` | — | string | Current ISO 639-1 language code |
| `Weglot.switchTo(code)` | language code | void | Switch page to target language |
| `Weglot.translate(payload, cb)` | words object, callback | Promise | Translate arbitrary text |
| `Weglot.getLanguageName(code)` | language code | string | Native name of language |
| `Weglot.getBestAvailableLanguage()` | — | string | Best match from browser language |
| `Weglot.search(term, cb)` | search string, callback | bool | Translate search term back to source |
| `Weglot.on(event, cb)` | event name, callback | void | Subscribe to events |
| `Weglot.off(event, cb)` | event name, callback | bool | Unsubscribe from events |

Events: `initialized`, `languageChanged`, `switchersReady`

---

## Configuration Options (initialize)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `api_key` | string | **required** | Weglot API key |
| `switchers` | array | `[]` | Switcher configs (style + location) |
| `wait_transition` | bool | `true` | Hide content during translation to prevent flicker |
| `hide_switcher` | bool | `false` | Don't create language switchers |
| `translate_search` | bool | `false` | Translate search queries |
| `search_forms` | string | `""` | CSS selectors of search forms |
| `search_parameter` | string | `""` | Input name for search keywords |
| `whitelist` | array | `[]` | Only translate these selectors |
| `cache` | bool | `false` | Cache translations in browser |
| `extra_definitions` | array | `[]` | Custom translation definitions |
| `extra_merged_selectors` | array | `[]` | Additional selectors to merge |
| `auto_switch` | bool | — | Auto-redirect by browser language |
| `auto_switch_fallback` | string | — | Fallback language for auto-switch |
| `excluded_blocks` | array | `[]` | CSS selectors to exclude from translation |
| `excluded_paths` | array | `[]` | URL paths to exclude (supports IS_EXACTLY, CONTAIN, START_WITH, END_WITH, MATCH_REGEX) |

---

## seefusion.tech Live Config

```json
{
  "website": "https://seefusion.tech",
  "language_from": "en",
  "languages": [
    { "language_to": "de", "enabled": true, "automatic_translation_enabled": true, "connect_host_destination": null },
    { "language_to": "es", "enabled": true, "automatic_translation_enabled": true, "connect_host_destination": null }
  ],
  "auto_switch": false,
  "translation_engine": 3,
  "excluded_paths": [],
  "excluded_blocks": [],
  "custom_settings": {
    "button_style": { "with_name": true, "full_name": true, "is_dropdown": true, "with_flags": false },
    "translate_search": false,
    "loading_bar": true,
    "hide_switcher": false,
    "translate_images": false,
    "subdomain": false,
    "wait_transition": true
  },
  "media_enabled": false,
  "external_enabled": false,
  "technology_name": "Other",
  "product": "1.0"
}
```

Summary: English → German + Spanish, path prefix routing (`/de/`, `/es/`), dropdown switcher without flags, no exclusions, no subdomain mode.

---

## Performance Characteristics

### Client-Side Cost (Weglot approach)

```
1. Load page HTML (English) from origin server
2. Load weglot.min.js (~50KB)
3. Fetch settings config from CDN API
4. Parse DOM, extract all text nodes
5. POST batch translation request to API
6. Wait for translation response
7. Swap DOM content
```

**Result**: 3-5 network round trips before visitor sees translated content. `wait_transition: true` hides content during this process to prevent English flash.

### Server-Side Cost (Pantolingo approach)

```
1. Request hits translated domain (e.g., de.seefusion.tech)
2. Proxy fetches origin, translates server-side
3. Fully translated HTML returned in first response
```

**Result**: Translated content on first paint. Zero client-side JS overhead. Better for SEO (crawlers see translated HTML immediately).

---

## Lessons for a Pantolingo JS Component

### What Weglot Does Well

1. **Zero-config DOM extraction** — TreeWalker + WordType classification handles every translatable element type automatically
2. **WeakMap caching** — elegant pattern for DOM element ↔ translation mapping with automatic GC
3. **MutationObserver for SPAs** — handles dynamic content without manual intervention
4. **Batch API design** — single request for all text on a page, parallel arrays for response
5. **Graceful degradation** — `wait_transition` prevents content flash; loading bar for feedback

### Where Pantolingo Has Advantages

1. **First-paint translation** — server-side proxy means no JS delay, no content flash
2. **SEO by default** — crawlers see translated HTML without executing JS
3. **No client-side dependency** — works with JS disabled, older browsers, etc.
4. **Domain-based routing** — `de.example.com` is cleaner than path prefixes for SEO

### If Building a Pantolingo JS Component

A JS component could complement the proxy for use cases like:

- **Client-only translation** for sites that can't use the proxy (e.g., static hosts, SPAs)
- **Hybrid mode** — proxy handles initial render, JS handles dynamic content updates
- **Language switcher widget** — embeddable UI component (could work with both proxy and JS modes)
- **Translation preview** — let users see translations in real-time before publishing

Key implementation considerations:
- Use **TreeWalker** (not querySelectorAll) for DOM extraction — much faster on large pages
- **WeakMap** for caching translations per DOM element
- **MutationObserver** for SPA/dynamic content support
- **WordType classification** for organizing translations in the dashboard
- Batch API design — minimize round trips
- Consider a **ServiceWorker** approach as alternative to DOM swapping (intercept fetch, translate response HTML server-side, return translated HTML) — would give first-paint benefits similar to the proxy
- `wait_transition` / skeleton screens to handle the flash-of-untranslated-content (FOUC) problem

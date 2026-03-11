# Cookie Domain Rewriting (PAN-18 Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `Domain` attribute in `Set-Cookie` response headers so cookies work correctly on translated domains.

**Architecture:** New `cookies.ts` module with a pure `rewriteSetCookieDomain()` function and a `rewriteSetCookieHeaders()` array helper. Called from `prepareResponseHeaders()` (for HTML/static/non-HTML responses) and directly from the redirect handler in `pipeline.ts`. Origin apex comes from DB; translated apex computed via `tldts`.

**Tech Stack:** TypeScript, Vitest, tldts, Express

**Spec:** `docs/specs/2026-03-11-cookie-domain-rewriting-design.md`

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `apps/translate/src/http/cookies.ts` | Create | `rewriteSetCookieDomain()` + `rewriteSetCookieHeaders()` |
| `apps/translate/src/http/cookies.test.ts` | Create | Unit tests for cookie rewriting |
| `apps/translate/src/http/headers.ts` | Modify | Add optional `cookieRewriteConfig` param, call `rewriteSetCookieHeaders()` |
| `apps/translate/src/http/proxy.ts` | Modify | Thread `CookieRewriteConfig` through `ProxyConfig` to `prepareResponseHeaders()` |
| `apps/translate/src/pipeline.ts` | Modify | Compute cookie rewrite config, pass to all response paths |
| `packages/db/src/website-language.ts` | Modify | Add `apex` to interface + SQL SELECT |
| `packages/db/src/index.ts` | No change needed | `WebsiteLanguageConfig` already re-exported |
| `apps/translate/package.json` | Modify | Add `tldts` dependency |

---

## Chunk 1: Core Cookie Rewriting Module (cookies.ts + tests)

### Task 1: Add tldts dependency

**Files:**
- Modify: `apps/translate/package.json`

- [ ] **Step 1: Install tldts**

Run:
```bash
pnpm add tldts --filter @pantolingo/translate
```

- [ ] **Step 2: Verify installation**

Run:
```bash
grep tldts apps/translate/package.json
```
Expected: `"tldts": "^7.x.x"` in dependencies

- [ ] **Step 3: Commit**

```bash
git add apps/translate/package.json pnpm-lock.yaml
git commit -m "chore: add tldts dependency to translate app"
```

---

### Task 2: Write failing tests for rewriteSetCookieDomain

**Files:**
- Create: `apps/translate/src/http/cookies.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `apps/translate/src/http/cookies.test.ts`:

```typescript
/**
 * Tests for Set-Cookie domain rewriting
 */

import { describe, it, expect } from 'vitest'
import { rewriteSetCookieDomain, rewriteSetCookieHeaders } from './cookies.js'

describe('rewriteSetCookieDomain', () => {
	describe('same apex — wildcard covers translated host', () => {
		it('skips .example.com when translated host is de.example.com', () => {
			const cookie = 'sid=abc; Domain=.example.com; Path=/'
			const result = rewriteSetCookieDomain(cookie, 'example.com', 'de.example.com', 'example.com')
			expect(result).toBe(cookie)
		})

		it('skips example.com (without dot) when translated host is de.example.com', () => {
			const cookie = 'sid=abc; Domain=example.com; Path=/'
			const result = rewriteSetCookieDomain(cookie, 'example.com', 'de.example.com', 'example.com')
			expect(result).toBe(cookie)
		})
	})

	describe('same apex — host-specific does not cover', () => {
		it('rewrites www.example.com to de.example.com', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; Domain=www.example.com; Path=/',
				'example.com',
				'de.example.com',
				'example.com'
			)
			expect(result).toBe('sid=abc; Domain=de.example.com; Path=/')
		})
	})

	describe('no Domain attribute', () => {
		it('returns cookie unchanged', () => {
			const cookie = 'sid=abc; Path=/; Secure; HttpOnly'
			const result = rewriteSetCookieDomain(cookie, 'example.com', 'de.example.com', 'example.com')
			expect(result).toBe(cookie)
		})
	})

	describe('different apex — apex cookie', () => {
		it('rewrites .example.com to .example.de', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; Domain=.example.com; Path=/',
				'example.com',
				'www.example.de',
				'example.de'
			)
			expect(result).toBe('sid=abc; Domain=.example.de; Path=/')
		})

		it('rewrites example.com (no dot) to example.de', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; Domain=example.com; Path=/',
				'example.com',
				'www.example.de',
				'example.de'
			)
			expect(result).toBe('sid=abc; Domain=example.de; Path=/')
		})
	})

	describe('different apex — host-specific cookie', () => {
		it('rewrites www.example.com to www.example.de', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; Domain=www.example.com; Path=/',
				'example.com',
				'www.example.de',
				'example.de'
			)
			expect(result).toBe('sid=abc; Domain=www.example.de; Path=/')
		})
	})

	describe('IP address / localhost', () => {
		it('skips rewriting when translated host is an IP', () => {
			const cookie = 'sid=abc; Domain=.example.com; Path=/'
			const result = rewriteSetCookieDomain(cookie, 'example.com', '127.0.0.1', null)
			expect(result).toBe(cookie)
		})

		it('skips rewriting when translated host is localhost', () => {
			const cookie = 'sid=abc; Domain=.example.com; Path=/'
			const result = rewriteSetCookieDomain(cookie, 'example.com', 'localhost', null)
			expect(result).toBe(cookie)
		})
	})

	describe('origin is apex itself', () => {
		it('skips when cookie domain equals translated apex and covers', () => {
			const cookie = 'sid=abc; Domain=example.com; Path=/'
			const result = rewriteSetCookieDomain(cookie, 'example.com', 'de.example.com', 'example.com')
			expect(result).toBe(cookie)
		})
	})

	describe('leading dot equivalence', () => {
		it('treats Domain=example.com and Domain=.example.com identically for coverage', () => {
			const withDot = rewriteSetCookieDomain(
				'sid=abc; Domain=.example.com; Path=/',
				'example.com', 'de.example.com', 'example.com'
			)
			const withoutDot = rewriteSetCookieDomain(
				'sid=abc; Domain=example.com; Path=/',
				'example.com', 'de.example.com', 'example.com'
			)
			// Both should skip (apex covers de.example.com)
			expect(withDot).toContain('Domain=.example.com')
			expect(withoutDot).toContain('Domain=example.com')
		})
	})

	describe('preserves other attributes', () => {
		it('only changes Domain, keeps Path, Secure, HttpOnly, SameSite', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; Domain=www.example.com; Path=/app; Secure; HttpOnly; SameSite=Lax',
				'example.com',
				'de.example.com',
				'example.com'
			)
			expect(result).toBe('sid=abc; Domain=de.example.com; Path=/app; Secure; HttpOnly; SameSite=Lax')
		})
	})

	describe('multiple Domain attributes', () => {
		it('uses the last Domain value per RFC 6265', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; Domain=ignored.com; Domain=www.example.com; Path=/',
				'example.com',
				'de.example.com',
				'example.com'
			)
			expect(result).toBe('sid=abc; Domain=ignored.com; Domain=de.example.com; Path=/')
		})
	})

	describe('case insensitivity', () => {
		it('handles DOMAIN attribute case-insensitively', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; DOMAIN=www.example.com; Path=/',
				'example.com',
				'de.example.com',
				'example.com'
			)
			expect(result).toBe('sid=abc; DOMAIN=de.example.com; Path=/')
		})
	})
})

describe('rewriteSetCookieHeaders', () => {
	it('rewrites an array of cookie strings', () => {
		const cookies = [
			'sid=abc; Domain=www.example.com; Path=/',
			'pref=dark; Path=/',
			'token=xyz; Domain=.example.com; Secure',
		]
		const result = rewriteSetCookieHeaders(cookies, {
			originApex: 'example.com',
			translatedHost: 'de.example.com',
			translatedApex: 'example.com',
		})
		expect(result).toEqual([
			'sid=abc; Domain=de.example.com; Path=/',
			'pref=dark; Path=/',
			'token=xyz; Domain=.example.com; Secure',
		])
	})

	it('returns empty array for empty input', () => {
		const result = rewriteSetCookieHeaders([], {
			originApex: 'example.com',
			translatedHost: 'de.example.com',
			translatedApex: 'example.com',
		})
		expect(result).toEqual([])
	})
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:
```bash
cd apps/translate && pnpm vitest run src/http/cookies.test.ts
```
Expected: FAIL — module `./cookies.js` not found

- [ ] **Step 3: Commit failing tests**

```bash
git add apps/translate/src/http/cookies.test.ts
git commit -m "test: add failing tests for Set-Cookie domain rewriting"
```

---

### Task 3: Implement rewriteSetCookieDomain and rewriteSetCookieHeaders

**Files:**
- Create: `apps/translate/src/http/cookies.ts`

- [ ] **Step 1: Implement cookies.ts**

Create `apps/translate/src/http/cookies.ts`:

```typescript
/**
 * Set-Cookie domain rewriting for the translation proxy
 *
 * Rewrites the Domain attribute in Set-Cookie response headers so cookies
 * set by the origin work correctly on translated domains.
 */

import { parse } from 'tldts'

/**
 * Configuration for cookie domain rewriting
 */
export interface CookieRewriteConfig {
	originApex: string
	translatedHost: string
	translatedApex: string | null
}

/**
 * Rewrite the Domain attribute of a single Set-Cookie header string.
 *
 * @param cookie - Raw Set-Cookie header value
 * @param originApex - Origin website's apex domain (e.g., "example.com")
 * @param translatedHost - Full translated hostname (e.g., "de.example.com")
 * @param translatedApex - Translated domain's apex (e.g., "example.com"), or null for IP/localhost
 * @returns Rewritten cookie string (or original if no rewrite needed)
 */
export function rewriteSetCookieDomain(
	cookie: string,
	originApex: string,
	translatedHost: string,
	translatedApex: string | null
): string {
	// IP/localhost check: if translatedApex is null, skip rewriting
	if (translatedApex === null) {
		return cookie
	}

	// Parse cookie into parts: "name=value; attr1; attr2=val; ..."
	const parts = cookie.split(';').map(p => p.trim())

	// Find the last Domain attribute (RFC 6265: last one wins)
	let lastDomainIndex = -1
	let rawDomainValue = ''
	for (let i = 1; i < parts.length; i++) {
		const eq = parts[i].indexOf('=')
		const attrName = eq === -1 ? parts[i] : parts[i].substring(0, eq)
		if (attrName.trim().toLowerCase() === 'domain') {
			lastDomainIndex = i
			rawDomainValue = eq === -1 ? '' : parts[i].substring(eq + 1).trim()
		}
	}

	// No Domain attribute -> return unchanged
	if (lastDomainIndex === -1) {
		return cookie
	}

	// Strip leading dot for comparison (RFC 6265: .example.com === example.com)
	const hasLeadingDot = rawDomainValue.startsWith('.')
	const cookieDomain = rawDomainValue.replace(/^\./, '').toLowerCase()
	const translatedHostLower = translatedHost.toLowerCase()
	const translatedApexLower = translatedApex.toLowerCase()

	// Coverage check: does this cookie domain already cover translatedHost?
	if (
		cookieDomain === translatedApexLower ||
		cookieDomain === translatedHostLower ||
		translatedHostLower.endsWith('.' + cookieDomain)
	) {
		return cookie // Already covers translated host
	}

	// Rewrite: determine new domain
	const originApexLower = originApex.toLowerCase()
	const newDomain = cookieDomain === originApexLower
		? (hasLeadingDot ? '.' + translatedApex : translatedApex)
		: (hasLeadingDot ? '.' + translatedHost : translatedHost)

	// Reconstruct: replace only the last Domain attribute's value
	const eq = parts[lastDomainIndex].indexOf('=')
	const attrName = parts[lastDomainIndex].substring(0, eq)
	parts[lastDomainIndex] = `${attrName}=${newDomain}`

	return parts.join('; ')
}

/**
 * Rewrite Domain attributes for an array of Set-Cookie header strings.
 *
 * @param cookies - Array of raw Set-Cookie header values
 * @param config - Cookie rewrite configuration
 * @returns Array of rewritten cookie strings
 */
export function rewriteSetCookieHeaders(
	cookies: string[],
	config: CookieRewriteConfig
): string[] {
	return cookies.map(cookie =>
		rewriteSetCookieDomain(cookie, config.originApex, config.translatedHost, config.translatedApex)
	)
}
```

- [ ] **Step 2: Run tests to verify they pass**

Run:
```bash
cd apps/translate && pnpm vitest run src/http/cookies.test.ts
```
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add apps/translate/src/http/cookies.ts
git commit -m "feat: implement Set-Cookie domain rewriting (cookies.ts)"
```

---

## Chunk 2: Integration (DB + headers + proxy + pipeline)

### Task 4: Add apex to WebsiteLanguageConfig

**Files:**
- Modify: `packages/db/src/website-language.ts:21-32` (interface)
- Modify: `packages/db/src/website-language.ts:85-132` (query + mapping)

- [ ] **Step 1: Add apex to the interface**

In `packages/db/src/website-language.ts`, add `apex` field to `WebsiteLanguageConfig` (after line 31):

```typescript
// Add after cacheDisabledUntil line:
apex: string | null // website.apex — origin domain apex for cookie rewriting
```

- [ ] **Step 2: Add apex to the SQL SELECT**

In `packages/db/src/website-language.ts`:

1. Add `w.apex` on a new line after `w.source_lang` (line 107), before the FROM clause:
```sql
				w.source_lang,
				w.apex
```
(Only `w.apex` is new — `w.source_lang` is shown for context.)

2. Add `apex: string | null` to the query type parameter block (after `source_lang: string` on line 95).

- [ ] **Step 3: Map apex in the config object**

In `packages/db/src/website-language.ts`, add to the config object (after line 131, before the closing `}`):

```typescript
apex: row.apex,
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
cd packages/db && npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add packages/db/src/website-language.ts
git commit -m "feat: add apex to WebsiteLanguageConfig for cookie rewriting"
```

---

### Task 5: Thread cookie rewrite config through prepareResponseHeaders

**Files:**
- Modify: `apps/translate/src/http/headers.ts:43-72`

- [ ] **Step 1: Add import and optional parameter**

In `apps/translate/src/http/headers.ts`, add import at top:

```typescript
import { rewriteSetCookieHeaders, type CookieRewriteConfig } from './cookies.js'
```

Extend the function signature (line 43-45) to:

```typescript
export function prepareResponseHeaders(
  originHeaders: Headers,
  cookieRewriteConfig?: CookieRewriteConfig
): Record<string, string | string[]> {
```

- [ ] **Step 2: Apply cookie rewriting before setting cookies**

Replace the cookie accumulation block (lines 63-66) with:

```typescript
  // Apply cookie domain rewriting if config provided, then add to headers
  if (cookies.length > 0) {
    headers['Set-Cookie'] = cookieRewriteConfig
      ? rewriteSetCookieHeaders(cookies, cookieRewriteConfig)
      : cookies
  }
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
cd apps/translate && npx tsc --noEmit
```
Expected: No errors (existing callers still work — param is optional)

- [ ] **Step 4: Commit**

```bash
git add apps/translate/src/http/headers.ts
git commit -m "feat: add optional cookie rewrite config to prepareResponseHeaders"
```

---

### Task 6: Thread cookie config through ProxyConfig and proxy functions

**Files:**
- Modify: `apps/translate/src/http/proxy.ts:20-24` (ProxyConfig interface)
- Modify: `apps/translate/src/http/proxy.ts:99` (proxyStaticAsset call)
- Modify: `apps/translate/src/http/proxy.ts:131` (proxyNonHtmlContent call)

- [ ] **Step 1: Add CookieRewriteConfig to ProxyConfig**

In `apps/translate/src/http/proxy.ts`, add import:

```typescript
import type { CookieRewriteConfig } from './cookies.js'
```

Add to the `ProxyConfig` interface (after `cacheDisabledUntil` on line 23):

```typescript
cookieRewriteConfig?: CookieRewriteConfig
```

- [ ] **Step 2: Pass config to prepareResponseHeaders in proxyStaticAsset**

In `proxyStaticAsset`, change line 99 from:

```typescript
const responseHeaders = prepareResponseHeaders(originResponse.headers)
```

to:

```typescript
const responseHeaders = prepareResponseHeaders(originResponse.headers, config.cookieRewriteConfig)
```

- [ ] **Step 3: Pass config to prepareResponseHeaders in proxyNonHtmlContent**

In `proxyNonHtmlContent`, change line 131 from:

```typescript
const proxyHeaders = prepareResponseHeaders(originResponse.headers)
```

to:

```typescript
const proxyHeaders = prepareResponseHeaders(originResponse.headers, config.cookieRewriteConfig)
```

- [ ] **Step 4: Verify TypeScript compiles**

Run:
```bash
cd apps/translate && npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 5: Commit**

```bash
git add apps/translate/src/http/proxy.ts
git commit -m "feat: thread cookie rewrite config through proxy functions"
```

---

### Task 7: Integrate cookie rewriting in pipeline.ts

**Files:**
- Modify: `apps/translate/src/pipeline.ts`

This is the main integration point. We need to:
1. Import `tldts` and cookie types
2. Compute the cookie rewrite config once per request
3. Pass it to all four response paths (static, redirect, non-HTML, HTML)

- [ ] **Step 1: Add imports**

At the top of `apps/translate/src/pipeline.ts`, add:

```typescript
import { parse as parseTld } from 'tldts'
import { rewriteSetCookieHeaders, type CookieRewriteConfig } from './http/cookies.js'
```

- [ ] **Step 2: Compute cookie rewrite config after langConfig is resolved**

After line 248 (`const originHostname = langConfig.websiteHostname`), add:

```typescript
		// Compute cookie rewrite config
		const originApex = langConfig.apex ?? parseTld(langConfig.websiteHostname).domain ?? null
		const translatedApex = parseTld(host).domain ?? null
		const cookieRewriteConfig: CookieRewriteConfig | undefined =
			originApex && translatedApex
				? { originApex, translatedHost: host, translatedApex }
				: undefined
```

- [ ] **Step 3: Add cookieRewriteConfig to proxyConfig**

Modify the `proxyConfig` object (around line 264-268) to include the new field:

```typescript
		const proxyConfig: ProxyConfig = {
			originBase,
			targetLang,
			cacheDisabledUntil: langConfig.cacheDisabledUntil,
			cookieRewriteConfig,
		}
```

This automatically threads cookie rewriting through `proxyStaticAsset` and `proxyNonHtmlContent`.

- [ ] **Step 4: Add cookie rewriting to the redirect handler**

In the redirect handler, replace lines 342-351 (from the `// Forward Set-Cookie headers` comment through the closing `}` of `if (cookies.length > 0)`) with:

```typescript
					// Forward Set-Cookie headers with domain rewriting
					const cookies: string[] = []
					originResponse.headers.forEach((value, key) => {
						if (key.toLowerCase() === 'set-cookie') {
							cookies.push(value)
						}
					})
					if (cookies.length > 0) {
						const rewritten = cookieRewriteConfig
							? rewriteSetCookieHeaders(cookies, cookieRewriteConfig)
							: cookies
						res.set('Set-Cookie', rewritten)
					}
```

The old code to remove:
```typescript
					// Forward Set-Cookie headers (can be multiple)
					const cookies: string[] = []
					originResponse.headers.forEach((value, key) => {
						if (key.toLowerCase() === 'set-cookie') {
							cookies.push(value)
						}
					})
					if (cookies.length > 0) {
						res.set('Set-Cookie', cookies)
					}
```

- [ ] **Step 5: Pass cookieRewriteConfig to prepareResponseHeaders for HTML responses**

Update the two `prepareResponseHeaders` calls for HTML:

Line ~667 (deferred path):
```typescript
const htmlHeaders = prepareResponseHeaders(fetchResult.headers, cookieRewriteConfig)
```

Line ~1000 (sync path):
```typescript
const htmlHeaders = prepareResponseHeaders(fetchResult.headers, cookieRewriteConfig)
```

- [ ] **Step 6: Verify TypeScript compiles**

Run:
```bash
cd apps/translate && npx tsc --noEmit
```
Expected: No errors

- [ ] **Step 7: Run all existing tests to check for regressions**

Run:
```bash
pnpm test
```
Expected: All existing tests pass

- [ ] **Step 8: Commit**

```bash
git add apps/translate/src/pipeline.ts
git commit -m "feat: integrate cookie domain rewriting into all response paths"
```

---

### Task 8: Integration tests for prepareResponseHeaders with cookie config

**Files:**
- Create: `apps/translate/src/http/headers.test.ts`

- [ ] **Step 1: Write integration tests**

Create `apps/translate/src/http/headers.test.ts`:

```typescript
/**
 * Integration tests for prepareResponseHeaders with cookie rewriting
 */

import { describe, it, expect } from 'vitest'
import { prepareResponseHeaders } from './headers.js'

describe('prepareResponseHeaders', () => {
	function makeHeaders(entries: [string, string][]): Headers {
		const h = new Headers()
		for (const [k, v] of entries) {
			h.append(k, v)
		}
		return h
	}

	it('rewrites Set-Cookie domains when config is provided', () => {
		const origin = makeHeaders([
			['content-type', 'text/html'],
			['set-cookie', 'sid=abc; Domain=www.example.com; Path=/'],
			['set-cookie', 'pref=dark; Path=/'],
		])
		const result = prepareResponseHeaders(origin, {
			originApex: 'example.com',
			translatedHost: 'de.example.com',
			translatedApex: 'example.com',
		})
		expect(result['Set-Cookie']).toEqual([
			'sid=abc; Domain=de.example.com; Path=/',
			'pref=dark; Path=/',
		])
	})

	it('passes cookies through unchanged when no config provided', () => {
		const origin = makeHeaders([
			['set-cookie', 'sid=abc; Domain=www.example.com; Path=/'],
		])
		const result = prepareResponseHeaders(origin)
		expect(result['Set-Cookie']).toEqual([
			'sid=abc; Domain=www.example.com; Path=/',
		])
	})

	it('returns no Set-Cookie key when origin has no cookies', () => {
		const origin = makeHeaders([['content-type', 'text/html']])
		const result = prepareResponseHeaders(origin, {
			originApex: 'example.com',
			translatedHost: 'de.example.com',
			translatedApex: 'example.com',
		})
		expect(result['Set-Cookie']).toBeUndefined()
	})
})
```

- [ ] **Step 2: Run tests to verify they pass**

Run:
```bash
cd apps/translate && pnpm vitest run src/http/headers.test.ts
```
Expected: ALL PASS

- [ ] **Step 3: Commit**

```bash
git add apps/translate/src/http/headers.test.ts
git commit -m "test: add integration tests for prepareResponseHeaders cookie rewriting"
```

---

### Task 9: Build verification

- [ ] **Step 1: Verify the full build succeeds**

Run:
```bash
pnpm build
```
Expected: Build completes without errors

- [ ] **Step 2: Run all tests**

Run:
```bash
pnpm test
```
Expected: All tests pass

- [ ] **Step 3: Final commit (if any cleanup needed)**

If any adjustments were needed during verification, commit them.

---

Plan Name: 2026-03-11-cookie-domain-rewriting.md

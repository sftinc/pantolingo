# Phase B: Use 2-char language subtag for derived hostnames

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Change `deriveTranslationSubdomain()` to return the primary language subtag (`es`) instead of the full BCP 47 code (`es-mx`), and update the wizard's Step 4 language filter to exclude all variants sharing a subtag once one is selected.

**Architecture:** Two changes — (1) the `@pantolingo/lang` package's `subdomain.ts` extracts just `langCode.split('-')[0]` instead of returning the full code, and (2) the wizard's Step 4 filters `availableLanguages` by subtag prefix instead of exact code match. This ensures only one language per subdomain per apex domain.

**Tech Stack:** TypeScript, Vitest, React (client component)

---

### Task 1: Write failing tests for `deriveTranslationSubdomain`

**Files:**
- Create: `packages/lang/src/subdomain.test.ts`

**Step 1: Write the failing test**

No test file exists yet for `subdomain.ts`. Create one covering the new subtag behavior.

```typescript
import { describe, it, expect } from 'vitest'
import { deriveTranslationSubdomain } from './subdomain.js'

describe('deriveTranslationSubdomain', () => {
	it('extracts 2-char subtag from regional code', () => {
		expect(deriveTranslationSubdomain('es-mx')).toBe('es')
	})

	it('extracts subtag from another regional code', () => {
		expect(deriveTranslationSubdomain('fr-ca')).toBe('fr')
	})

	it('handles codes with script subtags (zh-hans)', () => {
		expect(deriveTranslationSubdomain('zh-hans')).toBe('zh')
	})

	it('handles 3-char subtags (fil-ph)', () => {
		expect(deriveTranslationSubdomain('fil-ph')).toBe('fil')
	})

	it('lowercases the result', () => {
		expect(deriveTranslationSubdomain('ES-MX')).toBe('es')
	})

	it('handles code with no region (bare subtag)', () => {
		expect(deriveTranslationSubdomain('en')).toBe('en')
	})
})
```

**Step 2: Run test to verify it fails**

Run: `pnpm test -- packages/lang/src/subdomain.test.ts`

Expected: Most tests FAIL — `deriveTranslationSubdomain('es-mx')` currently returns `'es-mx'`, not `'es'`.

---

### Task 2: Implement `deriveTranslationSubdomain` subtag extraction

**Files:**
- Modify: `packages/lang/src/subdomain.ts` (the entire 13-line file)

**Step 1: Update the function**

Replace the full file content:

```typescript
/**
 * Derive a translation subdomain from a BCP 47 language code.
 *
 * Extracts the primary language subtag (e.g., "es" from "es-mx")
 * so that only one variant per language exists on a given apex domain.
 *
 * @param langCode - BCP 47 language code (e.g., "es-mx", "zh-hans", "fr-fr")
 * @returns Subdomain prefix (e.g., "es", "zh", "fr")
 */
export function deriveTranslationSubdomain(langCode: string): string {
	return langCode.split('-')[0].toLowerCase()
}
```

**Step 2: Run tests to verify they pass**

Run: `pnpm test -- packages/lang/src/subdomain.test.ts`

Expected: All 6 tests PASS.

**Step 3: Run full build to verify no breakage**

Run: `pnpm build`

Expected: Clean build, no errors.

**Step 4: Commit**

```
git add packages/lang/src/subdomain.ts packages/lang/src/subdomain.test.ts
git commit -m "Use primary language subtag for translation subdomains

deriveTranslationSubdomain now returns 'es' instead of 'es-mx',
ensuring one subdomain per language per apex domain."
```

---

### Task 3: Update wizard Step 4 language filter to use subtag prefix

**Files:**
- Modify: `apps/www/src/components/account/WebsiteWizardModal.tsx:400-404` (the `availableLanguages` filter in `Step4`)

**Context:** Currently (line 400-404 of `WebsiteWizardModal.tsx`):

```typescript
const availableLanguages = languages.filter((l) => {
    if (l.code === sourceLangCode) return false
    if (targetLangs.some((t) => t.code === l.code)) return false
    return true
})
```

This filters by exact code match. After selecting `es-mx` as a target, `es-ar`, `es-es`, etc. remain available. Since all `es-*` variants now map to the same `es.apex.com` subdomain, we must exclude them all.

**Step 1: Update the filter**

Replace the `availableLanguages` block (lines 400-405) with:

```typescript
const sourceSubtag = sourceLangCode.split('-')[0]
const availableLanguages = languages.filter((l) => {
    const subtag = l.code.split('-')[0]
    if (subtag === sourceSubtag) return false
    if (targetLangs.some((t) => t.code.split('-')[0] === subtag)) return false
    return true
})
```

**What this does:**
- `sourceSubtag`: extracts `'en'` from `'en-us'` — removes all English variants from target options
- First filter: removes all variants sharing the source language's subtag (was exact match before)
- Second filter: once any `es-*` is selected as target, all other `es-*` variants disappear from dropdown

**Step 2: Build to verify**

Run: `pnpm build`

Expected: Clean build, no TypeScript errors.

**Step 3: Commit**

```
git add apps/www/src/components/account/WebsiteWizardModal.tsx
git commit -m "Filter wizard language dropdown by subtag prefix

Selecting any variant (e.g., Spanish Mexico) removes all other
variants sharing the same subtag from the dropdown."
```

---

### Task 4: Manual verification

Not automatable — human tester should verify:

1. Open the website wizard, reach Step 4 (target languages)
2. Select "Spanish (Mexico)" as a target — all other `es-*` variants should disappear from dropdown
3. Remove "Spanish (Mexico)" — all `es-*` variants reappear
4. Source language variants should also be excluded (e.g., if source is `en-us`, no `en-*` variants in target dropdown)
5. Reach Step 5 (review) and create — hostnames in DB should use 2-char subtag (e.g., `es.example.com`, not `es-mx.example.com`)

Plan Name: 2026-03-02-phase-b-2char-subtag-hostnames.md

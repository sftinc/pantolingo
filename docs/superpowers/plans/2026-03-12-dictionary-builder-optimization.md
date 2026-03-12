# Dictionary Builder O(n) Optimization

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate O(n²) DOM traversal in `buildTranslationDictionary` by using the translations array directly, reducing response time from 50s to <1s on large Duda pages.

**Architecture:** The current dictionary builder re-reads translated values from the DOM per segment (O(n × DOM)). Since the `restoredTranslations` array already contains all translated values at both pipeline call sites, we pass it through instead. For `html` segments, we use `placeholdersToHtml()` to reconstruct innerHTML from the translation + replacements. This eliminates all DOM traversal, making the function O(n).

**Tech Stack:** TypeScript, Vitest, linkedom

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `apps/translate/src/recovery/dictionary-builder.ts` | Rewrite | Accept `translations` param, delete all DOM traversal helpers |
| `apps/translate/src/recovery/dictionary-builder.test.ts` | Rewrite | Pass translations array to `buildTranslationDictionary`, no DOM reads |
| `apps/translate/src/pipeline.ts` | Modify (2 sites) | Pass `restoredTranslations` to `buildTranslationDictionary`, remove 200-segment cap |

---

## Chunk 1: Rewrite Dictionary Builder

### Task 1: Rewrite `buildTranslationDictionary` signature and implementation

**Files:**
- Modify: `apps/translate/src/recovery/dictionary-builder.ts`

- [ ] **Step 1: Write the new `buildTranslationDictionary` function**

Replace the entire file with this implementation. The new signature replaces `document` and `skipSelectors` with `translations`. The `translations` array is parallel to `segments` and `originalValues` — for deferred mode, entries may be `null` (cache miss).

```typescript
/**
 * Translation Dictionary Builder
 * Builds a dictionary of original → translated values for client-side recovery
 * Uses the translations array directly — no DOM traversal needed
 */

import type { Content } from '../types.js'
import { placeholdersToHtml } from '../dom/placeholders.js'

/**
 * Translation dictionary for client-side recovery
 * Contains mappings from original content to translated content
 */
export interface TranslationDictionary {
	/** Text node mappings: original textContent → translated textContent */
	text: Record<string, string>
	/** HTML block mappings: original textContent (stripped) → translated innerHTML */
	html: Record<string, string>
	/** Attribute mappings: original value → translated value */
	attrs: Record<string, string>
	/** Pathname mappings: original path → translated path */
	paths: Record<string, string>
	/** Target language code (e.g., 'es', 'fr') */
	targetLang: string
}

/**
 * Build a translation dictionary from segments, original values, and translations
 *
 * Maps original content → translated content for each segment where translation differs.
 * The client-side recovery script uses this dictionary to re-apply translations after
 * SPA framework hydration reverts them.
 *
 * @param segments - The extracted segments from the page
 * @param originalValues - The original segment values before translation
 * @param translations - The translated values (parallel array, null = cache miss/skip)
 * @param targetLang - The target language code
 * @param pathnameMap - Optional map of original → translated pathnames
 * @returns Translation dictionary for client-side use
 */
export function buildTranslationDictionary(
	segments: Content[],
	originalValues: string[],
	translations: (string | null)[],
	targetLang: string,
	pathnameMap?: Map<string, string>
): TranslationDictionary {
	const dictionary: TranslationDictionary = {
		text: {},
		html: {},
		attrs: {},
		paths: {},
		targetLang,
	}

	// Guard against mismatched arrays
	if (segments.length !== originalValues.length || segments.length !== translations.length) {
		console.warn('[Dictionary] Array length mismatch:', segments.length, 'vs', originalValues.length, 'vs', translations.length)
		return dictionary
	}

	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i]
		const originalValue = originalValues[i]
		const translation = translations[i]

		// Skip null translations (cache miss in deferred mode)
		if (translation === null || translation === undefined) {
			continue
		}

		// Skip if translation is same as original (no change occurred)
		if (originalValue.trim() === translation.trim()) {
			continue
		}

		const originalKey = originalValue.trim()

		switch (segment.kind) {
			case 'html':
				// For HTML segments, restore placeholders to get innerHTML
				if (segment.htmlMeta) {
					const restoredHtml = placeholdersToHtml(translation, segment.htmlMeta.replacements)
					const finalHtml = segment.ws
						? segment.ws.leading + restoredHtml + segment.ws.trailing
						: restoredHtml
					dictionary.html[originalKey] = finalHtml
				}
				break

			case 'text':
				dictionary.text[originalKey] = translation.trim()
				break

			case 'attr':
				dictionary.attrs[originalKey] = translation.trim()
				break
		}
	}

	// Build paths from pathnameMap
	if (pathnameMap) {
		for (const [original, translated] of pathnameMap) {
			if (original !== translated) {
				dictionary.paths[original] = translated
			}
		}
	}

	// Log dictionary size for monitoring
	const totalEntries = Object.keys(dictionary.text).length +
		Object.keys(dictionary.html).length +
		Object.keys(dictionary.attrs).length +
		Object.keys(dictionary.paths).length

	if (totalEntries > 0) {
		const jsonSize = JSON.stringify(dictionary).length
		if (jsonSize > 500000) {
			console.warn(`[Dictionary] Large dictionary size: ${Math.round(jsonSize / 1024)}KB`)
		}
	}

	return dictionary
}
```

- [ ] **Step 2: Verify file compiles**

Run: `npx tsc --noEmit --project apps/translate/tsconfig.json 2>&1 | head -20`

Expected: Type errors in pipeline.ts (old call sites) and test file (old signature). The dictionary-builder.ts itself should have no errors.

- [ ] **Step 3: Commit**

```bash
git add apps/translate/src/recovery/dictionary-builder.ts
git commit -m "refactor: rewrite dictionary builder to accept translations array directly

Eliminates O(n²) DOM traversal. The function now takes the translations
array as input instead of re-reading values from the DOM per segment.
Deletes ~170 lines of DOM traversal helper functions."
```

---

### Task 2: Update dictionary builder tests

**Files:**
- Modify: `apps/translate/src/recovery/dictionary-builder.test.ts`

The tests currently call `buildTranslationDictionary(document, segments, originalValues, skipSelectors, lang, pathnameMap)`. The new signature is `buildTranslationDictionary(segments, originalValues, translations, lang, pathnameMap)`. Tests no longer need to call `applyTranslations` first since we pass translations directly.

- [ ] **Step 1: Rewrite the test file**

```typescript
/**
 * Tests for Dictionary Builder
 */

import { describe, it, expect } from 'vitest'
import { parseHTMLDocument } from '../dom/parser.js'
import { extractSegments } from '../dom/extractor.js'
import { buildTranslationDictionary } from './dictionary-builder.js'

describe('buildTranslationDictionary', () => {
	describe('text node translations', () => {
		it('builds dictionary for simple text translations', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Hello</title></head>
					<body>
						<div>World</div>
					</body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)
			const translations = ['Hola', 'Mundo']

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

			expect(dictionary.targetLang).toBe('es')
			expect(dictionary.text['Hello']).toBe('Hola')
			expect(dictionary.text['World']).toBe('Mundo')
		})

		it('does not include unchanged text', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Hello</title></head>
					<body>
						<div>World</div>
					</body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)
			// Translations same as originals
			const translations = ['Hello', 'World']

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

			expect(Object.keys(dictionary.text).length).toBe(0)
		})
	})

	describe('HTML block translations', () => {
		it('builds dictionary for HTML blocks with inline elements', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body>
						<p>Hello <strong>world</strong></p>
					</body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)
			// segments[0] = title "Test", segments[1] = html "Hello [HB1]world[/HB1]"
			const translations = ['Prueba', 'Hola [HB1]mundo[/HB1]']

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

			expect(dictionary.targetLang).toBe('es')
			// HTML dict key is original placeholder text, value is restored innerHTML
			const htmlKey = originalValues[1] // "Hello [HB1]world[/HB1]"
			expect(dictionary.html[htmlKey]).toContain('mundo')
			expect(dictionary.html[htmlKey]).toContain('<strong>')
		})
	})

	describe('attribute translations', () => {
		it('builds dictionary for attribute translations', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body>
						<img src="test.jpg" alt="A cat" />
						<button title="Click me">Button</button>
					</body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)

			const translations = segments.map((s) => {
				if (s.value === 'A cat') return 'Un gato'
				if (s.value === 'Click me') return 'Haz clic'
				if (s.value === 'Button') return 'Boton'
				return s.value
			})

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

			expect(dictionary.attrs['A cat']).toBe('Un gato')
			expect(dictionary.attrs['Click me']).toBe('Haz clic')
		})
	})

	describe('deferred mode (null translations)', () => {
		it('skips null translations (cache misses)', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Hello</title></head>
					<body>
						<div>World</div>
						<div>Foo</div>
					</body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)
			// Second segment is a cache miss
			const translations: (string | null)[] = ['Hola', null, 'Bar']

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

			expect(dictionary.text['Hello']).toBe('Hola')
			expect(dictionary.text['World']).toBeUndefined()
			expect(dictionary.text['Foo']).toBe('Bar')
		})
	})

	describe('pathname translations', () => {
		it('returns empty paths when pathnameMap is undefined', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body><p>Content</p></body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)

			const dictionary = buildTranslationDictionary(segments, originalValues, originalValues, 'es')
			expect(dictionary.paths).toEqual({})
		})

		it('returns empty paths when pathnameMap is empty', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body><p>Content</p></body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)

			const dictionary = buildTranslationDictionary(segments, originalValues, originalValues, 'es', new Map())
			expect(dictionary.paths).toEqual({})
		})

		it('includes translated paths in dictionary', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body><p>Content</p></body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)

			const pathnameMap = new Map([
				['/about', '/acerca-de'],
				['/contact', '/contacto'],
			])
			const dictionary = buildTranslationDictionary(segments, originalValues, originalValues, 'es', pathnameMap)
			expect(dictionary.paths).toEqual({
				'/about': '/acerca-de',
				'/contact': '/contacto',
			})
		})

		it('excludes paths where original equals translated', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body><p>Content</p></body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)

			const pathnameMap = new Map([
				['/about', '/acerca-de'],
				['/api/v1', '/api/v1'],
			])
			const dictionary = buildTranslationDictionary(segments, originalValues, originalValues, 'es', pathnameMap)
			expect(dictionary.paths).toEqual({ '/about': '/acerca-de' })
		})
	})

	describe('edge cases', () => {
		it('handles mismatched array lengths gracefully', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body><p>Content</p></body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = ['wrong', 'length', 'array']
			const translations = ['a', 'b', 'c']

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

			expect(Object.keys(dictionary.text).length).toBe(0)
			expect(Object.keys(dictionary.html).length).toBe(0)
			expect(Object.keys(dictionary.attrs).length).toBe(0)
		})

		it('handles empty document', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head></head>
					<body></body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues: string[] = []
			const translations: string[] = []

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

			expect(dictionary.targetLang).toBe('es')
			expect(Object.keys(dictionary.text).length).toBe(0)
		})
	})
})
```

- [ ] **Step 2: Run tests to verify they pass**

Run: `pnpm test -- --run apps/translate/src/recovery/dictionary-builder.test.ts`
Expected: All 11 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/translate/src/recovery/dictionary-builder.test.ts
git commit -m "test: update dictionary builder tests for new translations-array API"
```

---

## Chunk 2: Update Pipeline Call Sites

### Task 3: Update deferred path call site (line ~649)

**Files:**
- Modify: `apps/translate/src/pipeline.ts:647-669`

At this call site, `restoredTranslations` is `(string | null)[]` and is in scope (defined ~line 512).

- [ ] **Step 1: Update the deferred path call site**

Replace lines 647-669:

```typescript
					// Inject SPA recovery assets if needed (with cached translations only)
					// Skip dictionary building for very large pages (O(n²) cost)
					if (detectSpaFramework(document) && appliedCount > 0 && extractedSegments.length <= 200) {
						const dictionary = buildTranslationDictionary(
							document,
							extractedSegments,
							originalValues,
							skipSelectors,
							targetLang,
							pathnameMap
						)
```

With:

```typescript
					// Inject SPA recovery assets if needed (with cached translations only)
					if (detectSpaFramework(document) && appliedCount > 0) {
						const dictionary = buildTranslationDictionary(
							extractedSegments,
							originalValues,
							restoredTranslations,
							targetLang,
							pathnameMap
						)
```

Note: The `extractedSegments.length <= 200` guard is removed — no longer needed since the function is O(n).

- [ ] **Step 2: Commit**

```bash
git add apps/translate/src/pipeline.ts
git commit -m "refactor: update deferred path to use new dictionary builder API"
```

---

### Task 4: Update sync path call site (line ~969)

**Files:**
- Modify: `apps/translate/src/pipeline.ts:966-990`

At this call site, `restoredTranslations` is `string[]` and is in scope (defined ~line 909).

- [ ] **Step 1: Update the sync path call site**

Replace lines 966-977:

```typescript
					// 16. Inject recovery assets for SPA frameworks (Next.js, Nuxt, etc.)
					// These frameworks may revert server-translated content during hydration
					// Skip dictionary building for very large pages (O(n²) cost)
					if (detectSpaFramework(document) && extractedSegments.length <= 200) {
						const dictionary = buildTranslationDictionary(
							document,
							extractedSegments,
							originalValues,
							skipSelectors,
							targetLang,
							pathnameMap
						)
```

With:

```typescript
					// 16. Inject recovery assets for SPA frameworks (Next.js, Nuxt, etc.)
					// These frameworks may revert server-translated content during hydration
					if (detectSpaFramework(document)) {
						const dictionary = buildTranslationDictionary(
							extractedSegments,
							originalValues,
							restoredTranslations,
							targetLang,
							pathnameMap
						)
```

- [ ] **Step 2: Run full test suite**

Run: `pnpm test -- --run`
Expected: All 279 tests pass.

- [ ] **Step 3: Commit**

```bash
git add apps/translate/src/pipeline.ts
git commit -m "refactor: update sync path to use new dictionary builder API

Both pipeline call sites now pass the translations array directly
to buildTranslationDictionary, eliminating all DOM re-traversal.
Removes the 200-segment cap since the function is now O(n)."
```

---

### Task 5: Verify build

- [ ] **Step 1: Build the translate app**

Run: `pnpm build:translate`
Expected: Build succeeds with no errors.

- [ ] **Step 2: Commit (if any build fixes needed)**

Only if build revealed issues not caught by tests.

Plan Name: 2026-03-12-dictionary-builder-optimization.md

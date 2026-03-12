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

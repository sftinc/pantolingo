/**
 * Derive a translation subdomain from a BCP 47 language code.
 *
 * Rules:
 * - Regional codes like "es-mx" → use base language "es"
 * - Script codes like "zh-hans" → keep full code "zh-hans"
 * - Detection: suffix length >= 4 chars indicates a script subtag
 *
 * @param langCode - BCP 47 language code (e.g., "es-mx", "zh-hans", "fr-fr")
 * @returns Subdomain prefix (e.g., "es", "zh-hans", "fr")
 */
export function deriveTranslationSubdomain(langCode: string): string {
	const lower = langCode.toLowerCase()
	const dashIndex = lower.indexOf('-')

	// No dash — already a base code
	if (dashIndex === -1) return lower

	const suffix = lower.slice(dashIndex + 1)

	// Script subtags are >= 4 chars (e.g., "hans", "hant", "latn")
	// Region subtags are 2 chars (e.g., "mx", "fr", "br")
	if (suffix.length >= 4) {
		return lower // keep full code for script subtags
	}

	return lower.slice(0, dashIndex) // use base for regional subtags
}

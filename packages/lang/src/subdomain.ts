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

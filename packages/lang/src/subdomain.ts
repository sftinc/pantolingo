/**
 * Derive a translation subdomain from a BCP 47 language code.
 *
 * Uses the full regional code (e.g., "es-mx", "fr-ca") so that
 * multiple regional variants of the same language can coexist
 * on different subdomains (es-mx.example.com, es-ar.example.com).
 *
 * @param langCode - BCP 47 language code (e.g., "es-mx", "zh-hans", "fr-fr")
 * @returns Subdomain prefix (e.g., "es-mx", "zh-hans", "fr-fr")
 */
export function deriveTranslationSubdomain(langCode: string): string {
	return langCode.toLowerCase()
}

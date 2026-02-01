/**
 * Redirect URL rewriting for the translation proxy
 * Rewrites Location headers from origin domain to translated domain
 */

/**
 * Rewrite redirect Location header from origin domain to translated domain
 * @param location - Original Location header value
 * @param translatedHost - The translated domain host (e.g., 'de.example' or 'localhost:8787')
 * @param originBase - The origin domain base URL (e.g., 'https://www.example.com')
 * @param currentUrl - Current request URL object
 * @returns Rewritten Location URL pointing to translated domain
 */
export function rewriteRedirectLocation(
	location: string,
	translatedHost: string,
	originBase: string,
	currentUrl: URL
): string {
	try {
		// Parse the Location header
		const locationUrl = new URL(location, originBase)

		// Build the rewritten URL using the translated host
		const protocol = currentUrl.protocol // http: or https:
		const rewritten = `${protocol}//${translatedHost}${locationUrl.pathname}${locationUrl.search}${locationUrl.hash}`

		return rewritten
	} catch (error) {
		// If parsing fails, return the original location
		console.error('Failed to rewrite redirect location:', error)
		return location
	}
}

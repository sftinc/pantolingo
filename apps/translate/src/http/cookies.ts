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

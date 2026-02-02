/**
 * Framework Detection Module
 * Detects SPA frameworks that cause hydration issues (Next.js, Nuxt, Gatsby, React)
 * Used to determine if recovery script injection is needed
 */

/**
 * Detect if the document is rendered by an SPA framework that may cause hydration issues
 *
 * Framework markers:
 * - Next.js: #__next container, __NEXT_DATA__ script, /_next/ in script sources
 * - Nuxt/Vue: #__nuxt container, [data-v-*] scoped style attributes
 * - Gatsby: #___gatsby container
 * - React: [data-reactroot] attribute
 *
 * @param document - The parsed HTML document
 * @returns true if an SPA framework is detected, false otherwise
 */
export function detectSpaFramework(document: Document): boolean {
	// Guard against invalid documents
	if (!document.documentElement) {
		return false
	}

	// Next.js detection
	if (document.getElementById('__next')) {
		return true
	}
	if (document.getElementById('__NEXT_DATA__')) {
		return true
	}

	// Check for /_next/ in script sources (Next.js bundles)
	const scripts = document.querySelectorAll('script[src]')
	for (let i = 0; i < scripts.length; i++) {
		const src = scripts[i].getAttribute('src')
		if (src && src.includes('/_next/')) {
			return true
		}
	}

	// Nuxt/Vue detection
	if (document.getElementById('__nuxt')) {
		return true
	}
	// Check for Vue scoped style attributes (data-v-*)
	if (document.querySelector('[data-v-]') || document.querySelector('[class*="data-v-"]')) {
		return true
	}
	// More thorough Vue detection - check for any data-v-* attribute
	const allElements = document.querySelectorAll('*')
	for (let i = 0; i < allElements.length; i++) {
		const attrs = allElements[i].attributes
		if (attrs) {
			for (let j = 0; j < attrs.length; j++) {
				if (attrs[j].name.startsWith('data-v-')) {
					return true
				}
			}
		}
	}

	// Gatsby detection
	if (document.getElementById('___gatsby')) {
		return true
	}

	// Generic React detection
	if (document.querySelector('[data-reactroot]')) {
		return true
	}

	return false
}

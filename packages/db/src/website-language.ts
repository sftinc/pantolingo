/**
 * Website language configuration queries
 * Looks up language config (hostname → target_lang) from the website_language table
 */

import { pool } from './pool.js'

/**
 * Website language configuration from database
 * Matches structure needed by the translate app pipeline
 */
export interface WebsiteLanguageConfig {
	websiteLanguageId: number
	websiteId: number // website.id - used for translation lookups
	websiteHostname: string // website.hostname
	sourceLang: string // website.source_lang
	targetLang: string // website_language.target_lang
	skipWords: string[]
	skipPath: (string | RegExp)[]
	skipSelectors: string[] // CSS selectors for elements to skip during translation
	translatePath: boolean
	cacheDisabledUntil: Date | null // website.cache_disabled_until - dev override for caching
}

// In-memory cache for hot path (website language config rarely changes)
const websiteLanguageCache = new Map<string, { config: WebsiteLanguageConfig | null; expiresAt: number }>()
const WEBSITE_LANGUAGE_CACHE_TTL = 60_000 // 60 seconds

/**
 * Parse skip_path array from database format
 * Database stores: ['includes:/api/', 'regex:^/admin']
 * Returns: ['/api/', /^\/admin/]
 */
function parseSkipPath(dbArray: string[] | null): (string | RegExp)[] {
	if (!dbArray || dbArray.length === 0) return []

	return dbArray
		.map((pattern) => {
			if (pattern.startsWith('regex:')) {
				try {
					return new RegExp(pattern.slice(6))
				} catch {
					return null // Skip invalid patterns
				}
			} else if (pattern.startsWith('includes:')) {
				return pattern.slice(9)
			}
			// Plain string (legacy format)
			return pattern
		})
		.filter((p): p is string | RegExp => p !== null)
}

/**
 * Get website language configuration by hostname
 * Uses in-memory cache to avoid DB hit on every request
 *
 * @param hostname - Request hostname (e.g., 'es.esnipe.com')
 * @returns WebsiteLanguageConfig or null if not found/disabled
 *
 * SQL: 1 query (website_language JOIN website)
 */
export async function getWebsiteLanguageConfig(hostname: string): Promise<WebsiteLanguageConfig | null> {
	// Check in-memory cache first
	const now = Date.now()
	const cached = websiteLanguageCache.get(hostname)
	if (cached && cached.expiresAt > now) {
		return cached.config
	}

	try {
		const result = await pool.query<{
			website_language_id: number
			website_id: number
			target_lang: string
			skip_words: string[] | null
			skip_path: string[] | null
			skip_selectors: string[] | null
			translate_path: boolean | null
			cache_disabled_until: Date | null
			website_hostname: string
			source_lang: string
		}>(
			`SELECT
				wl.id AS website_language_id,
				wl.website_id,
				wl.target_lang,
				w.skip_words,
				w.skip_path,
				w.skip_selectors,
				w.translate_path,
				w.cache_disabled_until,
				w.hostname AS website_hostname,
				w.source_lang
			FROM website_language wl
			JOIN website w ON w.id = wl.website_id
			WHERE wl.hostname = $1 AND wl.enabled = TRUE`,
			[hostname]
		)

		if (result.rows.length === 0) {
			// Cache the miss too (prevents repeated queries for unknown hostnames)
			websiteLanguageCache.set(hostname, { config: null, expiresAt: now + WEBSITE_LANGUAGE_CACHE_TTL })
			return null
		}

		const row = result.rows[0]
		const config: WebsiteLanguageConfig = {
			websiteLanguageId: row.website_language_id,
			websiteId: row.website_id,
			websiteHostname: row.website_hostname,
			sourceLang: row.source_lang,
			targetLang: row.target_lang,
			skipWords: row.skip_words || [],
			skipPath: parseSkipPath(row.skip_path),
			skipSelectors: row.skip_selectors || [],
			translatePath: row.translate_path ?? true,
			cacheDisabledUntil: row.cache_disabled_until,
		}

		// Cache the result
		websiteLanguageCache.set(hostname, { config, expiresAt: now + WEBSITE_LANGUAGE_CACHE_TTL })
		return config
	} catch (error) {
		console.error('DB website language config lookup failed:', error)
		return null // Fail open
	}
}

/**
 * Clear website language config cache
 * Useful for testing or after config changes
 */
export function clearWebsiteLanguageCache(): void {
	websiteLanguageCache.clear()
}

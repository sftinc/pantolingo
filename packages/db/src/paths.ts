/**
 * Pathname mapping queries
 * Batch operations for bidirectional URL lookup
 *
 * Uses normalized schema:
 * - website_path: source paths stored once per website
 * - translated_path: path translations scoped to website + lang
 */

import { pool } from './pool.js'

/**
 * Get website_path_id for a specific path
 * Used as fallback when batchUpsertPathnames doesn't return IDs (path already existed)
 *
 * @param websiteId - Website ID
 * @param path - Normalized path
 * @returns website_path_id or null if not found
 */
export async function getWebsitePathId(websiteId: number, path: string): Promise<number | null> {
	try {
		const result = await pool.query<{ id: number }>(
			`SELECT id FROM website_path WHERE website_id = $1 AND path = $2`,
			[websiteId, path]
		)
		return result.rows[0]?.id ?? null
	} catch (error) {
		console.error('DB getWebsitePathId failed:', error)
		return null
	}
}

/**
 * Pathname mapping result
 */
export interface PathnameResult {
	websitePathId: number
	originalPath: string
	translatedPath: string
}

/**
 * Pathname mapping for batch upsert
 */
export interface PathnameMapping {
	original: string
	translated: string
}

/**
 * Path IDs returned from batch upsert
 * Contains both website and translated IDs for junction table linking
 */
export interface PathIds {
	websitePathId: number
	translatedPathId: number
}

/**
 * Bidirectional pathname lookup
 * Looks up by BOTH path (forward) and translated_path (reverse)
 *
 * @param websiteId - Website ID
 * @param lang - Target language code
 * @param pathname - Incoming pathname (could be original or translated)
 * @returns { originalPath, translatedPath } or null if not found
 *
 * SQL: 1 query joining website_path -> translated_path
 */
export async function lookupPathname(
	websiteId: number,
	lang: string,
	pathname: string
): Promise<PathnameResult | null> {
	try {
		const result = await pool.query<{
			id: number
			path: string
			translated_path: string
		}>(
			`SELECT wp.id, wp.path, tp.translated_path
			FROM website_path wp
			JOIN translated_path tp ON tp.website_path_id = wp.id
			WHERE wp.website_id = $1
			  AND tp.lang = $2
			  AND (wp.path = $3 OR tp.translated_path = $3)
			LIMIT 1`,
			[websiteId, lang, pathname]
		)

		if (result.rows.length === 0) {
			return null
		}

		const row = result.rows[0]
		return {
			websitePathId: row.id,
			originalPath: row.path,
			translatedPath: row.translated_path,
		}
	} catch (error) {
		console.error('DB pathname lookup failed:', error)
		return null // Fail open
	}
}

/**
 * Batch lookup pathnames for link rewriting
 * Returns map of original path -> translated path
 *
 * @param websiteId - Website ID
 * @param lang - Target language code
 * @param paths - Array of original paths to look up
 * @returns Map<originalPath, translatedPath>
 *
 * SQL: 1 query joining website_path -> translated_path
 */
export async function batchLookupPathnames(
	websiteId: number,
	lang: string,
	paths: string[]
): Promise<Map<string, string>> {
	if (paths.length === 0) {
		return new Map()
	}

	try {
		const result = await pool.query<{
			path: string
			translated_path: string
		}>(
			`SELECT wp.path, tp.translated_path
			FROM website_path wp
			JOIN translated_path tp ON tp.website_path_id = wp.id
			WHERE wp.website_id = $1
			  AND tp.lang = $2
			  AND wp.path = ANY($3::text[])`,
			[websiteId, lang, paths]
		)

		const pathMap = new Map<string, string>()
		for (const row of result.rows) {
			pathMap.set(row.path, row.translated_path)
		}

		return pathMap
	} catch (error) {
		console.error('DB pathname batch lookup failed:', error)
		return new Map() // Fail open
	}
}

/**
 * Batch insert/update pathname mappings
 * Two-step upsert: website_path first, then translated_path
 * Increments hit_count on conflict
 *
 * @param websiteId - Website ID
 * @param lang - Target language code
 * @param mappings - Array of { original, translated } pairs
 * @returns Map of path -> { websitePathId, translatedPathId }
 *
 * SQL: 2 queries - one for website_path, one for translated_path
 */
export async function batchUpsertPathnames(
	websiteId: number,
	lang: string,
	mappings: PathnameMapping[]
): Promise<Map<string, PathIds>> {
	if (mappings.length === 0) {
		return new Map()
	}

	try {
		// Deduplicate by original path (last one wins)
		const uniqueMap = new Map<string, PathnameMapping>()
		for (const m of mappings) {
			uniqueMap.set(m.original, m)
		}
		const uniqueMappings = Array.from(uniqueMap.values())

		// Prepare parallel arrays for UNNEST
		const originals: string[] = []
		const translated: string[] = []

		for (const m of uniqueMappings) {
			originals.push(m.original)
			translated.push(m.translated)
		}

		// Step 1: Upsert website_path (source paths)
		await pool.query(
			`INSERT INTO website_path (website_id, path)
			SELECT $1, unnest($2::text[])
			ON CONFLICT (website_id, path) DO NOTHING`,
			[websiteId, originals]
		)

		// Step 2: Upsert translated_path (translations)
		const result = await pool.query<{ id: number; website_path_id: number; path: string }>(
			`INSERT INTO translated_path (website_path_id, lang, translated_path)
			SELECT wp.id, $2, t.translated
			FROM unnest($3::text[], $4::text[]) AS t(original, translated)
			JOIN website_path wp ON wp.website_id = $1 AND wp.path = t.original
			ON CONFLICT (website_path_id, lang)
			DO NOTHING
			RETURNING id, website_path_id, (SELECT path FROM website_path WHERE id = website_path_id) AS path`,
			[websiteId, lang, originals, translated]
		)

		// Return map: path -> { websitePathId, translatedPathId }
		const idMap = new Map<string, PathIds>()
		for (const row of result.rows) {
			idMap.set(row.path, {
				websitePathId: row.website_path_id,
				translatedPathId: row.id,
			})
		}
		return idMap
	} catch (error) {
		console.error('DB pathname batch upsert failed:', error)
		return new Map() // Fail open
	}
}

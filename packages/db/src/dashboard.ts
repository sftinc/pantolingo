/**
 * Dashboard queries for the www app
 * Provides aggregated stats and CRUD operations for websites, languages, segments, and paths
 */

import crypto from 'crypto'
import { pool } from './pool.js'

// =============================================================================
// Types
// =============================================================================

export interface AccountProfile {
	firstName: string | null
	lastName: string | null
	email: string
}

export interface WebsiteWithStats {
	id: number
	publicCode: string
	hostname: string
	name: string
	sourceLang: string
	langCount: number
	segmentCount: number
	pathCount: number
}

export interface LangWithStats {
	targetLang: string
	translatedSegmentCount: number
	translatedPathCount: number
	unreviewedSegmentCount: number
	unreviewedPathCount: number
	totalWordCount: number
	unreviewedWordCount: number
}

export interface SegmentWithTranslation {
	id: number
	websiteSegmentId: number
	text: string
	translatedText: string | null
	reviewedAt: Date | null
}

export interface PathWithTranslation {
	id: number
	websitePathId: number
	path: string
	translatedPath: string | null
	reviewedAt: Date | null
}

export interface PaginatedResult<T> {
	items: T[]
	total: number
	page: number
	limit: number
	totalPages: number
}

export interface Website {
	id: number
	publicCode: string
	hostname: string
	name: string
	sourceLang: string
}

export interface WebsiteWithSettings extends Website {
	skipWords: string[]
	skipPath: string[]
	skipSelectors: string[]
	translatePath: boolean
	cacheDisabledRemaining: number | null
}

export interface PathOption {
	id: number
	path: string
}

// Changelog types for tracking translation edits
export type ChangelogType = 'segment' | 'path' | 'setting'

export interface ChangelogItem {
	table: string
	pk: Record<string, unknown> // flexible for composite keys
	columns: Record<string, { old: unknown; new: unknown }>
}

export type ChangelogChange = ChangelogItem[]

// =============================================================================
// Authorization
// =============================================================================

/**
 * Check if an account can access a website
 * @param accountId - Account ID
 * @param websiteId - Website ID
 * @returns true if the account has access via account_website
 */
export async function canAccessWebsite(accountId: number, websiteId: number): Promise<boolean> {
	const result = await pool.query(
		`SELECT 1 FROM account_website WHERE website_id = $1 AND account_id = $2 LIMIT 1`,
		[websiteId, accountId]
	)
	return (result.rowCount ?? 0) > 0
}

// =============================================================================
// Read Queries
// =============================================================================

/**
 * Get websites with aggregated stats for the overview page
 * @param accountId - Filter to websites the account has access to via account_website
 */
export async function getWebsitesWithStats(accountId: number): Promise<WebsiteWithStats[]> {
	const result = await pool.query<{
		id: number
		public_code: string
		hostname: string
		name: string
		source_lang: string
		lang_count: string
		segment_count: string
		path_count: string
	}>(
		`
		SELECT
			w.id,
			w.public_code,
			w.hostname,
			w.name,
			w.source_lang,
			(SELECT COUNT(DISTINCT target_lang) FROM translation t WHERE t.website_id = w.id) as lang_count,
			(SELECT COUNT(*) FROM translation_segment ts JOIN website_segment ws ON ws.id = ts.website_segment_id WHERE ws.website_id = w.id) as segment_count,
			(SELECT COUNT(*) FROM translation_path tp JOIN website_path wp ON wp.id = tp.website_path_id WHERE wp.website_id = w.id AND EXISTS (SELECT 1 FROM website_path_segment wps WHERE wps.website_path_id = wp.id)) as path_count
		FROM account_website aw
		JOIN website w ON w.id = aw.website_id
		WHERE aw.account_id = $1
		ORDER BY w.hostname
	`,
		[accountId]
	)

	return result.rows.map((row) => ({
		id: row.id,
		publicCode: row.public_code,
		hostname: row.hostname,
		name: row.name,
		sourceLang: row.source_lang,
		langCount: parseInt(row.lang_count, 10),
		segmentCount: parseInt(row.segment_count, 10),
		pathCount: parseInt(row.path_count, 10),
	}))
}

/**
 * Get a single website by public_code
 * Note: Authorization should be checked separately with canAccessWebsiteByPublicCode()
 * @param publicCode - 16-character hex public code
 */
export async function getWebsiteByPublicCode(publicCode: string): Promise<WebsiteWithSettings | null> {
	const result = await pool.query<{
		id: number
		public_code: string
		hostname: string
		name: string
		source_lang: string
		skip_words: string[] | null
		skip_path: string[] | null
		skip_selectors: string[] | null
		translate_path: boolean | null
		cache_disabled_remaining: string | null
	}>(
		`SELECT id, public_code, hostname, name, source_lang, skip_words, skip_path, skip_selectors, translate_path,
		        EXTRACT(EPOCH FROM GREATEST(cache_disabled_until - NOW(), INTERVAL '0')) AS cache_disabled_remaining
		 FROM website WHERE public_code = $1`,
		[publicCode]
	)

	if (result.rows.length === 0) return null

	const row = result.rows[0]
	const remaining = row.cache_disabled_remaining ? Math.round(parseFloat(row.cache_disabled_remaining)) : null
	return {
		id: row.id,
		publicCode: row.public_code,
		hostname: row.hostname,
		name: row.name,
		sourceLang: row.source_lang,
		skipWords: row.skip_words || [],
		skipPath: row.skip_path || [],
		skipSelectors: row.skip_selectors || [],
		translatePath: row.translate_path ?? true,
		cacheDisabledRemaining: remaining && remaining > 0 ? remaining : null,
	}
}

/**
 * Check if an account can access a website by public_code
 * @param accountId - Account ID
 * @param publicCode - 16-character hex public code
 * @returns { websiteId, role } if the account has access, null otherwise
 */
export async function canAccessWebsiteByPublicCode(accountId: number, publicCode: string): Promise<{ websiteId: number; role: string } | null> {
	const result = await pool.query<{ website_id: number; role: string }>(
		`SELECT aw.website_id, aw.role
		 FROM account_website aw
		 JOIN website w ON w.id = aw.website_id
		 WHERE w.public_code = $1 AND aw.account_id = $2
		 LIMIT 1`,
		[publicCode, accountId]
	)
	if (!result.rows[0]) return null
	return { websiteId: result.rows[0].website_id, role: result.rows[0].role }
}

/**
 * Get all languages for a website with translation stats
 * Uses CTEs to scan translated_segment and translated_path once each instead of per-language
 */
export async function getLangsForWebsite(websiteId: number): Promise<LangWithStats[]> {
	const result = await pool.query<{
		target_lang: string
		translated_segment_count: string
		translated_path_count: string
		unreviewed_segment_count: string
		unreviewed_path_count: string
		total_word_count: string
		unreviewed_word_count: string
	}>(
		`
		WITH segment_stats AS (
			SELECT ts.lang,
				COUNT(*) as total,
				COUNT(*) FILTER (WHERE ts.reviewed_at IS NULL) as unreviewed,
				COALESCE(SUM(ts.word_count), 0) as total_words,
				COALESCE(SUM(ts.word_count) FILTER (WHERE ts.reviewed_at IS NULL), 0) as unreviewed_words
			FROM translation_segment ts
			JOIN website_segment ws ON ws.id = ts.website_segment_id
			WHERE ws.website_id = $1
			GROUP BY ts.lang
		),
		path_stats AS (
			SELECT tp.lang,
				COUNT(*) as total,
				COUNT(*) FILTER (WHERE tp.reviewed_at IS NULL) as unreviewed,
				COALESCE(SUM(tp.word_count), 0) as total_words,
				COALESCE(SUM(tp.word_count) FILTER (WHERE tp.reviewed_at IS NULL), 0) as unreviewed_words
			FROM translation_path tp
			JOIN website_path wp ON wp.id = tp.website_path_id
			WHERE wp.website_id = $1 AND EXISTS (SELECT 1 FROM website_path_segment wps WHERE wps.website_path_id = wp.id)
			GROUP BY tp.lang
		)
		SELECT DISTINCT
			t.target_lang,
			COALESCE(ss.total, 0) as translated_segment_count,
			COALESCE(ps.total, 0) as translated_path_count,
			COALESCE(ss.unreviewed, 0) as unreviewed_segment_count,
			COALESCE(ps.unreviewed, 0) as unreviewed_path_count,
			COALESCE(ss.total_words, 0) + COALESCE(ps.total_words, 0) as total_word_count,
			COALESCE(ss.unreviewed_words, 0) + COALESCE(ps.unreviewed_words, 0) as unreviewed_word_count
		FROM translation t
		LEFT JOIN segment_stats ss ON ss.lang = t.target_lang
		LEFT JOIN path_stats ps ON ps.lang = t.target_lang
		WHERE t.website_id = $1
		ORDER BY t.target_lang
	`,
		[websiteId]
	)

	return result.rows.map((row) => ({
		targetLang: row.target_lang,
		translatedSegmentCount: parseInt(row.translated_segment_count, 10),
		translatedPathCount: parseInt(row.translated_path_count, 10),
		unreviewedSegmentCount: parseInt(row.unreviewed_segment_count, 10),
		unreviewedPathCount: parseInt(row.unreviewed_path_count, 10),
		totalWordCount: parseInt(row.total_word_count, 10),
		unreviewedWordCount: parseInt(row.unreviewed_word_count, 10),
	}))
}

/**
 * Check if a language exists for a website (for route validation)
 */
export async function isValidLangForWebsite(websiteId: number, lang: string): Promise<boolean> {
	const result = await pool.query<{ exists: boolean }>(
		'SELECT EXISTS(SELECT 1 FROM translation WHERE website_id = $1 AND target_lang = $2) as exists',
		[websiteId, lang]
	)
	return result.rows[0]?.exists ?? false
}

/**
 * Get all paths for a website (for path filter dropdown)
 * Only returns paths that have at least one segment linked
 */
export async function getPathsForWebsite(websiteId: number): Promise<PathOption[]> {
	const result = await pool.query<{ id: number; path: string }>(
		`SELECT wp.id, wp.path FROM website_path wp
		WHERE wp.website_id = $1
		  AND EXISTS (SELECT 1 FROM website_path_segment wps WHERE wps.website_path_id = wp.id)
		ORDER BY wp.path`,
		[websiteId]
	)
	return result.rows
}

/**
 * Get segments for a website/language with pagination and filtering
 * @param websiteId - Website ID
 * @param lang - Target language code
 * @param filter - 'unreviewed' (translated but not reviewed) or 'all'
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @param pathId - Optional path filter: undefined = all, 'none' = orphans, number = specific path
 */
export async function getSegmentsForLang(
	websiteId: number,
	lang: string,
	filter: 'unreviewed' | 'all',
	page: number,
	limit: number,
	pathId?: number | 'none'
): Promise<PaginatedResult<SegmentWithTranslation>> {
	const offset = (page - 1) * limit

	// Build query parts based on filters
	let fromClause = 'FROM website_segment ws'
	let whereClause = 'WHERE ws.website_id = $1'
	const params: (number | string)[] = [websiteId, lang]

	// Path filter
	if (typeof pathId === 'number') {
		// Filter to segments on a specific path
		fromClause += ' INNER JOIN website_path_segment wps ON wps.website_segment_id = ws.id'
		whereClause += ` AND wps.website_path_id = $${params.length + 1}`
		params.push(pathId)
	} else if (pathId === 'none') {
		// Filter to orphan segments (no path association)
		whereClause += ' AND NOT EXISTS (SELECT 1 FROM website_path_segment wps WHERE wps.website_segment_id = ws.id)'
	}

	// Review filter
	if (filter === 'unreviewed') {
		whereClause += ' AND ts.id IS NOT NULL AND ts.reviewed_at IS NULL'
	}

	// Get total count
	const countResult = await pool.query<{ count: string }>(
		`
		SELECT COUNT(*) as count
		${fromClause}
		LEFT JOIN translation_segment ts ON ts.website_segment_id = ws.id AND ts.lang = $2
		${whereClause}
	`,
		params
	)
	const total = parseInt(countResult.rows[0].count, 10)

	// Get paginated items
	const itemsResult = await pool.query<{
		id: number
		website_segment_id: number
		text: string
		translated_text: string | null
		reviewed_at: Date | null
	}>(
		`
		SELECT
			COALESCE(ts.id, 0) as id,
			ws.id as website_segment_id,
			ws.text,
			ts.translated_text,
			ts.reviewed_at
		${fromClause}
		LEFT JOIN translation_segment ts ON ts.website_segment_id = ws.id AND ts.lang = $2
		${whereClause}
		ORDER BY ws.id
		LIMIT $${params.length + 1} OFFSET $${params.length + 2}
	`,
		[...params, limit, offset]
	)

	return {
		items: itemsResult.rows.map((row) => ({
			id: row.id,
			websiteSegmentId: row.website_segment_id,
			text: row.text,
			translatedText: row.translated_text,
			reviewedAt: row.reviewed_at,
		})),
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit),
	}
}

/**
 * Get paths for a website/language with pagination and filtering
 * @param websiteId - Website ID
 * @param lang - Target language code
 * @param filter - 'unreviewed' (translated but not reviewed) or 'all'
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 */
export async function getPathsForLang(
	websiteId: number,
	lang: string,
	filter: 'unreviewed' | 'all',
	page: number,
	limit: number
): Promise<PaginatedResult<PathWithTranslation>> {
	const offset = (page - 1) * limit

	// Build query based on filter
	let whereClause = 'WHERE wp.website_id = $1 AND EXISTS (SELECT 1 FROM website_path_segment wps WHERE wps.website_path_id = wp.id)'
	if (filter === 'unreviewed') {
		whereClause += ' AND tp.id IS NOT NULL AND tp.reviewed_at IS NULL'
	}

	// Get total count
	const countResult = await pool.query<{ count: string }>(
		`
		SELECT COUNT(*) as count
		FROM website_path wp
		LEFT JOIN translation_path tp ON tp.website_path_id = wp.id AND tp.lang = $2
		${whereClause}
	`,
		[websiteId, lang]
	)
	const total = parseInt(countResult.rows[0].count, 10)

	// Get paginated items
	const itemsResult = await pool.query<{
		id: number
		website_path_id: number
		path: string
		translated_path: string | null
		reviewed_at: Date | null
	}>(
		`
		SELECT
			COALESCE(tp.id, 0) as id,
			wp.id as website_path_id,
			wp.path,
			tp.translated_path,
			tp.reviewed_at
		FROM website_path wp
		LEFT JOIN translation_path tp ON tp.website_path_id = wp.id AND tp.lang = $2
		${whereClause}
		ORDER BY wp.path ASC
		LIMIT $3 OFFSET $4
	`,
		[websiteId, lang, limit, offset]
	)

	return {
		items: itemsResult.rows.map((row) => ({
			id: row.id,
			websitePathId: row.website_path_id,
			path: row.path,
			translatedPath: row.translated_path,
			reviewedAt: row.reviewed_at,
		})),
		total,
		page,
		limit,
		totalPages: Math.ceil(total / limit),
	}
}

// =============================================================================
// Activity Tracking
// =============================================================================

/**
 * Update website activity for the current user.
 * Always updates last_viewed_at. Optionally updates last_lang if langCd is provided.
 * Called from each page (not layout) so pages can pass the resolved langCd.
 */
export async function updateWebsiteActivity(
	accountId: number,
	websiteId: number,
	langCd?: string
): Promise<void> {
	if (langCd) {
		await pool.query(
			`UPDATE account_website
			 SET last_viewed_at = NOW(), last_lang = $3
			 WHERE account_id = $1 AND website_id = $2`,
			[accountId, websiteId, langCd]
		)
	} else {
		await pool.query(
			`UPDATE account_website
			 SET last_viewed_at = NOW()
			 WHERE account_id = $1 AND website_id = $2`,
			[accountId, websiteId]
		)
	}
}

/**
 * Get the last_lang for an account's website.
 * Used by segments/paths pages to default to last-used language.
 * @returns language code or null
 */
export async function getLastLang(accountId: number, websiteId: number): Promise<string | null> {
	const result = await pool.query<{ last_lang: string | null }>(
		`SELECT last_lang FROM account_website WHERE account_id = $1 AND website_id = $2`,
		[accountId, websiteId]
	)
	return result.rows[0]?.last_lang ?? null
}

/**
 * Get the most recently viewed website's publicCode for an account.
 * Used by the smart /account router to redirect to the last-used website.
 * @returns publicCode or null if no websites
 */
export async function getMostRecentWebsite(accountId: number): Promise<string | null> {
	const result = await pool.query<{ public_code: string }>(
		`SELECT w.public_code
		 FROM account_website aw
		 JOIN website w ON w.id = aw.website_id
		 WHERE aw.account_id = $1
		 ORDER BY aw.last_viewed_at DESC NULLS LAST, w.hostname ASC
		 LIMIT 1`,
		[accountId]
	)
	return result.rows[0]?.public_code ?? null
}

// =============================================================================
// Write Queries
// =============================================================================

/**
 * Update a segment translation
 * Note: Authorization should be checked separately with canAccessWebsite()
 * @param websiteId - Website ID (for website-segment binding validation)
 * @param websiteSegmentId - Website segment ID
 * @param lang - Target language code
 * @param translatedText - Translation text
 * @param reviewed - Optional: true=mark reviewed, false=unmark, null/undefined=no change
 * @param accountId - Account ID for activity tracking
 * @returns Success status - mutation only succeeds if segment belongs to claimed website
 */
export async function updateSegmentTranslation(
	websiteId: number,
	websiteSegmentId: number,
	lang: string,
	translatedText: string,
	reviewed: boolean | null | undefined,
	accountId: number
): Promise<{ success: boolean; error?: string }> {
	const client = await pool.connect()
	try {
		await client.query('BEGIN')

		// Get current translation state
		const selectResult = await client.query<{
			id: number
			translated_text: string | null
			reviewed_at: Date | null
		}>(
			`SELECT ts.id, ts.translated_text, ts.reviewed_at
			 FROM translation_segment ts
			 JOIN website_segment ws ON ws.id = ts.website_segment_id
			 WHERE ts.website_segment_id = $1
			   AND ts.lang = $2
			   AND ws.website_id = $3`,
			[websiteSegmentId, lang, websiteId]
		)

		const row = selectResult.rows[0]
		if (!row) {
			await client.query('ROLLBACK')
			return { success: false, error: 'Segment not found' }
		}

		const translationSegmentId = row.id
		const previousText = row.translated_text ?? ''
		const wasReviewed = row.reviewed_at !== null

		const textChanged = previousText !== translatedText
		const reviewedChanged = reviewed !== null && reviewed !== undefined && reviewed !== wasReviewed

		// Update the translation
		await client.query(
			`UPDATE translation_segment ts
			 SET translated_text = $4,
			     updated_at = NOW(),
			     reviewed_at = CASE
			       WHEN $5::boolean IS NULL THEN reviewed_at
			       WHEN $5 = true THEN NOW()
			       ELSE NULL
			     END
			 FROM website_segment ws
			 WHERE ts.website_segment_id = $2
			   AND ts.lang = $3
			   AND ws.id = ts.website_segment_id
			   AND ws.website_id = $1`,
			[websiteId, websiteSegmentId, lang, translatedText, reviewed]
		)

		// Insert changelog record if text or reviewed changed
		if ((textChanged || reviewedChanged) && translationSegmentId) {
			const change: ChangelogChange = [
				{
					table: 'translation_segment',
					pk: { id: translationSegmentId },
					columns: {},
				},
			]
			if (textChanged) {
				change[0].columns.translated_text = { old: previousText, new: translatedText }
			}
			if (reviewedChanged) {
				change[0].columns.reviewed = { old: wasReviewed, new: reviewed as boolean }
			}
			await client.query(
				`INSERT INTO changelog (website_id, account_id, type, change)
				 VALUES ($1, $2, $3, $4)`,
				[websiteId, accountId, 'segment', JSON.stringify(change)]
			)
		}

		await client.query('COMMIT')
		return { success: true }
	} catch (error) {
		await client.query('ROLLBACK')
		console.error('Failed to update segment translation:', error)
		return { success: false, error: 'Failed to update translation' }
	} finally {
		client.release()
	}
}

/**
 * Update a path translation
 * Note: Authorization should be checked separately with canAccessWebsite()
 * @param websiteId - Website ID (for website-path binding validation)
 * @param websitePathId - Website path ID
 * @param lang - Target language code
 * @param translatedPath - Translated path
 * @param reviewed - Optional: true=mark reviewed, false=unmark, null/undefined=no change
 * @param accountId - Account ID for activity tracking
 * @returns Success status - mutation only succeeds if path belongs to claimed website
 */
export async function updatePathTranslation(
	websiteId: number,
	websitePathId: number,
	lang: string,
	translatedPath: string,
	reviewed: boolean | null | undefined,
	accountId: number
): Promise<{ success: boolean; error?: string }> {
	const client = await pool.connect()
	try {
		await client.query('BEGIN')

		// Get current translation state
		const selectResult = await client.query<{
			id: number
			translated_path: string | null
			reviewed_at: Date | null
		}>(
			`SELECT tp.id, tp.translated_path, tp.reviewed_at
			 FROM translation_path tp
			 JOIN website_path wp ON wp.id = tp.website_path_id
			 WHERE tp.website_path_id = $1
			   AND tp.lang = $2
			   AND wp.website_id = $3`,
			[websitePathId, lang, websiteId]
		)

		const row = selectResult.rows[0]
		if (!row) {
			await client.query('ROLLBACK')
			return { success: false, error: 'Path not found' }
		}

		const translationPathId = row.id
		const previousPath = row.translated_path ?? ''
		const wasReviewed = row.reviewed_at !== null

		const textChanged = previousPath !== translatedPath
		const reviewedChanged = reviewed !== null && reviewed !== undefined && reviewed !== wasReviewed

		// Update the translation
		await client.query(
			`UPDATE translation_path tp
			 SET translated_path = $4,
			     updated_at = NOW(),
			     reviewed_at = CASE
			       WHEN $5::boolean IS NULL THEN reviewed_at
			       WHEN $5 = true THEN NOW()
			       ELSE NULL
			     END
			 FROM website_path wp
			 WHERE tp.website_path_id = $2
			   AND tp.lang = $3
			   AND wp.id = tp.website_path_id
			   AND wp.website_id = $1`,
			[websiteId, websitePathId, lang, translatedPath, reviewed]
		)

		// Insert changelog record if text or reviewed changed
		if ((textChanged || reviewedChanged) && translationPathId) {
			const change: ChangelogChange = [
				{
					table: 'translation_path',
					pk: { id: translationPathId },
					columns: {},
				},
			]
			if (textChanged) {
				change[0].columns.translated_path = { old: previousPath, new: translatedPath }
			}
			if (reviewedChanged) {
				change[0].columns.reviewed = { old: wasReviewed, new: reviewed as boolean }
			}
			await client.query(
				`INSERT INTO changelog (website_id, account_id, type, change)
				 VALUES ($1, $2, $3, $4)`,
				[websiteId, accountId, 'path', JSON.stringify(change)]
			)
		}

		await client.query('COMMIT')
		return { success: true }
	} catch (error) {
		await client.query('ROLLBACK')
		console.error('Failed to update path translation:', error)
		return { success: false, error: 'Failed to update translation' }
	} finally {
		client.release()
	}
}

/**
 * Update website settings
 * Note: Authorization should be checked separately with canAccessWebsite()
 * @param websiteId - Website ID
 * @param settings - Settings to update (skipWords, skipPath, translatePath)
 * @returns Success status
 */
export async function updateWebsiteSettings(
	websiteId: number,
	settings: {
		name: string
		sourceLang: string
		skipWords: string[]
		skipPath: string[]
		skipSelectors: string[]
		translatePath: boolean
	}
): Promise<{ success: boolean; error?: string }> {
	try {
		await pool.query(
			`UPDATE website
			 SET name = $2,
			     source_lang = $3,
			     skip_words = $4,
			     skip_path = $5,
			     skip_selectors = $6,
			     translate_path = $7,
			     updated_at = NOW()
			 WHERE id = $1`,
			[websiteId, settings.name, settings.sourceLang, settings.skipWords, settings.skipPath, settings.skipSelectors, settings.translatePath]
		)
		return { success: true }
	} catch (error) {
		console.error('Failed to update website settings:', error)
		return { success: false, error: 'Failed to update settings' }
	}
}

/**
 * Create a new website and link it to an account as owner
 * @param accountId - Account ID of the owner
 * @param name - Display name for the website
 * @param hostname - Hostname (e.g., "example.com")
 * @param sourceLang - Source language code
 * @returns The generated public_code for the new website
 */
export async function createWebsite(
	accountId: number,
	name: string,
	hostname: string,
	sourceLang: string
): Promise<string> {
	const publicCode = crypto.randomBytes(8).toString('hex')

	const client = await pool.connect()
	try {
		await client.query('BEGIN')
		const result = await client.query<{ id: number }>(
			`INSERT INTO website (name, hostname, source_lang, public_code)
			 VALUES ($1, $2, $3, $4) RETURNING id`,
			[name, hostname, sourceLang, publicCode]
		)
		await client.query(
			`INSERT INTO account_website (account_id, website_id, role)
			 VALUES ($1, $2, 'owner')`,
			[accountId, result.rows[0].id]
		)
		await client.query('COMMIT')
		return publicCode
	} catch (err) {
		await client.query('ROLLBACK')
		throw err
	} finally {
		client.release()
	}
}

/**
 * Enable dev mode for a website (disables static asset caching for 5 minutes)
 * Sets cache_disabled_until to NOW() + 5 minutes
 * @param websiteId - Website ID
 * @returns The expiry timestamp
 */
export async function enableDevMode(websiteId: number): Promise<{ success: boolean; remainingSeconds?: number; error?: string }> {
	try {
		const result = await pool.query<{ remaining_seconds: string }>(
			`UPDATE website
			 SET cache_disabled_until = NOW() + INTERVAL '15 minutes',
			     updated_at = NOW()
			 WHERE id = $1
			 RETURNING EXTRACT(EPOCH FROM cache_disabled_until - NOW()) AS remaining_seconds`,
			[websiteId]
		)
		if (result.rows.length === 0) {
			return { success: false, error: 'Website not found' }
		}
		return { success: true, remainingSeconds: Math.round(parseFloat(result.rows[0].remaining_seconds)) }
	} catch (error) {
		console.error('Failed to enable dev mode:', error)
		return { success: false, error: 'Failed to enable dev mode' }
	}
}

// =============================================================================
// Account Profile
// =============================================================================

/**
 * Get account profile (first name, last name, email)
 */
export async function getAccountProfile(accountId: number): Promise<AccountProfile | null> {
	const result = await pool.query<{ first_name: string | null; last_name: string | null; email: string }>(
		`SELECT first_name, last_name, email FROM account WHERE id = $1`,
		[accountId]
	)
	if (!result.rows[0]) return null
	return {
		firstName: result.rows[0].first_name,
		lastName: result.rows[0].last_name,
		email: result.rows[0].email,
	}
}

/**
 * Update account profile (first name, last name, email)
 * Checks email uniqueness before updating
 */
export async function updateAccountProfile(
	accountId: number,
	firstName: string,
	lastName: string,
	email: string
): Promise<{ success: boolean; error?: string }> {
	try {
		// Check email uniqueness
		const emailCheck = await pool.query(
			`SELECT 1 FROM account WHERE email = $1 AND id != $2 LIMIT 1`,
			[email, accountId]
		)
		if ((emailCheck.rowCount ?? 0) > 0) {
			return { success: false, error: 'Email is already in use' }
		}

		await pool.query(
			`UPDATE account SET first_name = $1, last_name = $2, email = $3, updated_at = NOW() WHERE id = $4`,
			[firstName, lastName, email, accountId]
		)
		return { success: true }
	} catch (error) {
		console.error('Failed to update account profile:', error)
		return { success: false, error: 'Failed to update profile' }
	}
}

/**
 * Get account password hash (for old-password verification)
 */
export async function getAccountPasswordHash(accountId: number): Promise<string | null> {
	const result = await pool.query<{ password_hash: string | null }>(
		`SELECT password_hash FROM account WHERE id = $1`,
		[accountId]
	)
	return result.rows[0]?.password_hash ?? null
}

/**
 * Change account password
 */
export async function changeAccountPassword(accountId: number, newPasswordHash: string): Promise<{ success: boolean; error?: string }> {
	try {
		await pool.query(
			`UPDATE account SET password_hash = $1, updated_at = NOW() WHERE id = $2`,
			[newPasswordHash, accountId]
		)
		return { success: true }
	} catch (error) {
		console.error('Failed to change password:', error)
		return { success: false, error: 'Failed to change password' }
	}
}

/**
 * Segment-level caching using Cloudflare KV
 * Caches translation segments per page path to reduce translation API costs
 */

import type { KVNamespace } from '@cloudflare/workers-types'
import type { Content, SegmentCache, PathnameMapping } from './types'
import { normalizePathname, denormalizePathname } from './translation/translate-pathnames'

/**
 * Result from matching segments with cache
 */
export interface MatchResult {
	cached: Map<number, string> // Map of segment index → cached translation
	newSegments: Content[] // Segments that need translation
	newIndices: number[] // Original indices of new segments
}

/**
 * Build KV cache key for segment cache (per-language, domain-wide)
 * Format: segments::{targetLang}::{originDomain}
 * Example: segments::es::www.example.com
 */
function buildSegmentCacheKey(targetLang: string, originDomain: string): string {
	return `segments::${targetLang}::${originDomain}`
}

/**
 * Get segment cache for a domain in a specific language
 * @param kv - KV namespace binding
 * @param targetLang - Target language code (e.g., "es", "fr")
 * @param originDomain - Origin domain (e.g., "www.example.com")
 * @returns Segment cache hash map or null if not found
 */
export async function getSegmentCache(
	kv: KVNamespace,
	targetLang: string,
	originDomain: string
): Promise<SegmentCache | null> {
	try {
		const key = buildSegmentCacheKey(targetLang, originDomain)
		const cached = (await kv.get(key, 'json')) as SegmentCache | null

		// console.log(`[GET CACHE]: ${key}`)

		if (!cached || typeof cached !== 'object') {
			return null
		}

		if (Object.keys(cached).length === 0) {
			return null
		}

		return cached
	} catch (error) {
		console.error('KV segment cache read error:', error)
		return null // Fail open - treat as cache miss
	}
}

/**
 * Match extracted segments against cached translations
 *
 * IMPORTANT: Cache keys are normalized text with patterns applied.
 * Example: "Price 123.00 USD" is stored as "Price [N1] USD"
 * This allows cache hits for similar content with different numbers.
 * Pattern restoration happens at DOM application time.
 *
 * @param segments - Extracted segments from page
 * @param cache - Segment cache hash map (or null)
 * @returns Match result with cached translations and new segments
 */
export async function matchSegmentsWithCache(segments: Content[], cache: SegmentCache | null): Promise<MatchResult> {
	const cached = new Map<number, string>()
	const newSegments: Content[] = []
	const newIndices: number[] = []

	if (!cache || Object.keys(cache).length === 0) {
		// Cold cache - all segments are new
		return {
			cached,
			newSegments: segments,
			newIndices: segments.map((_, i) => i),
		}
	}

	// Match each segment using O(1) hash lookup
	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i]
		const translation = cache[segment.value] // Direct O(1) lookup

		if (translation) {
			// Cache hit
			cached.set(i, translation)
		} else {
			// Cache miss - need to translate
			newSegments.push(segment)
			newIndices.push(i)
		}
	}

	return { cached, newSegments, newIndices }
}

/**
 * Update segment cache with new translations
 *
 * @param kv - KV namespace binding
 * @param targetLang - Target language code
 * @param originDomain - Origin domain
 * @param existingCache - Existing cache read earlier in the request
 * @param newSegments - Newly translated segments
 * @param newTranslations - Translations for new segments (parallel to newSegments)
 * @returns Number of total items in cache after update (0 if cache update failed)
 */
export async function updateSegmentCache(
	kv: KVNamespace,
	targetLang: string,
	originDomain: string,
	existingCache: SegmentCache | null,
	newSegments: Content[],
	newTranslations: string[]
): Promise<number> {
	if (newSegments.length === 0) return 0

	try {
		// Merge new translations with existing cache
		const updated: SegmentCache = existingCache ? { ...existingCache } : {}

		// Add new translations (last-write-wins)
		for (let i = 0; i < newSegments.length; i++) {
			const original = newSegments[i].value.trim()
			const translated = newTranslations[i].trim()
			updated[original] = translated
		}

		// Size guards
		const serialized = JSON.stringify(updated)
		const sizeMB = (serialized.length / (1024 * 1024)).toFixed(2)
		const entryCount = Object.keys(updated).length

		// Hard limit: Abort if > 25MB (KV limit)
		if (serialized.length > 25 * 1024 * 1024) {
			console.error(`Segment cache too large (${sizeMB}MB, ${entryCount} entries), aborting update`)
			return 0
		}

		// Warning threshold: 20MB
		if (serialized.length > 20 * 1024 * 1024) {
			console.warn(`Segment cache large (${sizeMB}MB, ${entryCount} entries) for ${targetLang}::${originDomain}`)
		}

		// Write to KV with TTL
		const key = buildSegmentCacheKey(targetLang, originDomain)
		await kv.put(key, serialized, {
			expirationTtl: 60 * 60 * 24 * 30, // 30 days
		})

		console.log(`[CACHE UPDATE] ${key} → ${entryCount} total entries (${sizeMB}MB, +${newSegments.length} new)`)

		return entryCount
	} catch (error) {
		console.error('Segment cache write error:', error)
		return 0 // Fail open
	}
}

/**
 * Build KV cache key for pathname cache (per-language)
 * Format: pathnames::{targetLang}::{originDomain}
 * Example: pathnames::es::www.example.com
 */
function buildPathnameCacheKey(targetLang: string, originDomain: string): string {
	return `pathnames::${targetLang}::${originDomain}`
}

/**
 * Get pathname mapping cache for a specific origin + language
 * @param kv - KV namespace binding
 * @param targetLang - Target language code (e.g., "es", "fr")
 * @param originDomain - Origin domain (e.g., "www.esnipe.com")
 * @returns PathnameMapping or null if not found
 */
export async function getPathnameMapping(
	kv: KVNamespace,
	targetLang: string,
	originDomain: string
): Promise<PathnameMapping | null> {
	try {
		const key = buildPathnameCacheKey(targetLang, originDomain)
		const cached = (await kv.get(key, 'json')) as PathnameMapping | null

		// console.log(`[GET CACHE]: ${key}`)

		if (!cached || typeof cached !== 'object') {
			return null
		}

		// Check for dual-object structure
		if (
			!cached.origin ||
			!cached.translated ||
			typeof cached.origin !== 'object' ||
			typeof cached.translated !== 'object'
		) {
			return null // Old format or invalid - treat as cache miss
		}

		if (Object.keys(cached.origin).length === 0 && Object.keys(cached.translated).length === 0) {
			return null
		}

		return cached
	} catch (error) {
		console.error('KV pathname mapping read error:', error)
		return null // Fail open
	}
}

/**
 * Synchronous pathname lookup using pre-fetched mapping
 * Used when pathname mapping is already loaded to avoid redundant KV reads
 *
 * @param mapping - Pre-fetched pathname mapping
 * @param incomingPathname - The incoming pathname (original or translated)
 * @returns Original English pathname or null if not found
 */
export function lookupOriginalPathnameSync(mapping: PathnameMapping, incomingPathname: string): string | null {
	// Normalize the incoming pathname to match cache keys
	const { normalized, replacements } = normalizePathname(incomingPathname)

	// Reverse lookup: translated pathname → original pathname
	const originalNormalized = mapping.translated[normalized]
	if (!originalNormalized) {
		return null
	}

	// Denormalize using the incoming pathname's replacements
	return denormalizePathname(originalNormalized, replacements)
}

/**
 * Lookup: find original English pathname from any incoming pathname
 * Works for both original and translated pathnames because the mapping
 * structure always maps to the original:
 * - If user visits translated: "/preise" → lookup → "/pricing"
 * - If user visits original: "/pricing" → lookup → "/pricing"
 *
 * @param kv - KV namespace binding
 * @param targetLang - Target language code
 * @param originDomain - Origin domain
 * @param incomingPathname - The incoming pathname (original or translated)
 * @returns Original English pathname or null if not found (indicates new path)
 */
export async function lookupOriginalPathname(
	kv: KVNamespace,
	targetLang: string,
	originDomain: string,
	incomingPathname: string
): Promise<string | null> {
	const mapping = await getPathnameMapping(kv, targetLang, originDomain)
	if (!mapping) {
		return null
	}

	return lookupOriginalPathnameSync(mapping, incomingPathname)
}

/**
 * Update pathname mapping cache with new translation
 * Stores one-way mapping where value is always the original English pathname.
 * This allows simple reverse lookup without needing language context.
 *
 * Structure: key (any form) → value (always original)
 * Example: "/preise" → "/pricing", "/pricing" → "/pricing"
 *
 * @param kv - KV namespace binding
 * @param targetLang - Target language code
 * @param originDomain - Origin domain
 * @param originalPathname - Original English pathname (normalized)
 * @param translatedPathname - Translated pathname (normalized)
 */
export async function updatePathnameMapping(
	kv: KVNamespace,
	targetLang: string,
	originDomain: string,
	originalPathname: string,
	translatedPathname: string
): Promise<void> {
	try {
		// Get existing mapping or create new empty structure
		const existing = await getPathnameMapping(kv, targetLang, originDomain)
		const updated: PathnameMapping = existing || { origin: {}, translated: {} }

		// Forward mapping: original → translated
		updated.origin[originalPathname] = translatedPathname

		// Reverse mapping: translated → original
		updated.translated[translatedPathname] = originalPathname

		// Check size (warn if > 20MB, abort if > 25MB KV limit)
		const serialized = JSON.stringify(updated)
		const sizeMB = (serialized.length / (1024 * 1024)).toFixed(2)

		if (serialized.length > 25 * 1024 * 1024) {
			console.error(`Pathname mapping too large (${sizeMB}MB), aborting update`)
			return
		}

		if (serialized.length > 20 * 1024 * 1024) {
			console.warn(`Pathname mapping large (${sizeMB}MB) for ${targetLang}::${originDomain}`)
		}

		// Write to KV
		const key = buildPathnameCacheKey(targetLang, originDomain)
		await kv.put(key, serialized)
	} catch (error) {
		console.error('KV pathname mapping write error:', error)
		// Fail open - don't throw, just skip update
	}
}

/**
 * Batch update pathname mapping cache with multiple translations
 * Optimized to read cache once and write once (vs N reads + N writes)
 *
 * RACE CONDITION HANDLING: Re-reads cache immediately before write to minimize
 * race window. Accepts last-write-wins semantics since translations are deterministic.
 *
 * @param kv - KV namespace binding
 * @param targetLang - Target language code
 * @param originDomain - Origin domain
 * @param updates - Array of { original, translated } pathname pairs to add
 */
export async function batchUpdatePathnameMapping(
	kv: KVNamespace,
	targetLang: string,
	originDomain: string,
	updates: Array<{ original: string; translated: string }>
): Promise<void> {
	if (updates.length === 0) return

	try {
		// CRITICAL: Re-read cache immediately before write to minimize race window
		const existing = await getPathnameMapping(kv, targetLang, originDomain)
		const updated: PathnameMapping = existing || { origin: {}, translated: {} }

		// Apply all updates in memory
		for (const { original, translated } of updates) {
			// Forward mapping: original → translated
			updated.origin[original] = translated
			// Reverse mapping: translated → original
			updated.translated[translated] = original
		}

		// Size guards
		const serialized = JSON.stringify(updated)
		const sizeMB = (serialized.length / (1024 * 1024)).toFixed(2)

		if (serialized.length > 25 * 1024 * 1024) {
			console.error(`Pathname mapping too large (${sizeMB}MB), aborting update`)
			return
		}

		if (serialized.length > 20 * 1024 * 1024) {
			console.warn(`Pathname mapping large (${sizeMB}MB) for ${targetLang}::${originDomain}`)
		}

		// Single KV write with TTL
		const key = buildPathnameCacheKey(targetLang, originDomain)
		await kv.put(key, serialized, {
			expirationTtl: 60 * 60 * 24 * 30, // 30 days
		})

		// console.log(`[BATCH UPDATE]: ${key} → ${updates.length} pathnames (${sizeMB}MB)`)
	} catch (error) {
		console.error('KV pathname batch write error, attempting chunked fallback:', error)

		// Fallback: Write in smaller chunks
		const chunkSize = 10
		for (let i = 0; i < updates.length; i += chunkSize) {
			try {
				const chunk = updates.slice(i, i + chunkSize)
				// Recursive call with smaller batch
				await batchUpdatePathnameMapping(kv, targetLang, originDomain, chunk)
			} catch (chunkError) {
				console.error(`Failed to write chunk ${i}-${i + chunkSize}:`, chunkError)
				// Continue with next chunk
			}
		}
	}
}

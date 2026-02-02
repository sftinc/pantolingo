/**
 * Background Translation Module
 * Handles fire-and-forget translation of cache misses.
 *
 * Key behavior for deferred mode:
 * - All translations start in parallel
 * - Each translation writes to DB immediately on completion
 * - Client can poll and receive partial results as they complete
 * - On failure: cleans up in-flight store immediately (next page load retries)
 */

import type { Content } from '../types.js'
import { translateSingle } from '../translation/translate.js'
import { replaceSkipWords, restoreSkipWords } from '../translation/skip-words.js'
import { batchUpsertTranslations, recordLlmUsage, type LlmUsageRecord, type TokenUsage } from '@pantolingo/db'
import { deleteInFlight, buildInFlightKey } from './in-flight-store.js'

interface BackgroundTranslationParams {
	websiteId: number
	lang: string
	sourceLang: string
	segments: Content[]
	hashes: string[]
	skipWords: string[]
	apiKey: string
	projectId: string
	context?: { host: string; pathname: string }
}

/**
 * Start background translation of segments
 * This function is fire-and-forget - don't await it in the caller.
 *
 * Each segment is translated in parallel and written to DB immediately on completion,
 * allowing the client to receive partial results via polling.
 *
 * @param params - Translation parameters
 * @returns Promise that resolves when all translations complete (or fail)
 */
export async function startBackgroundTranslation(params: BackgroundTranslationParams): Promise<void> {
	const { websiteId, lang, sourceLang, segments, hashes, skipWords, apiKey, context } = params

	// Aggregate usage stats for logging
	const totalUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, cost: 0 }
	let successCount = 0
	let failCount = 0

	// Process each segment in parallel, writing to DB immediately on completion
	const promises = segments.map(async (segment, i) => {
		const hash = hashes[i]
		const inFlightKey = buildInFlightKey(websiteId, lang, hash)

		try {
			// Apply skip words (patterns are already applied before caching)
			const { text: textToTranslate, replacements: skipWordReplacements } = replaceSkipWords(
				segment.value,
				skipWords
			)

			// Translate
			const result = await translateSingle(textToTranslate, 'segment', sourceLang, lang, apiKey, 'balanced')

			if (result === null) {
				// Translation failed - don't save to DB, next page load will retry
				failCount++
				return
			}

			// Restore skip words in translation
			const translated = restoreSkipWords(result.translation, skipWordReplacements)

			// Write to DB immediately
			await batchUpsertTranslations(websiteId, lang, [{ original: segment.value, translated }])

			// Accumulate usage
			totalUsage.promptTokens += result.usage.promptTokens
			totalUsage.completionTokens += result.usage.completionTokens
			totalUsage.cost += result.usage.cost
			successCount++
		} catch (error) {
			failCount++
			console.error(`[Background] Segment translation failed:`, error)
		} finally {
			// Always clean up in-flight store
			deleteInFlight(inFlightKey)
		}
	})

	// Wait for all to settle (for logging purposes)
	await Promise.allSettled(promises)

	// Log summary
	const contextInfo = context ? ` for ${context.host}${context.pathname}` : ''
	if (failCount > 0) {
		console.log(`[Background] Translated ${successCount}/${segments.length} segments${contextInfo} (${failCount} failed)`)
	} else if (successCount > 0) {
		console.log(`[Background] Translated ${successCount} segments${contextInfo}`)
	}

	// Record aggregated LLM usage
	if (successCount > 0) {
		const usageRecord: LlmUsageRecord = {
			websiteId,
			feature: 'segment_translation',
			promptTokens: totalUsage.promptTokens,
			completionTokens: totalUsage.completionTokens,
			cost: totalUsage.cost,
			apiCalls: successCount,
		}
		recordLlmUsage([usageRecord])
	}
}

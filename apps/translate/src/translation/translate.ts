/**
 * OpenRouter Translation API integration
 * Handles translation with type-specific prompts for segments vs pathnames
 */

import { PATHNAME_PROMPT, SEGMENT_PROMPT } from './prompts.js'
import type { TokenUsage } from '@pantolingo/db'
import { TIMEOUT_TRANSLATION } from '../config.js'

export interface TranslationItem {
	text: string
	type: 'segment' | 'pathname'
}

export type TranslationStyle = 'literal' | 'balanced' | 'natural'

export interface TranslateSingleResult {
	translation: string
	usage: TokenUsage
}

export interface TranslateBatchResult {
	translations: string[]
	totalUsage: TokenUsage
	apiCallCount: number
}

/** Context for logging translation failures */
export interface TranslationContext {
	host: string // e.g., "es.example.com"
	pathname: string // e.g., "/products"
}

const OPENROUTER_ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-haiku-4.5'

/**
 * Translate a single item using OpenRouter API
 * @param text - Text to translate
 * @param type - Translation type ('segment' or 'pathname')
 * @param sourceLanguageCode - Source language BCP 47 code (e.g., 'en-us')
 * @param targetLanguageCode - Target language BCP 47 code (e.g., 'es-mx', 'fr-fr')
 * @param apiKey - OpenRouter API key
 * @param style - Translation style (only applies to segments, not pathnames)
 * @returns Translated text and usage, or null on failure
 */
export async function translateSingle(
	text: string,
	type: 'segment' | 'pathname',
	sourceLanguageCode: string,
	targetLanguageCode: string,
	apiKey: string,
	style: TranslationStyle = 'balanced'
): Promise<TranslateSingleResult | null> {
	const prompt = type === 'segment' ? SEGMENT_PROMPT : PATHNAME_PROMPT

	// Include <style> tag only for segments, not pathnames
	const styleTag = type === 'segment' ? `<style>${style}</style>` : ''

	// console.log(`[Translation Single] Type: ${type}, Input: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`)

	try {
		const response = await fetch(OPENROUTER_ENDPOINT, {
			method: 'POST',
			headers: {
				Authorization: `Bearer ${apiKey}`,
				// 'HTTP-Referer': 'https://find-your-item.com',
				'X-Title': 'Translation Proxy',
				'Content-Type': 'application/json',
			},
			signal: AbortSignal.timeout(TIMEOUT_TRANSLATION),
			body: JSON.stringify({
				model: MODEL,
				messages: [
					{
						role: 'system',
						content: prompt,
					},
					{
						role: 'user',
						content: `
                        <translate>
                            <sourceLanguageCode>${sourceLanguageCode}</sourceLanguageCode>
                            <targetLanguageCode>${targetLanguageCode}</targetLanguageCode>
                            ${styleTag}
                            <text>${text}</text>
                        </translate>`,
					},
				],
				temperature: 0,
				provider: {
					sort: 'throughput',
				},
				reasoning: {
					enabled: false,
				},
				stream: false,
			}),
		})

		if (!response.ok) {
			const errorText = await response.text()
			// Truncate error body - it may be a full HTML error page from Cloudflare
			const isHtml = errorText.trimStart().startsWith('<')
			const truncatedError = isHtml
				? '(HTML error page)'
				: errorText.slice(0, 200) + (errorText.length > 200 ? '...' : '')
			throw new Error(`OpenRouter API error: ${response.status} ${response.statusText} - ${truncatedError}`)
		}

		const data = (await response.json()) as any

		if (!data.choices || !data.choices[0] || !data.choices[0].message) {
			throw new Error(`Unexpected response format: ${JSON.stringify(data)}`)
		}

		// Warn if cost is missing (detect silent data loss)
		if (data.usage?.cost === undefined) {
			console.warn('[LLM Usage] Missing cost in OpenRouter response')
		}

		const usage: TokenUsage = {
			promptTokens: data.usage?.prompt_tokens ?? 0,
			completionTokens: data.usage?.completion_tokens ?? 0,
			cost: data.usage?.cost ?? 0,
		}

		const rawContent = data.choices[0].message.content
		const translatedText = rawContent?.trim() ?? ''

		// Return null if translation is empty (API returned nothing useful)
		if (!translatedText) {
			console.warn(`[Translation] Empty response for "${text.slice(0, 50)}..."`)
			return null
		}

		return { translation: translatedText, usage }
	} catch (error) {
		const errorType = error instanceof Error && error.name === 'TimeoutError' ? 'timeout' : 'error'
		console.warn(
			`[Translation] ${errorType} for "${text.slice(0, 50)}...":`,
			error instanceof Error ? error.message : String(error)
		)
		return null
	}
}

/**
 * Translate a batch of items in parallel
 * All items are processed simultaneously
 * @param items - Array of translation items with type discrimination
 * @param sourceLanguageCode - Source language BCP 47 code (e.g., 'en-us')
 * @param targetLanguageCode - Target language BCP 47 code (e.g., 'es-mx', 'fr-fr')
 * @param apiKey - OpenRouter API key
 * @param style - Translation style (only applies to segments, not pathnames)
 * @returns Array of translated strings in same order as input
 */
export async function translateBatch(
	items: TranslationItem[],
	sourceLanguageCode: string,
	targetLanguageCode: string,
	apiKey: string,
	style: TranslationStyle = 'balanced',
	context?: TranslationContext
): Promise<TranslateBatchResult> {
	if (items.length === 0) {
		return {
			translations: [],
			totalUsage: { promptTokens: 0, completionTokens: 0, cost: 0 },
			apiCallCount: 0,
		}
	}

	// console.log(`[translateBatch] Starting ${items.length} parallel API calls`)

	// Translate all items in parallel (1 API call per item)
	const translationPromises = items.map((item) =>
		translateSingle(item.text, item.type, sourceLanguageCode, targetLanguageCode, apiKey, style)
	)

	const settledResults = await Promise.allSettled(translationPromises)

	// Process results: use translation if successful, fallback to original text if failed/null
	const translations: string[] = []
	const totalUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, cost: 0 }
	let failCount = 0

	for (let i = 0; i < settledResults.length; i++) {
		const result = settledResults[i]
		const originalText = items[i].text

		if (result.status === 'fulfilled' && result.value !== null) {
			// Success: use translation and accumulate usage
			translations.push(result.value.translation)
			totalUsage.promptTokens += result.value.usage.promptTokens
			totalUsage.completionTokens += result.value.usage.completionTokens
			totalUsage.cost += result.value.usage.cost
		} else {
			// Failure (rejected or null): fallback to original text
			translations.push(originalText)
			failCount++
		}
	}

	// Log batch summary with request context if failures occurred
	if (failCount > 0) {
		const contextInfo = context ? ` for ${context.host}${context.pathname}` : ''
		console.warn(`[translateBatch] ${failCount}/${items.length} translations failed${contextInfo}, using originals`)
	}

	return {
		translations,
		totalUsage,
		apiCallCount: items.length, // Attempts, not successes
	}
}


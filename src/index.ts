/**
 * Translation Proxy Worker
 * Main entry point for the Cloudflare Worker
 * Orchestrates: cache → fetch → parse → extract → translate → apply → rewrite → return
 */

import { Env } from './types'
import type { PatternizedText, Content, PathnameMapping } from './types'
import { HOST_SETTINGS } from './config'
import { parseHTMLDocument } from './fetch/dom-parser'
import { extractSegments, extractLinkPathnames } from './fetch/dom-extractor'
import { applyTranslations } from './fetch/dom-applicator'
import { rewriteLinks } from './fetch/dom-rewriter'
import { addLangMetadata } from './fetch/dom-metadata'
import { translateSegments } from './translation/translate-segments'
import {
	getSegmentCache,
	matchSegmentsWithCache,
	updateSegmentCache,
	lookupOriginalPathname,
	lookupOriginalPathnameSync,
	updatePathnameMapping,
	getPathnameMapping,
	batchUpdatePathnameMapping,
} from './cache'
import { applyPatterns, restorePatterns } from './translation/skip-patterns'
import {
	shouldSkipPath,
	normalizePathname,
	translatePathnamesBatch,
} from './translation/translate-pathnames'
import { isStaticAsset } from './utils'

// Control console logging
const redirectLogging = false // redirects
const proxyLogging = false // non-HTML resources (proxied)

/**
 * Rewrite redirect Location header from origin domain to translated domain
 * @param location - Original Location header value
 * @param translatedHost - The translated domain host (e.g., 'de.example' or 'localhost:8787')
 * @param originBase - The origin domain base URL (e.g., 'https://www.example.com')
 * @param currentUrl - Current request URL object
 * @returns Rewritten Location URL pointing to translated domain
 */
function rewriteRedirectLocation(location: string, translatedHost: string, originBase: string, currentUrl: URL): string {
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

/**
 * Main worker fetch handler
 */
export default {
	async fetch(request: Request, env: Env): Promise<Response> {
		const url = new URL(request.url)
		const host = request.headers.get('host') || ''

		try {
			// 1. Parse request and determine target language
			const hostSettings = HOST_SETTINGS[host.startsWith('localhost') ? host.split(':')[0] : host]

			if (!hostSettings) {
				return new Response('Not Found', {
					status: 404,
					headers: { 'Content-Type': 'text/plain' },
				})
			}

			const targetLang = hostSettings.targetLang

			// Extract per-domain origin configuration
			const originBase = hostSettings.origin
			const originBaseUrl = new URL(originBase)
			const originHostname = originBaseUrl.hostname
			const sourceLang = hostSettings.sourceLang

			// Resolve pathname (reverse lookup for translated URLs)
			// Always attempt reverse lookup to support bookmarked/indexed translated URLs
			// regardless of translatePath setting. If no mapping exists, incoming pathname
			// is assumed to be the original English pathname (safe fallback).
			//
			// Configuration behaviors:
			// - translatePath: false → Reverse lookup enabled, forward translation disabled
			// - translatePath: true  → Both reverse lookup and forward translation enabled

			const incomingPathname = url.pathname
			let originalPathname = incomingPathname

			// Initialize pathname cache variables (default null with tracking flag)
			let pathnameMapping: PathnameMapping | null = null
			let pathnameSearched = false

			// CRITICAL: Early exit for static assets - skip ALL cache operations
			if (isStaticAsset(incomingPathname)) {
				const fetchUrl = originBase + incomingPathname + url.search

				// Forward headers
				const fetchHeaders = new Headers()
				const headersToForward = ['user-agent', 'accept-encoding', 'cookie', 'accept-language', 'referer']
				for (const headerName of headersToForward) {
					const headerValue = request.headers.get(headerName)
					if (headerValue) fetchHeaders.set(headerName, headerValue)
				}
				if (!fetchHeaders.has('user-agent')) {
					fetchHeaders.set('user-agent', 'Mozilla/5.0 (Cloudflare Worker) AppleWebKit/537.36')
				}

				const originResponse = await fetch(fetchUrl, {
					method: request.method,
					headers: fetchHeaders,
					redirect: 'manual',
				})

				// Handle redirects for static assets
				if (originResponse.status >= 300 && originResponse.status < 400) {
					const location = originResponse.headers.get('location')
					if (location) {
						const redirectUrl = rewriteRedirectLocation(location, host, originBase, url)
						return new Response(null, {
							status: originResponse.status,
							statusText: originResponse.statusText,
							headers: { Location: redirectUrl },
						})
					}
				}

				// Proxy static asset with cache headers if configured
				const proxyHeaders = new Headers(originResponse.headers)
				if (hostSettings.proxiedCache && hostSettings.proxiedCache > 0) {
					const maxAgeSeconds = hostSettings.proxiedCache * 60
					proxyHeaders.set('Cache-Control', `public, max-age=${maxAgeSeconds}`)
				}

				return new Response(originResponse.body, {
					status: originResponse.status,
					statusText: originResponse.statusText,
					headers: proxyHeaders,
				})
			}

			// STAGE 1: Early pathname cache read for likely non-static assets
			// Read pathname cache early (enables reverse lookup before fetch)
			pathnameMapping = await getPathnameMapping(env.KV, targetLang, originHostname)
			pathnameSearched = true

			// Attempt reverse lookup using fetched mapping
			if (pathnameMapping) {
				const resolved = lookupOriginalPathnameSync(pathnameMapping, incomingPathname)
				if (resolved) {
					originalPathname = resolved
				}
			}

			// Compute origin URL using resolved pathname
			const fetchUrl = originBase + originalPathname + url.search

			// 4. Fetch HTML from origin (segment cache read moved to after Content-Type check)
			let html: string

			try {
				// Fetch with header forwarding
				const fetchStart = Date.now()
				const fetchHeaders = new Headers()
				const headersToForward = [
					'user-agent',
					'accept-language',
					'accept-encoding',
					'referer',
					'cookie',
					'content-type',
				]
				for (const headerName of headersToForward) {
					const headerValue = request.headers.get(headerName)
					if (headerValue) fetchHeaders.set(headerName, headerValue)
				}
				if (!fetchHeaders.has('user-agent')) {
					fetchHeaders.set('user-agent', 'Mozilla/5.0 (Cloudflare Worker) AppleWebKit/537.36')
				}

				// For POST/PUT/PATCH/DELETE, we need to buffer the body to handle redirects
				let fetchBody: ArrayBuffer | undefined
				if (request.method !== 'GET' && request.method !== 'HEAD' && request.body) {
					fetchBody = await request.arrayBuffer()
				}

				const originResponse = await fetch(fetchUrl, {
					method: request.method,
					headers: fetchHeaders,
					redirect: 'manual',
					...(fetchBody ? { body: fetchBody } : {}),
				})

				// Handle redirects: detect and rewrite Location header to translated domain
				const isRedirect = originResponse.status >= 300 && originResponse.status < 400

				if (isRedirect) {
					const location = originResponse.headers.get('location')

					if (location) {
						// Rewrite Location header to point to our translated domain
						const redirectUrl = rewriteRedirectLocation(location, host, originBase, url)

						if (redirectLogging)
							console.log(`▶ [${targetLang}] ${fetchUrl} - Redirect ${originResponse.status} → ${redirectUrl}`)

						// Build headers for redirect response
						const redirectHeaders = new Headers({
							Location: redirectUrl,
						})

						// Forward Set-Cookie headers (can be multiple)
						originResponse.headers.forEach((value, key) => {
							if (key.toLowerCase() === 'set-cookie') {
								redirectHeaders.append('Set-Cookie', value)
							}
						})

						// Return redirect response to browser so URL bar updates
						return new Response(null, {
							status: originResponse.status,
							statusText: originResponse.statusText,
							headers: redirectHeaders,
						})
					}
				}

				// Check Content-Type - only translate HTML
				const contentType = originResponse.headers.get('content-type') || ''

				// Handle non-HTML content (proxy)
				if (!contentType.toLowerCase().includes('text/html')) {
					// STAGE 2: Late pathname cache read for edge cases (non-HTML that passed isStaticAsset)
					if (!pathnameSearched) {
						pathnameMapping = await getPathnameMapping(env.KV, targetLang, originHostname)
						pathnameSearched = true
					}

					// Proxy non-HTML resources with optional edge caching

					// Clone origin headers
					const proxyHeaders = new Headers(originResponse.headers)

					// Add Cache-Control header if proxiedCache is configured
					const truncatedUrl = fetchUrl.length > 50 ? fetchUrl.substring(0, 50) + '...' : fetchUrl
					if (hostSettings.proxiedCache && hostSettings.proxiedCache > 0) {
						const maxAgeSeconds = hostSettings.proxiedCache * 60
						proxyHeaders.set('Cache-Control', `public, max-age=${maxAgeSeconds}`)

						if (proxyLogging) {
							console.log(
								`▶ [${targetLang}] ${truncatedUrl} - Proxying with cache: ${contentType} (${hostSettings.proxiedCache}m)`
							)
						}
					} else {
						if (proxyLogging) console.log(`▶ [${targetLang}] ${truncatedUrl} - Proxying: ${contentType}`)
					}

					return new Response(originResponse.body, {
						status: originResponse.status,
						statusText: originResponse.statusText,
						headers: proxyHeaders,
					})
				}

				// NOW we know it's HTML - read segment cache
				let cachedEntry = await getSegmentCache(env.KV, targetLang, originHostname)

				// Initialize pathname updates accumulator for batch write at end
				const pathnameUpdates: Array<{ original: string; translated: string }> = []

				// Fetch HTML content for translation
				const fetchResult = {
					html: await originResponse.text(),
					finalUrl: originResponse.url,
					statusCode: originResponse.status,
					headers: originResponse.headers,
				}

				// Parse HTML with linkedom
				const parseStart = Date.now()
				const { document } = parseHTMLDocument(fetchResult.html)

				// 5. Extract segments
				const extractStart = Date.now()
				const extractedSegments = extractSegments(document)
				const extractTime = Date.now() - extractStart
				const parseTime = Date.now() - parseStart - extractTime
				const fetchTime = parseStart - fetchStart

				let cachedHits = 0
				let cacheMisses = 0
				let newTranslations: string[] = []
				let uniqueCount = 0
				let batchCount = 0
				let translateTime = 0
				let appliedCount = 0
				let applyTime = 0
				let rewrittenCount = 0
				let rewriteTime = 0
				let storedCount = 0

				if (extractedSegments.length > 0) {
					// 6. Apply patterns to normalize text for caching
					let patternData: PatternizedText[] = []
					let normalizedSegments = extractedSegments

					if (hostSettings.skipPatterns && hostSettings.skipPatterns.length > 0) {
						patternData = extractedSegments.map((seg) => applyPatterns(seg.value, hostSettings.skipPatterns!))
						// Replace segment values with normalized versions
						normalizedSegments = extractedSegments.map((seg, i) => ({
							...seg,
							value: patternData[i].normalized,
						}))
					} else {
						// No patterns - create pass-through pattern data
						patternData = extractedSegments.map((seg) => ({
							original: seg.value,
							normalized: seg.value,
							replacements: [],
						}))
					}

					// 7. Match segments with KV cache (using normalized text)
					const { cached, newSegments, newIndices } = await matchSegmentsWithCache(normalizedSegments, cachedEntry)

					cachedHits = cached.size
					cacheMisses = newSegments.length

					// 8. Extract link pathnames early (before translation) for parallel processing
					const linkPathnames = hostSettings.translatePath ? extractLinkPathnames(document, originHostname) : new Set<string>()

					// 9. Translate segments and pathnames in parallel for maximum performance
					const translateStart = Date.now()

					// Create promises for parallel execution
					const segmentPromise =
						newSegments.length > 0
							? translateSegments(newSegments, sourceLang, targetLang, env.GOOGLE_PROJECT_ID, env.OPENROUTER_API_KEY, hostSettings.skipWords)
							: Promise.resolve({ translations: [], uniqueCount: 0, batchCount: 0 })

					// Pathname translation: batch current + links together for efficiency
					const pathnamePromise = async () => {
						let translatedPathname = originalPathname
						let pathnameSegment = null
						let pathnameMap: Map<string, string> | undefined
						let pathnameSegments: Content[] = []
						let pathnameTranslations: string[] = []

						if (!hostSettings.translatePath) {
							return {
								translatedPathname,
								pathnameSegment,
								pathnameMap,
								pathnameSegments,
								pathnameTranslations,
							}
						}

						try {
							// Add current pathname to link pathnames for batching
							const allPathnames = new Set(linkPathnames)
							if (!shouldSkipPath(originalPathname, hostSettings.skipPath)) {
								allPathnames.add(originalPathname)
							}

							if (allPathnames.size === 0) {
								return {
									translatedPathname,
									pathnameSegment,
									pathnameMap,
									pathnameSegments,
									pathnameTranslations,
								}
							}

							// Translate all pathnames in one batch
							const batchResult = await translatePathnamesBatch(
								allPathnames,
								originalPathname,
								originalPathname, // Dummy value, will be replaced
								targetLang,
								pathnameMapping,
								async (segments: Content[]) => {
									const result = await translateSegments(
										segments,
										sourceLang,
										targetLang,
										env.GOOGLE_PROJECT_ID,
										env.OPENROUTER_API_KEY,
										hostSettings.skipWords
									)
									return result.translations
								},
								hostSettings.skipPath
							)

							// Extract current pathname translation from batch results
							translatedPathname = batchResult.pathnameMap.get(originalPathname) || originalPathname

							// Create pathname segment for caching
							if (translatedPathname !== originalPathname) {
								const { normalized } = normalizePathname(originalPathname)
								pathnameSegment = { kind: 'path' as const, value: normalized }
							}

							pathnameMap = batchResult.pathnameMap
							pathnameSegments = batchResult.newSegments
							pathnameTranslations = batchResult.newTranslations
						} catch (error) {
							console.error('[Pathname Translation] Failed:', error)
							// Continue with original pathname
						}

						return {
							translatedPathname,
							pathnameSegment,
							pathnameMap,
							pathnameSegments,
							pathnameTranslations,
						}
					}

					// Execute translations in parallel
					try {
						const [segmentResult, pathnameResult] = await Promise.all([segmentPromise, pathnamePromise()])

						// Extract segment translation results
						newTranslations = segmentResult.translations
						uniqueCount = segmentResult.uniqueCount
						batchCount = segmentResult.batchCount
						translateTime = Date.now() - translateStart

						// Extract pathname translation results
						const translatedPathname = pathnameResult.translatedPathname
						const pathnameSegment = pathnameResult.pathnameSegment
						const pathnameMap = pathnameResult.pathnameMap
						const pathnameSegments = pathnameResult.pathnameSegments
						const pathnameTranslations = pathnameResult.pathnameTranslations

						// 8. Merge cached + new translations in original order
						const allTranslations = new Array(extractedSegments.length).fill('')
						for (const [idx, translation] of cached.entries()) {
							allTranslations[idx] = translation
						}
						for (let i = 0; i < newIndices.length; i++) {
							allTranslations[newIndices[i]] = newTranslations[i]
						}

						// 10. Restore patterns before applying to DOM
						const restoredTranslations = allTranslations.map((translation, i) => {
							// Always call restorePatterns to ensure case formatting is applied even if no patterns
							return restorePatterns(
								translation,
								patternData[i]?.replacements ?? [],
								patternData[i]?.isUpperCase
							)
						})

						// 11. Apply translations to DOM
						const applyStart = Date.now()
						appliedCount = applyTranslations(document, restoredTranslations, extractedSegments)
						applyTime = Date.now() - applyStart

						// 12. Update KV cache with new translations
						storedCount = 0
						const segmentsForCache = pathnameSegment ? [...newSegments, pathnameSegment] : newSegments
						const translationsForCache = pathnameSegment
							? [...newTranslations, translatedPathname]
							: newTranslations
						if (segmentsForCache.length > 0 && translationsForCache.length > 0) {
							storedCount = await updateSegmentCache(
								env.KV,
								targetLang,
								originHostname,
								cachedEntry,
								segmentsForCache,
								translationsForCache
							)
						}

						// 13. Add current page pathname to batch (accumulate instead of immediate write)
						if (hostSettings.translatePath && pathnameSegment && translatedPathname !== originalPathname) {
							const { normalized: normalizedOriginal } = normalizePathname(originalPathname)
							const { normalized: normalizedTranslated } = normalizePathname(translatedPathname)

							pathnameUpdates.push({
								original: normalizedOriginal,
								translated: normalizedTranslated,
							})
						}

						// 14. Rewrite links
						const rewriteStart = Date.now()
						rewrittenCount = rewriteLinks(
							document,
							originHostname,
							host,
							originalPathname,
							translatedPathname,
							hostSettings.translatePath || false,
							pathnameMap
						)
						rewriteTime = Date.now() - rewriteStart

						// 15a. Add lang attribute and hreflang links for SEO
						try {
							const langResult = addLangMetadata(
								document,
								targetLang,
								sourceLang,
								host,
								originHostname,
								originalPathname,
								url
							)

							if (
								langResult.langUpdated ||
								langResult.hreflangAdded > 0 ||
								langResult.hreflangReplaced > 0 ||
								langResult.hreflangReformatted > 0
							) {
								console.log(
									`  Lang Metadata: lang=${langResult.langUpdated ? 'updated' : 'ok'}, hreflang +${langResult.hreflangAdded} ~${langResult.hreflangReplaced} fmt=${langResult.hreflangReformatted}`
								)
							}
						} catch (langError) {
							console.error('[Lang Metadata] Failed:', langError)
							// Non-blocking - continue serving response
						}

						// 15b. Add link pathnames to batch (accumulate instead of loop writes)
						if (hostSettings.translatePath && pathnameSegments.length > 0) {
							const linkUpdates = pathnameSegments.map((seg, i) => ({
								original: seg.value,
								translated: pathnameTranslations[i],
							}))
							pathnameUpdates.push(...linkUpdates)
						}

						// 15c. Batch write all pathname updates (current page + links) in single operation
						if (pathnameUpdates.length > 0) {
							try {
								await batchUpdatePathnameMapping(env.KV, targetLang, originHostname, pathnameUpdates)
							} catch (error) {
								console.error('Pathname cache batch update failed:', error)
								// Non-blocking - continue serving response
							}
						}
					} catch (translationError) {
						// Translation failed - return original HTML with debug header
						console.error('Translation error, returning original HTML:', translationError)

						const response = new Response(fetchResult.html, {
							status: 200,
							headers: {
								'Content-Type': 'text/html; charset=utf-8',
								'X-Error': 'Translation failed',
							},
						})

						return response
					}
				}

				// 14. Serialize final HTML
				const serializeStart = Date.now()
				html = document.toString()
				const serializeTime = Date.now() - serializeStart

				// Calculate total pipeline time
				const totalTime = Date.now() - fetchStart

				// Log consolidated pipeline summary
				const formatTime = (ms: number) => ms.toLocaleString('en-US')
				console.log(`▶ [${targetLang}] ${fetchUrl} (${formatTime(totalTime)}ms)`)

				// Log consolidated 5-line pipeline summary
				const cacheStatus =
					cachedHits === extractedSegments.length
						? `HIT (${cachedHits}/${extractedSegments.length})`
						: cachedHits > 0
						? `PARTIAL (${cachedHits}/${extractedSegments.length})`
						: 'MISS'
				const translateLine =
					newTranslations.length > 0
						? `Translate: ${extractedSegments.length}→${uniqueCount} unique, ${batchCount} batch, ${translateTime}ms | Cache: ${cacheStatus}`
						: `Translate: SKIPPED (all cached) | Cache: ${cacheStatus}`
				console.log(
					`  Fetch & Parse: ${fetchTime + parseTime}ms | Extract: ${
						extractedSegments.length
					} segments (${extractTime}ms)`
				)
				console.log(`  ${translateLine}`)
				console.log(
					`  Apply: ${appliedCount} translations (${applyTime}ms) | Rewrite: ${rewrittenCount} links (${rewriteTime}ms) | Serialize: ${serializeTime}ms`
				)
				if (storedCount > 0) {
					console.log(`  Cache Updated: ${originHostname}:${originalPathname} → ${storedCount} items stored`)
				}

				// Create response with cache statistics
				const responseHeaders = new Headers({
					'Content-Type': 'text/html; charset=utf-8',
					'X-Segment-Cache-Hits': String(cachedHits),
					'X-Segment-Cache-Misses': String(cacheMisses),
				})

				const response = new Response(html, {
					status: 200,
					headers: responseHeaders,
				})

				return response
			} catch (fetchError) {
				console.error('Fetch/parse error:', fetchError)
				return new Response('Fetch/parse failed', {
					status: 502,
					headers: {
						'Content-Type': 'text/plain',
						'X-Error': 'Failed to fetch or parse page',
					},
				})
			}
		} catch (error) {
			console.error('Unexpected error:', error)
			return new Response('Internal Server Error', {
				status: 500,
				headers: { 'Content-Type': 'text/plain' },
			})
		}
	},
}

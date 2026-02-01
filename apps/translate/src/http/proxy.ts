/**
 * HTTP proxy utilities for the translation proxy
 * Handles proxying static assets and non-HTML content
 */

import type { Request, Response } from 'express'
import { prepareResponseHeaders } from './headers.js'
import { rewriteRedirectLocation } from './redirect.js'
import { getCacheControl, isDataFileExtension, isDataContentType } from '../utils/cache-control.js'
import { isStaticAsset } from '../utils.js'

/**
 * Headers to forward from incoming request to origin
 */
const STATIC_HEADERS_TO_FORWARD = ['user-agent', 'accept-encoding', 'cookie', 'accept-language', 'referer']

/**
 * Configuration for proxying requests
 */
export interface ProxyConfig {
	originBase: string
	targetLang: string
	cacheDisabledUntil: Date | null
}

/**
 * Build fetch headers for origin requests
 * @param req - Express request
 * @param headersToForward - Headers to forward from incoming request
 * @param targetLang - Target language code for custom headers
 * @returns Headers object for fetch
 */
export function buildFetchHeaders(
	req: Request,
	headersToForward: string[],
	targetLang: string
): Record<string, string> {
	const fetchHeaders: Record<string, string> = {}

	for (const headerName of headersToForward) {
		const headerValue = req.get(headerName)
		if (headerValue) fetchHeaders[headerName] = headerValue
	}

	if (!fetchHeaders['user-agent']) {
		fetchHeaders['user-agent'] = 'Mozilla/5.0 (Translation Proxy) AppleWebKit/537.36'
	}

	fetchHeaders['weglot-language'] = targetLang
	fetchHeaders['pantolingo-language'] = targetLang

	return fetchHeaders
}

/**
 * Proxy a static asset (CSS, JS, images, etc.)
 * Returns true if the request was handled, false if it should continue to HTML processing
 * @param req - Express request
 * @param res - Express response
 * @param url - Parsed URL object
 * @param host - Current host
 * @param config - Proxy configuration
 * @returns true if request was handled (response sent), false otherwise
 */
export async function proxyStaticAsset(
	req: Request,
	res: Response,
	url: URL,
	host: string,
	config: ProxyConfig
): Promise<boolean> {
	const pathname = url.pathname

	if (!isStaticAsset(pathname)) {
		return false
	}

	const fetchUrl = config.originBase + pathname + url.search
	const fetchHeaders = buildFetchHeaders(req, STATIC_HEADERS_TO_FORWARD, config.targetLang)

	const originResponse = await fetch(fetchUrl, {
		method: req.method,
		headers: fetchHeaders,
		redirect: 'manual',
	})

	// Handle redirects for static assets
	if (originResponse.status >= 300 && originResponse.status < 400) {
		const location = originResponse.headers.get('location')
		if (location) {
			const redirectUrl = rewriteRedirectLocation(location, host, config.originBase, url)
			res.status(originResponse.status).set('Location', redirectUrl).send()
			return true
		}
	}

	// Proxy static asset with filtered headers and security headers
	// Data files (.json, .xml) respect origin cache; other static assets get 5-min minimum
	const responseHeaders = prepareResponseHeaders(originResponse.headers)
	responseHeaders['Cache-Control'] = getCacheControl({
		originHeaders: originResponse.headers,
		cacheDisabledUntil: config.cacheDisabledUntil,
		applyMinimumCache: !isDataFileExtension(pathname),
	})

	const body = Buffer.from(await originResponse.arrayBuffer())
	res.status(originResponse.status).set(responseHeaders).send(body)
	return true
}

/**
 * Proxy non-HTML content (JSON, XML, images, etc.)
 * @param res - Express response
 * @param originResponse - Response from origin server
 * @param config - Proxy configuration
 * @param logging - Whether to log proxy operations
 * @param fetchUrl - URL that was fetched (for logging)
 * @returns true (always handles the request)
 */
export function proxyNonHtmlContent(
	res: Response,
	originResponse: globalThis.Response,
	config: ProxyConfig,
	logging: boolean = false,
	fetchUrl?: string
): Promise<boolean> {
	const contentType = originResponse.headers.get('content-type') || ''

	// Proxy non-HTML resources with filtered headers and security headers
	// Data content types (JSON, XML) respect origin cache; other types get 5-min minimum
	const proxyHeaders = prepareResponseHeaders(originResponse.headers)
	proxyHeaders['Cache-Control'] = getCacheControl({
		originHeaders: originResponse.headers,
		cacheDisabledUntil: config.cacheDisabledUntil,
		applyMinimumCache: !isDataContentType(contentType),
	})

	if (logging && fetchUrl) {
		const truncatedUrl = fetchUrl.length > 50 ? fetchUrl.substring(0, 50) + '...' : fetchUrl
		console.log(`▶ [${config.targetLang}] ${truncatedUrl} - Proxying: ${contentType} (${proxyHeaders['Cache-Control']})`)
	}

	return originResponse.arrayBuffer().then(buffer => {
		const body = Buffer.from(buffer)
		res.status(originResponse.status).set(proxyHeaders).send(body)
		return true
	})
}

/**
 * Check if a response is HTML content
 * @param originResponse - Response from origin server
 * @returns true if content type is text/html
 */
export function isHtmlContent(originResponse: globalThis.Response): boolean {
	const contentType = originResponse.headers.get('content-type') || ''
	return contentType.toLowerCase().includes('text/html')
}

/**
 * Check if a response is a redirect
 * @param statusCode - HTTP status code
 * @returns true if status indicates redirect
 */
export function isRedirect(statusCode: number): boolean {
	return statusCode >= 300 && statusCode < 400
}

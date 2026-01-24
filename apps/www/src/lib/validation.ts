/**
 * Input validation utilities
 * Used for both client-side (UX) and server-side (security) validation
 */

/**
 * Email validation using simple regex
 * Checks basic format: something@something.something
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
	return emailRegex.test(email.trim())
}

/**
 * Name validation (1-50 chars, trimmed)
 */
export function isValidName(name: string): boolean {
	const trimmed = name.trim()
	return trimmed.length >= 1 && trimmed.length <= 50
}

/**
 * Sanitize input - trim and reject empty strings
 * Returns trimmed string or null if empty
 */
export function sanitizeInput(value: string): string | null {
	const trimmed = value.trim()
	return trimmed.length > 0 ? trimmed : null
}

/**
 * Validate and sanitize callback URL to prevent open redirects
 * Only allows relative URLs starting with / (but not //)
 * Returns fallback if URL is invalid or missing
 */
export function getSafeCallbackUrl(url: string | null, fallback = '/dashboard'): string {
	if (!url) return fallback
	if (url.startsWith('/') && !url.startsWith('//')) {
		return url
	}
	return fallback
}

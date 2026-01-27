/**
 * Pattern-based text normalization for translation caching and PII redaction
 *
 * Replaces patterns with indexed placeholders before translation to:
 * - Enable cache hits across similar content with different numbers
 * - Prevent sensitive data (emails) from being sent to translation API or stored in cache
 *
 * Current patterns:
 * - [E] for emails (e.g., "user@example.com")
 * - [I] for identifiers - UUIDs (e.g., "550e8400-e29b-41d4-a716-446655440000")
 * - [U] for URLs (e.g., "https://example.com/path")
 * - [N] for numbers (e.g., "123.45", "1,000")
 *
 * Processing order by context:
 * - Segments: U → E → I → N (URLs first to capture embedded emails/UUIDs)
 * - Paths: E → I → N (no URL extraction for pathnames)
 *
 * Each pattern type uses a unique placeholder for regex-based restoration.
 */

import urlRegexSafe from 'url-regex-safe'
import type { PatternReplacement, PatternizedText } from '../types.js'

// Email pattern: Simple regex catches 99% of real-world emails
// Matches: user@example.com, first.last+tag@sub.domain.co.uk
// Does NOT match: user@@example.com, user@, @example.com (malformed emails)
const EMAIL_PATTERN = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
const EMAIL_PLACEHOLDER_PREFIX = '[E'

// UUID pattern: Standard UUID format (8-4-4-4-12 hexadecimal)
// Case-insensitive to match both lowercase and uppercase UUIDs
const UUID_PATTERN = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi
const UUID_PLACEHOLDER_PREFIX = '[I'

// URL pattern: strict mode requires protocol prefix (http:// or https://)
// This prevents matching bare domains from emails (e.g., example.com from user@example.com)
const URL_PATTERN = urlRegexSafe({
	strict: true,
	auth: false,
	localhost: true,
	parens: false,
	apostrophes: false,
	trailingPeriod: false,
	ipv4: true,
	ipv6: true,
})
const URL_PLACEHOLDER_PREFIX = '[U'

// Trailing punctuation to strip from URLs (period, comma, etc.)
const TRAILING_PUNCTUATION = /[.,!?;:]+$/

// Regex for numeric pattern: matches numbers with commas and decimals
// Requires at least one digit to avoid false matches on pure punctuation like "..."
// Negative lookbehind (?<!\[\/?[A-Z]+) prevents matching numbers inside placeholders:
//   - [A-Z]+ matches any uppercase letter sequence (N, E, I, U, HA, HB, etc.)
//   - \/? optionally matches closing slash for [/HA1] style placeholders
//   - This ensures "1" in "[N1]" or "[HA12]" isn't extracted as a number
const NUMERIC_PATTERN = /(?<!\[\/?[A-Z]+)[0-9.,]*\d[0-9.,]*/g
const NUMERIC_PLACEHOLDER_PREFIX = '[N'

/**
 * Detect if text is all uppercase
 * @param text - Text to check
 * @returns true if all alphabetic characters are uppercase, false otherwise
 */
function isAllUpperCase(text: string): boolean {
	const alphaChars = text.replace(/[^a-zA-Z]/g, '')
	return alphaChars.length > 0 && alphaChars === alphaChars.toUpperCase()
}

/**
 * Apply case formatting to text
 * @param text - Text to format
 * @param isUpperCase - Whether to apply uppercase transformation
 * @returns Formatted text
 */
function applyCaseFormat(text: string, isUpperCase: boolean): string {
	return isUpperCase ? text.toUpperCase() : text
}

/**
 * Apply pattern replacements to text
 * Replaces URLs with [U1], [U2], emails with [E1], [E2], UUIDs with [I1], [I2],
 * and numbers with [N1], [N2], etc.
 *
 * @param text - The text to normalize
 * @param context - Processing context: 'segment' (default) or 'path'
 *   - segment: U → E → I → N (URLs first to capture embedded emails/UUIDs)
 *   - path: E → I → N (skip URL extraction - URLs don't appear in pathnames)
 * @returns PatternizedText with original, normalized text, and replacement data
 */
export function applyPatterns(
	text: string,
	context: 'segment' | 'path' = 'segment'
): PatternizedText {
	const isUpperCase = isAllUpperCase(text)
	const replacements: PatternReplacement[] = []
	let normalized = text

	// Process URL pattern first (only for segments)
	// This captures entire URLs including any embedded emails/UUIDs as part of the URL
	if (context === 'segment') {
		const urlValues: string[] = []
		let urlIndex = 1

		normalized = normalized.replace(URL_PATTERN, (match) => {
			// Strip trailing punctuation that's not part of the URL
			const cleanUrl = match.replace(TRAILING_PUNCTUATION, '')
			const trailingPunct = match.slice(cleanUrl.length)

			urlValues.push(cleanUrl)
			return `[U${urlIndex++}]${trailingPunct}`
		})

		if (urlValues.length > 0) {
			replacements.push({
				pattern: 'url',
				placeholder: URL_PLACEHOLDER_PREFIX,
				values: urlValues,
			})
		}
	}

	// Process email pattern - Must run BEFORE numeric to prevent user123@example.com → user[N1]@example.com
	const emailValues: string[] = []
	let emailIndex = 1
	normalized = normalized.replace(EMAIL_PATTERN, (match) => {
		emailValues.push(match)
		return `[E${emailIndex++}]`
	})
	if (emailValues.length > 0) {
		replacements.push({
			pattern: 'email',
			placeholder: EMAIL_PLACEHOLDER_PREFIX,
			values: emailValues,
		})
	}

	// Process UUID pattern - Must run BEFORE numeric to prevent partial UUID matching
	const uuidValues: string[] = []
	let uuidIndex = 1
	normalized = normalized.replace(UUID_PATTERN, (match) => {
		uuidValues.push(match)
		return `[I${uuidIndex++}]`
	})
	if (uuidValues.length > 0) {
		replacements.push({
			pattern: 'uuid',
			placeholder: UUID_PLACEHOLDER_PREFIX,
			values: uuidValues,
		})
	}

	// Process numeric pattern (last)
	const numericValues: string[] = []
	let numericIndex = 1
	normalized = normalized.replace(NUMERIC_PATTERN, (match) => {
		numericValues.push(match)
		return `[N${numericIndex++}]`
	})
	if (numericValues.length > 0) {
		replacements.push({
			pattern: 'numeric',
			placeholder: NUMERIC_PLACEHOLDER_PREFIX,
			values: numericValues,
		})
	}

	return { original: text, normalized, replacements, isUpperCase }
}

/**
 * Restore patterns in translated text
 * Replaces "[N1]", "[N2]", "[E1]", "[I1]", "[U1]" etc. placeholders with actual values
 * Also applies uppercase formatting if the original text was all uppercase
 *
 * @param text - The translated text with placeholders
 * @param replacements - Array of replacement data from applyPatterns()
 * @param isUpperCase - Whether original text was all uppercase
 * @returns Text with placeholders replaced by original values and case formatting applied
 */
export function restorePatterns(
	text: string,
	replacements: PatternReplacement[],
	isUpperCase?: boolean
): string {
	if (!replacements || replacements.length === 0) {
		// No patterns to restore, just apply case formatting
		return applyCaseFormat(text, isUpperCase ?? false)
	}

	let result = text

	// Process replacements in REVERSE order to handle nested placeholders correctly
	// Example: If email is applied first, then numeric, we must restore numeric first, then email
	for (let i = replacements.length - 1; i >= 0; i--) {
		const replacement = replacements[i]

		// Determine placeholder letter based on pattern type
		let placeholderLetter: string
		switch (replacement.pattern) {
			case 'numeric': placeholderLetter = 'N'; break
			case 'email': placeholderLetter = 'E'; break
			case 'uuid': placeholderLetter = 'I'; break
			case 'url': placeholderLetter = 'U'; break
			default:
				throw new Error(`Unknown pattern type: ${replacement.pattern}`)
		}

		// Replace each indexed placeholder with its corresponding value
		for (let j = 0; j < replacement.values.length; j++) {
			const placeholder = `[${placeholderLetter}${j + 1}]`
			result = result.replaceAll(placeholder, replacement.values[j])
		}
	}

	// Apply case formatting after pattern restoration
	return applyCaseFormat(result, isUpperCase ?? false)
}

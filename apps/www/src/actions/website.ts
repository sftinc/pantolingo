'use server'

import dns from 'dns'
import { requireAccountId } from '@/lib/auth'
import {
	canAccessWebsite,
	updateGeneralSettings as dbUpdateGeneralSettings,
	updateTranslationSettings as dbUpdateTranslationSettings,
	enableDevMode as dbEnableDevMode,
	isHostnameTaken,
	getLanguagesWithDnsStatus,
	updateDnsStatus,
	checkAndSetWebsiteVerified,
} from '@pantolingo/db'
import { SUPPORTED_LANGUAGES } from '@pantolingo/lang'
import { VALID_UI_COLORS } from '@/lib/ui-colors'
import { checkHostnameStatus } from '@/lib/perfprox'

const HOSTNAME_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

export async function saveGeneralSettings(
	websiteId: number,
	settings: {
		name: string
		sourceLang: string
		uiColor: string | null
	}
): Promise<{ success: boolean; error?: string }> {
	try {
		const name = settings.name.trim()
		if (!name) {
			return { success: false, error: 'Name is required' }
		}
		if (name.length > 20) {
			return { success: false, error: 'Name too long (max 20 characters)' }
		}
		if (!SUPPORTED_LANGUAGES.includes(settings.sourceLang)) {
			return { success: false, error: 'Invalid source language' }
		}
		if (settings.uiColor !== null && !VALID_UI_COLORS.has(settings.uiColor)) {
			return { success: false, error: 'Invalid accent color' }
		}

		const accountId = await requireAccountId()

		if (!(await canAccessWebsite(accountId, websiteId))) {
			return { success: true } // Silent success - don't leak existence
		}

		return dbUpdateGeneralSettings(websiteId, { name, sourceLang: settings.sourceLang, uiColor: settings.uiColor })
	} catch {
		return { success: false, error: 'An error occurred' }
	}
}

const VALID_SKIP_PATH_TYPES = new Set(['includes', 'startsWith', 'endsWith', 'regex'])

function validateSkipPathEntry(entry: string): string | null {
	const colonIndex = entry.indexOf(':')
	if (colonIndex === -1) {
		return 'Invalid rule format (missing type prefix)'
	}

	const type = entry.slice(0, colonIndex)
	const pattern = entry.slice(colonIndex + 1)

	if (!VALID_SKIP_PATH_TYPES.has(type)) {
		return `Unknown rule type: ${type}`
	}
	if (!pattern) {
		return 'Empty pattern'
	}
	if (pattern.length > 200) {
		return 'Pattern too long (max 200 characters)'
	}

	if (type === 'regex') {
		if (pattern.length > 100) {
			return 'Regex pattern too long (max 100 characters)'
		}
		try {
			new RegExp(pattern)
		} catch {
			return 'Invalid regular expression'
		}
		if (/(\+|\*|\})\)?(\+|\*|\{)/.test(pattern)) {
			return 'Regex pattern may cause performance issues'
		}
	}

	return null
}

export async function saveTranslationSettings(
	websiteId: number,
	settings: {
		skipWords: string[]
		skipPath: string[]
		skipSelectors: string[]
		translatePath: boolean
	}
): Promise<{ success: boolean; error?: string }> {
	try {
		const skipWords = settings.skipWords.map(s => s.trim()).filter(Boolean)
		const skipPath = settings.skipPath.map(s => s.trim()).filter(Boolean)
		const skipSelectors = settings.skipSelectors.map(s => s.trim()).filter(Boolean)

		if (skipWords.length > 50) {
			return { success: false, error: 'Too many skip words (max 50)' }
		}
		if (skipPath.length > 25) {
			return { success: false, error: 'Too many skip paths (max 25)' }
		}
		if (skipSelectors.length > 25) {
			return { success: false, error: 'Too many skip selectors (max 25)' }
		}
		if (skipSelectors.some(s => s.length > 200)) {
			return { success: false, error: 'Skip selector too long (max 200 characters)' }
		}

		// Validate each skip path entry has valid type prefix and pattern
		for (const entry of skipPath) {
			const error = validateSkipPathEntry(entry)
			if (error) {
				return { success: false, error: `Invalid skip path rule: ${error}` }
			}
		}

		const accountId = await requireAccountId()

		if (!(await canAccessWebsite(accountId, websiteId))) {
			return { success: true } // Silent success - don't leak existence
		}

		return dbUpdateTranslationSettings(websiteId, {
			skipWords,
			skipPath,
			skipSelectors,
			translatePath: settings.translatePath,
		})
	} catch {
		return { success: false, error: 'An error occurred' }
	}
}

export async function enableDevMode(
	websiteId: number
): Promise<{ success: boolean; remainingSeconds?: number; error?: string }> {
	try {
		const accountId = await requireAccountId()

		if (!(await canAccessWebsite(accountId, websiteId))) {
			return { success: true } // Silent success - don't leak existence
		}

		return dbEnableDevMode(websiteId)
	} catch {
		return { success: false, error: 'An error occurred' }
	}
}

/**
 * Validate a hostname during the website wizard (step 2).
 * Checks format, DB uniqueness, and DNS resolution.
 */
export async function validateHostname(hostname: string): Promise<{ valid: boolean; error?: string }> {
	try {
		const accountId = await requireAccountId()

		let clean = hostname.trim().toLowerCase()
		clean = clean.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
		if (!clean) return { valid: false, error: 'Hostname is required' }
		if (!HOSTNAME_REGEX.test(clean)) {
			return { valid: false, error: 'Enter a valid hostname (e.g., example.com)' }
		}

		const taken = await isHostnameTaken(clean, accountId)
		if (taken) return { valid: false, error: 'This hostname is already registered' }

		try {
			await dns.promises.resolve(clean)
		} catch {
			return { valid: false, error: 'This hostname does not resolve. Make sure it has a DNS record.' }
		}

		return { valid: true }
	} catch {
		return { valid: false, error: 'An error occurred' }
	}
}

/**
 * Check DNS status for a website language via Perfprox and persist the result.
 * Auto-verifies the website if any language becomes active.
 */
export async function checkDnsStatus(
	websiteId: number,
	websiteLanguageId: number
): Promise<{ success: boolean; dnsStatus?: string; error?: string }> {
	try {
		const accountId = await requireAccountId()

		if (!(await canAccessWebsite(accountId, websiteId))) {
			return { success: false, error: 'Access denied' }
		}

		// Look up the hostname for this language
		const languages = await getLanguagesWithDnsStatus(websiteId)
		const language = languages.find((l) => l.id === websiteLanguageId)
		if (!language) {
			return { success: false, error: 'Language not found' }
		}

		// Check status via Perfprox
		const newStatus = await checkHostnameStatus(language.hostname)
		if (!newStatus) {
			return { success: false, error: 'Unable to check DNS status' }
		}

		// Persist the new status
		const updateResult = await updateDnsStatus(websiteLanguageId, newStatus)
		if (!updateResult.success) {
			return { success: false, error: updateResult.error }
		}

		// Auto-verify website if language is now active
		if (newStatus === 'active') {
			await checkAndSetWebsiteVerified(websiteId)
		}

		return { success: true, dnsStatus: newStatus }
	} catch {
		return { success: false, error: 'An error occurred' }
	}
}

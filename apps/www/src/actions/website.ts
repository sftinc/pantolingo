'use server'

import dns from 'dns'
import { requireAccountId } from '@/lib/auth'
import { canAccessWebsite, updateWebsiteSettings as dbUpdateWebsiteSettings, enableDevMode as dbEnableDevMode, isHostnameTaken } from '@pantolingo/db'
import { SUPPORTED_LANGUAGES } from '@pantolingo/lang'
import { VALID_UI_COLORS } from '@/lib/ui-colors'

const HOSTNAME_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

export async function saveWebsiteSettings(
	websiteId: number,
	settings: {
		name: string
		sourceLang: string
		skipWords: string[]
		skipPath: string[]
		skipSelectors: string[]
		translatePath: boolean
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

		const accountId = await requireAccountId()

		if (!(await canAccessWebsite(accountId, websiteId))) {
			return { success: true } // Silent success - don't leak existence
		}

		return dbUpdateWebsiteSettings(websiteId, {
			...settings,
			name,
			skipWords,
			skipPath,
			skipSelectors,
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

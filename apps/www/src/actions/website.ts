'use server'

import { requireAccountId } from '@/lib/auth'
import { canAccessWebsite, updateWebsiteSettings as dbUpdateWebsiteSettings } from '@pantolingo/db'
import { SUPPORTED_LANGUAGES } from '@pantolingo/lang'

export async function saveWebsiteSettings(
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
		if (!settings.name.trim()) {
			return { success: false, error: 'Name is required' }
		}
		if (settings.name.length > 20) {
			return { success: false, error: 'Name too long (max 20 characters)' }
		}
		if (!SUPPORTED_LANGUAGES.includes(settings.sourceLang)) {
			return { success: false, error: 'Invalid source language' }
		}
		if (settings.skipWords.length > 50) {
			return { success: false, error: 'Too many skip words (max 50)' }
		}
		if (settings.skipPath.length > 25) {
			return { success: false, error: 'Too many skip paths (max 25)' }
		}
		if (settings.skipSelectors.length > 25) {
			return { success: false, error: 'Too many skip selectors (max 25)' }
		}
		if (settings.skipSelectors.some(s => s.length > 200)) {
			return { success: false, error: 'Skip selector too long (max 200 characters)' }
		}

		const accountId = await requireAccountId()

		if (!(await canAccessWebsite(accountId, websiteId))) {
			return { success: true } // Silent success - don't leak existence
		}

		return dbUpdateWebsiteSettings(websiteId, settings)
	} catch {
		return { success: false, error: 'An error occurred' }
	}
}

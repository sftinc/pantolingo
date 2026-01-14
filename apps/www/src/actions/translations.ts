'use server'

import { auth } from '@/lib/auth'
import {
	canAccessWebsite,
	updateSegmentTranslation,
	updatePathTranslation,
	markSegmentReviewed,
	markPathReviewed,
} from '@pantolingo/db'

async function requireProfileId(): Promise<number> {
	const session = await auth()
	if (!session?.user?.profileId) {
		throw new Error('Unauthorized')
	}
	return session.user.profileId
}

export async function saveSegmentTranslation(
	websiteId: number,
	websiteSegmentId: number,
	lang: string,
	text: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const profileId = await requireProfileId()

		if (!(await canAccessWebsite(profileId, websiteId))) {
			return { success: true } // Silent success - don't leak existence
		}

		return updateSegmentTranslation(websiteId, websiteSegmentId, lang, text)
	} catch {
		return { success: false, error: 'An error occurred' }
	}
}

export async function savePathTranslation(
	websiteId: number,
	websitePathId: number,
	lang: string,
	text: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const profileId = await requireProfileId()

		if (!(await canAccessWebsite(profileId, websiteId))) {
			return { success: true } // Silent success - don't leak existence
		}

		return updatePathTranslation(websiteId, websitePathId, lang, text)
	} catch {
		return { success: false, error: 'An error occurred' }
	}
}

export async function reviewSegment(
	websiteId: number,
	websiteSegmentId: number,
	lang: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const profileId = await requireProfileId()

		if (!(await canAccessWebsite(profileId, websiteId))) {
			return { success: true } // Silent success - don't leak existence
		}

		return markSegmentReviewed(websiteId, websiteSegmentId, lang)
	} catch {
		return { success: false, error: 'An error occurred' }
	}
}

export async function reviewPath(
	websiteId: number,
	websitePathId: number,
	lang: string
): Promise<{ success: boolean; error?: string }> {
	try {
		const profileId = await requireProfileId()

		if (!(await canAccessWebsite(profileId, websiteId))) {
			return { success: true } // Silent success - don't leak existence
		}

		return markPathReviewed(websiteId, websitePathId, lang)
	} catch {
		return { success: false, error: 'An error occurred' }
	}
}

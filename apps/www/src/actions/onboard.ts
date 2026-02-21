'use server'

import crypto from 'crypto'
import dns from 'dns'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { pool } from '@pantolingo/db/pool'
import { isHostnameTaken, createWebsiteWithLanguage } from '@pantolingo/db'
import { SUPPORTED_LANGUAGES, deriveTranslationSubdomain } from '@pantolingo/lang'
import { validatePassword, hashPassword } from '@/lib/password'
import { parse } from 'tldts'

const MAX_NAME_LENGTH = 25
const HOSTNAME_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/

export type OnboardActionState = { error?: string } | null

/**
 * Complete profile setup (name + password) during onboarding.
 * On success, redirects to /account.
 */
export async function completeProfile(
	_prevState: OnboardActionState,
	formData: FormData
): Promise<OnboardActionState> {
	const session = await auth()
	if (!session?.user?.accountId) {
		return { error: 'Unauthorized' }
	}

	const firstName = (formData.get('firstName') as string)?.trim()
	if (!firstName) return { error: 'First name is required' }
	if (firstName.length > MAX_NAME_LENGTH) return { error: `First name must be ${MAX_NAME_LENGTH} characters or less` }

	const lastName = (formData.get('lastName') as string)?.trim()
	if (!lastName) return { error: 'Last name is required' }
	if (lastName.length > MAX_NAME_LENGTH) return { error: `Last name must be ${MAX_NAME_LENGTH} characters or less` }

	const password = formData.get('password')
	const confirmPassword = formData.get('confirmPassword')

	if (typeof password !== 'string' || !password) {
		return { error: 'Password is required' }
	}
	if (password !== confirmPassword) {
		return { error: 'Passwords do not match' }
	}

	const passwordError = validatePassword(password)
	if (passwordError) return { error: passwordError }

	const passwordHash = await hashPassword(password)

	try {
		await pool.query(
			`UPDATE account SET first_name = $1, last_name = $2, password_hash = $3, updated_at = NOW() WHERE id = $4`,
			[firstName, lastName, passwordHash, session.user.accountId]
		)
	} catch (error) {
		console.error('Failed to complete profile:', error)
		return { error: 'Failed to save account' }
	}

	redirect('/account')
}

/**
 * Create a website with one or more translation languages.
 * Validates hostname, checks DNS resolution, extracts apex, and creates records.
 */
export async function createWebsite(data: {
	name: string
	hostname: string
	sourceLang: string
	targetLangs: string[]
}): Promise<{ success: boolean; error?: string; publicCode?: string }> {
	const session = await auth()
	if (!session?.user?.accountId) {
		return { success: false, error: 'Unauthorized' }
	}

	const { name, hostname, sourceLang, targetLangs } = data

	// Validate name
	const trimmedName = name.trim()
	if (!trimmedName || trimmedName.length > 100) {
		return { success: false, error: 'Website name must be 1-100 characters' }
	}

	// Validate source language
	if (!SUPPORTED_LANGUAGES.includes(sourceLang)) {
		return { success: false, error: 'Invalid source language' }
	}

	// Validate target languages
	if (targetLangs.length === 0) {
		return { success: false, error: 'At least one target language is required' }
	}
	const uniqueLangs = new Set(targetLangs)
	if (uniqueLangs.size !== targetLangs.length) {
		return { success: false, error: 'Duplicate target languages are not allowed' }
	}
	for (const lang of targetLangs) {
		if (!SUPPORTED_LANGUAGES.includes(lang)) {
			return { success: false, error: `Invalid target language: ${lang}` }
		}
		if (lang === sourceLang) {
			return { success: false, error: 'Target language cannot match source language' }
		}
	}

	// Clean & validate hostname
	let clean = hostname.trim().toLowerCase()
	clean = clean.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
	if (!clean) return { success: false, error: 'Hostname is required' }
	if (!HOSTNAME_REGEX.test(clean)) {
		return { success: false, error: 'Enter a valid hostname (e.g., example.com)' }
	}

	// Check uniqueness
	const taken = await isHostnameTaken(clean, session.user.accountId)
	if (taken) return { success: false, error: 'This hostname is already registered' }

	// Check DNS resolution
	try {
		await dns.promises.resolve(clean)
	} catch {
		return { success: false, error: 'This hostname does not resolve. Make sure it has a DNS record.' }
	}

	// Extract apex domain
	const parsed = parse(clean)
	const apex = parsed.domain
	if (!apex) return { success: false, error: 'Could not determine the apex domain' }

	// Generate publicCode
	const publicCode = crypto.randomBytes(8).toString('hex')

	// Map to target language objects with derived hostnames
	const targetLanguages = targetLangs.map((lang) => ({
		targetLang: lang,
		translationHostname: deriveTranslationSubdomain(lang) + '.' + apex,
	}))

	// Create website + translations
	try {
		await createWebsiteWithLanguage(
			session.user.accountId,
			trimmedName,
			clean,
			sourceLang,
			apex,
			publicCode,
			targetLanguages
		)
	} catch (error: unknown) {
		if (error && typeof error === 'object' && 'code' in error && error.code === '23505') {
			return { success: false, error: 'This hostname is already registered' }
		}
		console.error('Failed to create website:', error)
		return { success: false, error: 'Failed to create website' }
	}

	return { success: true, publicCode }
}

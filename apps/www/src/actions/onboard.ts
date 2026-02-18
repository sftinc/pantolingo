'use server'

import crypto from 'crypto'
import dns from 'dns'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { pool } from '@pantolingo/db/pool'
import { isHostnameTaken, createWebsiteWithTranslation } from '@pantolingo/db'
import { SUPPORTED_LANGUAGES, deriveTranslationSubdomain } from '@pantolingo/lang'
import { validatePassword, hashPassword } from '@/lib/password'
import { parse } from 'tldts'

const MAX_NAME_LENGTH = 25
const HOSTNAME_REGEX = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/
const CODE_REGEX = /^[a-f0-9]{16}$/

function validateCode(code: string): boolean {
	return CODE_REGEX.test(code)
}

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
 * Validate a hostname for uniqueness, DNS resolution, and extract apex domain.
 * Returns pre-generated publicCode on success.
 */
export async function validateHostname(
	hostname: string
): Promise<{ valid: boolean; error?: string; apex?: string; publicCode?: string }> {
	const session = await auth()
	if (!session?.user?.accountId) {
		return { valid: false, error: 'Unauthorized' }
	}

	// Clean hostname
	let clean = hostname.trim().toLowerCase()
	clean = clean.replace(/^https?:\/\//, '').replace(/\/.*$/, '')

	if (!clean) return { valid: false, error: 'Hostname is required' }
	if (!HOSTNAME_REGEX.test(clean)) {
		return { valid: false, error: 'Enter a valid hostname (e.g., example.com)' }
	}

	// Check uniqueness
	const taken = await isHostnameTaken(clean, session.user.accountId)
	if (taken) return { valid: false, error: 'This hostname is already registered' }

	// Check DNS resolution
	try {
		await dns.promises.resolve(clean)
	} catch {
		return { valid: false, error: 'This hostname does not resolve. Make sure it has a DNS record.' }
	}

	// Extract apex domain
	const parsed = parse(clean)
	const apex = parsed.domain
	if (!apex) return { valid: false, error: 'Could not determine the apex domain' }

	// Pre-generate publicCode
	const publicCode = crypto.randomBytes(8).toString('hex')

	return { valid: true, apex, publicCode }
}

/**
 * Verify DNS TXT record and create the website + translation.
 */
export async function verifyDnsAndCreate(data: {
	name: string
	hostname: string
	sourceLang: string
	targetLang: string
	apex: string
	publicCode: string
}): Promise<{ success: boolean; error?: string; publicCode?: string }> {
	const session = await auth()
	if (!session?.user?.accountId) {
		return { success: false, error: 'Unauthorized' }
	}

	const { name, hostname, sourceLang, targetLang, apex, publicCode } = data

	// Re-validate inputs
	const trimmedName = name.trim()
	if (!trimmedName || trimmedName.length > 100) {
		return { success: false, error: 'Website name must be 1-100 characters' }
	}

	if (!SUPPORTED_LANGUAGES.includes(sourceLang)) {
		return { success: false, error: 'Invalid source language' }
	}
	if (!SUPPORTED_LANGUAGES.includes(targetLang)) {
		return { success: false, error: 'Invalid target language' }
	}
	if (sourceLang === targetLang) {
		return { success: false, error: 'Source and target languages must be different' }
	}

	if (!validateCode(publicCode)) {
		return { success: false, error: 'Invalid verification code' }
	}

	// Clean hostname
	const cleanHostname = hostname.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')
	if (!HOSTNAME_REGEX.test(cleanHostname)) {
		return { success: false, error: 'Invalid hostname' }
	}

	// Verify DNS TXT record at _pantolingo.{apex}
	const txtHost = `_pantolingo.${apex}`
	const expectedRecord = `v=${publicCode}`
	try {
		const records = await dns.promises.resolveTxt(txtHost)
		const flat = records.map((r) => r.join('')).map((r) => r.trim())
		if (!flat.includes(expectedRecord)) {
			return { success: false, error: `TXT record not found. Add a TXT record for _pantolingo with value "${expectedRecord}" and try again.` }
		}
	} catch {
		return { success: false, error: `Could not read DNS TXT records for ${txtHost}. Check your DNS configuration.` }
	}

	// Derive translation hostname
	const translationHostname = deriveTranslationSubdomain(targetLang) + '.' + apex

	// Create website + translation
	try {
		await createWebsiteWithTranslation(
			session.user.accountId,
			trimmedName,
			cleanHostname,
			sourceLang,
			apex,
			publicCode,
			targetLang,
			translationHostname
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

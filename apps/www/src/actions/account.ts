'use server'

import { redirect } from 'next/navigation'
import { auth, signOut } from '@/lib/auth'
import { pool } from '@pantolingo/db/pool'
import { createWebsite } from '@pantolingo/db'
import { SUPPORTED_LANGUAGES } from '@pantolingo/lang'
import { validatePassword, hashPassword } from '@/lib/password'

const MAX_NAME_LENGTH = 50

export type AccountActionState = { error?: string; redirectUrl?: string } | null

/**
 * Sign out and redirect to login page
 */
export async function signOutToLogin() {
	await signOut({ redirectTo: '/login' })
}

/**
 * Complete onboarding by setting name and password
 * Signature is compatible with useActionState: (prevState, formData) => Promise<state>
 * On success, returns { redirectUrl: '/account' } for client-side navigation
 */
export async function completeOnboarding(
	_prevState: AccountActionState,
	formData: FormData
): Promise<AccountActionState> {
	const session = await auth()
	if (!session?.user?.accountId) {
		return { error: 'Unauthorized' }
	}

	// Validate name
	const name = formData.get('name')
	if (typeof name !== 'string') {
		return { error: 'Name is required' }
	}

	const trimmedName = name.trim()
	if (!trimmedName) {
		return { error: 'Name is required' }
	}

	if (trimmedName.length > MAX_NAME_LENGTH) {
		return { error: `Name must be ${MAX_NAME_LENGTH} characters or less` }
	}

	// Validate password
	const password = formData.get('password')
	const confirmPassword = formData.get('confirmPassword')

	if (typeof password !== 'string' || !password) {
		return { error: 'Password is required' }
	}

	if (password !== confirmPassword) {
		return { error: 'Passwords do not match' }
	}

	const passwordError = validatePassword(password)
	if (passwordError) {
		return { error: passwordError }
	}

	// Hash password and update account
	const passwordHash = await hashPassword(password)

	try {
		await pool.query(
			`UPDATE account SET name = $1, password_hash = $2, updated_at = NOW() WHERE id = $3`,
			[trimmedName, passwordHash, session.user.accountId]
		)
	} catch (error) {
		console.error('Failed to complete onboarding:', error)
		return { error: 'Failed to save account' }
	}

	redirect('/account/setup')
}

/**
 * Create first website during onboarding (step 2)
 * On success, returns { redirectUrl: '/account/[publicCode]/languages' }
 */
export async function createFirstWebsite(
	_prevState: AccountActionState,
	formData: FormData
): Promise<AccountActionState> {
	const session = await auth()
	if (!session?.user?.accountId) {
		return { error: 'Unauthorized' }
	}

	// Validate name
	const name = (formData.get('name') as string)?.trim()
	if (!name) return { error: 'Website name is required' }
	if (name.length > 100) return { error: 'Name must be 100 characters or less' }

	// Validate hostname (strip protocol, trailing slash)
	let hostname = (formData.get('hostname') as string)?.trim().toLowerCase()
	if (!hostname) return { error: 'Hostname is required' }
	hostname = hostname.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
	if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(hostname)) {
		return { error: 'Enter a valid hostname (e.g., example.com)' }
	}

	// Validate source language
	const sourceLang = formData.get('sourceLang') as string
	if (!sourceLang || !SUPPORTED_LANGUAGES.includes(sourceLang)) {
		return { error: 'Select a source language' }
	}

	let publicCode: string
	try {
		publicCode = await createWebsite(session.user.accountId, name, hostname, sourceLang)
	} catch (error) {
		console.error('Failed to create website:', error)
		return { error: 'Failed to create website' }
	}

	redirect(`/account/${publicCode}/languages`)
}

'use server'

import { redirect } from 'next/navigation'
import { auth, requireAccountId, signOut } from '@/lib/auth'
import { pool } from '@pantolingo/db/pool'
import { createWebsite, updateAccountProfile, getAccountPasswordHash, changeAccountPassword } from '@pantolingo/db'
import { SUPPORTED_LANGUAGES } from '@pantolingo/lang'
import { validatePassword, hashPassword, verifyPassword } from '@/lib/password'

const MAX_NAME_LENGTH = 25

export type AccountActionState = { error?: string; redirectUrl?: string } | null

/**
 * Sign out and redirect to login page
 */
export async function signOutToLogin() {
	await signOut({ redirectTo: '/login' })
}

/**
 * Complete onboarding by setting first name, last name, and password
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

	// Validate first name
	const firstName = (formData.get('firstName') as string)?.trim()
	if (!firstName) {
		return { error: 'First name is required' }
	}
	if (firstName.length > MAX_NAME_LENGTH) {
		return { error: `First name must be ${MAX_NAME_LENGTH} characters or less` }
	}

	// Validate last name
	const lastName = (formData.get('lastName') as string)?.trim()
	if (!lastName) {
		return { error: 'Last name is required' }
	}
	if (lastName.length > MAX_NAME_LENGTH) {
		return { error: `Last name must be ${MAX_NAME_LENGTH} characters or less` }
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
			`UPDATE account SET first_name = $1, last_name = $2, password_hash = $3, updated_at = NOW() WHERE id = $4`,
			[firstName, lastName, passwordHash, session.user.accountId]
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

/**
 * Update profile (first name, last name, email)
 */
export async function updateProfile(
	firstName: string,
	lastName: string,
	email: string
): Promise<{ success: boolean; error?: string }> {
	const accountId = await requireAccountId()

	const trimmedFirst = firstName.trim()
	const trimmedLast = lastName.trim()
	const trimmedEmail = email.trim().toLowerCase()

	if (!trimmedFirst) return { success: false, error: 'First name is required' }
	if (trimmedFirst.length > MAX_NAME_LENGTH) return { success: false, error: `First name must be ${MAX_NAME_LENGTH} characters or less` }

	if (!trimmedLast) return { success: false, error: 'Last name is required' }
	if (trimmedLast.length > MAX_NAME_LENGTH) return { success: false, error: `Last name must be ${MAX_NAME_LENGTH} characters or less` }

	if (!trimmedEmail) return { success: false, error: 'Email is required' }

	return updateAccountProfile(accountId, trimmedFirst, trimmedLast, trimmedEmail)
}

/**
 * Change password (requires old password verification)
 */
export async function changePassword(
	oldPassword: string,
	newPassword: string
): Promise<{ success: boolean; error?: string }> {
	const accountId = await requireAccountId()

	// Verify old password
	const currentHash = await getAccountPasswordHash(accountId)
	if (!currentHash) {
		return { success: false, error: 'No password set on account' }
	}

	const isValid = await verifyPassword(oldPassword, currentHash)
	if (!isValid) {
		return { success: false, error: 'Current password is incorrect' }
	}

	// Validate new password
	const passwordError = validatePassword(newPassword)
	if (passwordError) {
		return { success: false, error: passwordError }
	}

	// Hash and save
	const newHash = await hashPassword(newPassword)
	return changeAccountPassword(accountId, newHash)
}

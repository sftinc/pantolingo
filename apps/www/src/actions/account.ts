'use server'

import { requireAccountId, signOut } from '@/lib/auth'
import { updateAccountProfile, getAccountPasswordHash, changeAccountPassword } from '@pantolingo/db'
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

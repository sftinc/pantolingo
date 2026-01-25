'use server'

import { auth } from '@/lib/auth'
import { pool } from '@pantolingo/db/pool'
import { validatePassword, hashPassword } from '@/lib/password'

const MAX_NAME_LENGTH = 50

export type AccountActionState = { error?: string; redirectUrl?: string } | null

/**
 * Complete onboarding by setting name and password
 * Signature is compatible with useActionState: (prevState, formData) => Promise<state>
 * On success, returns { redirectUrl: '/dashboard' } for client-side navigation
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

	return { redirectUrl: '/dashboard' }
}

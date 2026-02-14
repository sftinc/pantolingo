import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the module under test
vi.mock('next-auth', () => {
	class AuthError extends Error { type = 'AuthError' }
	return { AuthError }
})

vi.mock('@pantolingo/db/pool', () => ({
	pool: { query: vi.fn() },
}))

vi.mock('@/lib/auth', () => ({
	signIn: vi.fn(),
}))

vi.mock('@/lib/turnstile', () => ({
	verifyTurnstileToken: vi.fn(),
}))

vi.mock('@/lib/auth-cookie', () => ({
	createAuthCookie: vi.fn(),
	verifyAuthCookie: vi.fn(),
	setAuthCookie: vi.fn(),
	getAuthCookieToken: vi.fn(),
	clearAuthCookie: vi.fn(),
}))

vi.mock('@/lib/auth-code', () => ({
	isValidCodeFormat: vi.fn(),
}))

vi.mock('@/lib/auth-adapter', () => ({
	getTokenByCode: vi.fn(),
	incrementFailedAttempts: vi.fn(),
}))

vi.mock('@/lib/validation', () => ({
	isValidEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
	getSafeCallbackUrl: (url: string | null) => url || '/account',
}))

import { checkEmailExists, signInWithPassword } from './auth.js'
import { pool } from '@pantolingo/db/pool'
import { signIn } from '@/lib/auth'

const mockPool = pool as unknown as { query: ReturnType<typeof vi.fn> }
const mockSignIn = signIn as ReturnType<typeof vi.fn>

beforeEach(() => {
	vi.clearAllMocks()
})

describe('checkEmailExists', () => {
	it('lowercases the email before querying', async () => {
		mockPool.query.mockResolvedValue({ rows: [{ first_name: 'Jane' }] })

		await checkEmailExists('  User@Example.COM  ')

		expect(mockPool.query).toHaveBeenCalledWith(
			expect.any(String),
			['user@example.com']
		)
	})

	it('trims whitespace from email', async () => {
		mockPool.query.mockResolvedValue({ rows: [] })

		await checkEmailExists('  test@test.com  ')

		expect(mockPool.query).toHaveBeenCalledWith(
			expect.any(String),
			['test@test.com']
		)
	})

	it('returns false for empty email after trim', async () => {
		const result = await checkEmailExists('   ')

		expect(result).toEqual({ exists: false, hasName: false })
		expect(mockPool.query).not.toHaveBeenCalled()
	})
})

describe('signInWithPassword', () => {
	it('trims and lowercases the email', async () => {
		mockSignIn.mockResolvedValue(undefined)

		const formData = new FormData()
		formData.set('email', '  User@Example.COM  ')
		formData.set('password', 'password123')

		await signInWithPassword(null, formData)

		expect(mockSignIn).toHaveBeenCalledWith('credentials', {
			email: 'user@example.com',
			password: 'password123',
			redirect: false,
		})
	})

	it('returns error for missing email', async () => {
		const formData = new FormData()
		formData.set('password', 'password123')

		const result = await signInWithPassword(null, formData)

		expect(result).toEqual({ error: 'Email is required' })
	})

	it('returns error for missing password', async () => {
		const formData = new FormData()
		formData.set('email', 'test@test.com')

		const result = await signInWithPassword(null, formData)

		expect(result).toEqual({ error: 'Password is required' })
	})
})

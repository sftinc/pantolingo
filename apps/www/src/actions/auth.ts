'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'
import { pool } from '@pantolingo/db/pool'
import { verifyTurnstileToken } from '@/lib/turnstile'
import {
	createAuthCookie,
	verifyAuthCookie,
	setAuthCookie,
	getAuthCookieToken,
	clearAuthCookie,
	type AuthFlow,
} from '@/lib/auth-cookie'
import { isValidCodeFormat } from '@/lib/auth-code'
import { getTokenByCode, incrementFailedAttempts } from '@/lib/auth-adapter'
import { isValidEmail, getSafeCallbackUrl } from '@/lib/validation'

export type AuthActionState = { error?: string; redirectUrl?: string } | null

/**
 * Check if an email exists in the database and whether onboarding is complete
 * Used by login flow to determine whether to show password field or magic link flow
 */
export async function checkEmailExists(email: string): Promise<{ exists: boolean; hasName: boolean }> {
	const trimmed = email.trim().toLowerCase()
	if (!trimmed) return { exists: false, hasName: false }

	const result = await pool.query(`SELECT first_name FROM account WHERE email = $1 LIMIT 1`, [trimmed])
	if (result.rows.length === 0) return { exists: false, hasName: false }
	return { exists: true, hasName: !!result.rows[0].first_name }
}

/**
 * Prepare for verification by storing email and flow in auth cookie
 * Called before redirecting to /auth/verify
 *
 * @param email - Email address to store
 * @param flow - Auth flow type ('login' or 'signup')
 * @returns Object with optional error message (absence of error = success)
 */
export async function prepareVerification(email: string, flow: AuthFlow): Promise<{ error?: string }> {
	const trimmed = email.trim().toLowerCase()
	if (!trimmed || !isValidEmail(trimmed)) {
		return { error: 'Please enter a valid email address' }
	}

	try {
		const jwt = await createAuthCookie(trimmed, flow)
		await setAuthCookie(jwt)
		return {}
	} catch {
		return { error: 'Something went wrong. Please try again.' }
	}
}

/**
 * Send magic link to email
 * Magic links always redirect to /account (no callbackUrl support)
 * Reads email from auth cookie (set by prepareVerification)
 *
 * @param formData.turnstileToken - Cloudflare Turnstile token (required)
 */
export async function sendMagicLink(
	_prevState: AuthActionState,
	formData: FormData
): Promise<AuthActionState> {
	// Read email from auth cookie (set by prepareVerification)
	const authToken = await getAuthCookieToken()
	if (!authToken) {
		return { error: 'Session expired. Please start over.' }
	}

	const authData = await verifyAuthCookie(authToken)
	if (!authData) {
		return { error: 'Session expired. Please start over.' }
	}

	// Verify Turnstile token
	const turnstileToken = formData.get('turnstileToken') as string | null
	if (!turnstileToken) {
		return { error: 'Please complete the verification' }
	}
	const turnstileValid = await verifyTurnstileToken(turnstileToken)
	if (!turnstileValid) {
		return { error: 'Verification failed. Please try again.' }
	}

	try {
		await signIn('smtp', {
			email: authData.email,
			redirect: false,
			redirectTo: '/account',
		})
	} catch (error) {
		if (error instanceof AuthError) {
			return { error: 'Failed to send magic link. Please try again.' }
		}
		throw error
	}

	// Always redirect to consolidated check-email page (flow is in the cookie)
	return { redirectUrl: '/auth/check-email' }
}

/**
 * Verify a manually entered code
 * Reads the email from auth cookie (set by prepareVerification)
 *
 * @param formData.code - The 8-character verification code
 */
export async function verifyCode(
	_prevState: AuthActionState,
	formData: FormData
): Promise<AuthActionState> {
	const code = formData.get('code') as string | null

	// Read auth cookie
	const authToken = await getAuthCookieToken()
	if (!authToken) {
		return { error: 'Session expired. Please request a new code.' }
	}

	// Verify auth cookie and extract email
	const authData = await verifyAuthCookie(authToken)
	if (!authData) {
		return { error: 'Session expired. Please request a new code.' }
	}

	if (!code) {
		return { error: 'Please enter the code from your email' }
	}

	const trimmedCode = code.trim()
	if (!isValidCodeFormat(trimmedCode)) {
		return { error: 'Invalid code format' }
	}

	// Look up token by email + code
	const token = await getTokenByCode(authData.email, trimmedCode)
	if (!token) {
		// Increment failed attempts (returns MAX if token was deleted)
		const attempts = await incrementFailedAttempts(authData.email)
		if (attempts >= 5) {
			return { error: 'Too many attempts. Please request a new code.' }
		}
		// Generic message to avoid leaking attempt count (prevents email enumeration)
		return { error: 'Invalid or expired code. Please try again or request a new code.' }
	}

	// Clear the auth cookie on successful verification
	await clearAuthCookie()

	// Return redirect URL for client-side hard navigation
	// (server-side redirect causes soft navigation which fails silently with NextAuth)
	return { redirectUrl: `/auth/magic?token=${encodeURIComponent(token)}` }
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(
	_prevState: AuthActionState,
	formData: FormData
): Promise<AuthActionState> {
	const rawEmail = formData.get('email')
	const password = formData.get('password')
	if (typeof rawEmail !== 'string' || !rawEmail) {
		return { error: 'Email is required' }
	}
	if (typeof password !== 'string' || !password) {
		return { error: 'Password is required' }
	}
	const email = rawEmail.trim().toLowerCase()
	const callbackUrl = getSafeCallbackUrl(formData.get('callbackUrl') as string | null)

	try {
		await signIn('credentials', {
			email,
			password,
			redirect: false,
		})
	} catch (error) {
		if (error instanceof AuthError) {
			return { error: 'Invalid credentials' }
		}
		throw error
	}

	return { redirectUrl: callbackUrl }
}

'use server'

import { signIn } from '@/lib/auth'
import { AuthError } from 'next-auth'
import { pool } from '@pantolingo/db/pool'
import { verifyTurnstileToken } from '@/lib/turnstile'
import {
	createEmailJwt,
	verifyEmailJwt,
	setEmailJwtCookie,
	getEmailJwtFromCookie,
	clearEmailJwtCookie,
} from '@/lib/auth-jwt'
import { isValidCodeFormat } from '@/lib/auth-code'
import { getTokenByCode, incrementFailedAttempts } from '@/lib/auth-adapter'
import { isValidEmail } from '@/lib/validation'

export type AuthActionState = { error?: string; redirectUrl?: string } | null

/**
 * Check if an email exists in the database
 * Used by login flow to verify account exists before showing password field
 */
export async function checkEmailExists(email: string): Promise<boolean> {
	const trimmed = email.trim()
	if (!trimmed) return false

	const result = await pool.query(`SELECT 1 FROM account WHERE email = $1 LIMIT 1`, [trimmed])
	return result.rows.length > 0
}

/**
 * Prepare for verification by storing email in JWT cookie
 * Called before redirecting to /signup/verify or /login/verify
 *
 * @param email - Email address to store
 * @returns Object with optional error message (absence of error = success)
 */
export async function prepareVerification(email: string): Promise<{ error?: string }> {
	const trimmed = email.trim()
	if (!trimmed || !isValidEmail(trimmed)) {
		return { error: 'Please enter a valid email address' }
	}

	try {
		const jwt = await createEmailJwt(trimmed)
		await setEmailJwtCookie(jwt)
		return {}
	} catch {
		return { error: 'Something went wrong. Please try again.' }
	}
}

/**
 * Validate callback URL to prevent open redirects
 * Only allows relative paths starting with / (but not protocol-relative //)
 */
function getSafeCallbackUrl(url: string | null): string {
	if (!url) return '/dashboard'
	if (url.startsWith('/') && !url.startsWith('//')) {
		return url
	}
	return '/dashboard'
}

/**
 * Send magic link to email
 * Magic links always redirect to /dashboard (no callbackUrl support)
 * Reads email from JWT cookie (set by prepareVerification)
 *
 * @param formData.turnstileToken - Cloudflare Turnstile token (required)
 * @param formData.flow - 'signup' or 'login' to determine redirect destination
 */
export async function sendMagicLink(
	_prevState: AuthActionState,
	formData: FormData
): Promise<AuthActionState> {
	// Read email from JWT cookie (set by prepareVerification)
	const emailJwt = await getEmailJwtFromCookie()
	if (!emailJwt) {
		return { error: 'Session expired. Please start over.' }
	}

	const email = await verifyEmailJwt(emailJwt)
	if (!email) {
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
			email,
			redirect: false,
			redirectTo: '/dashboard',
		})
	} catch (error) {
		if (error instanceof AuthError) {
			return { error: 'Failed to send magic link. Please try again.' }
		}
		throw error
	}

	// Redirect to appropriate check-email page based on flow
	const flow = formData.get('flow') as string | null
	const redirectUrl = flow === 'signup' ? '/signup/check-email' : '/login/check-email'
	return { redirectUrl }
}

/**
 * Verify a manually entered code
 * Reads the email JWT from an HTTP-only cookie (set by sendMagicLink)
 *
 * @param formData.code - The 8-character verification code
 */
export async function verifyCode(
	_prevState: AuthActionState,
	formData: FormData
): Promise<AuthActionState> {
	const code = formData.get('code') as string | null

	// Read JWT from HTTP-only cookie
	const emailJwt = await getEmailJwtFromCookie()
	if (!emailJwt) {
		return { error: 'Session expired. Please request a new code.' }
	}

	// Verify JWT and extract email
	const email = await verifyEmailJwt(emailJwt)
	if (!email) {
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
	const token = await getTokenByCode(email, trimmedCode)
	if (!token) {
		// Increment failed attempts (returns MAX if token was deleted)
		const attempts = await incrementFailedAttempts(email)
		if (attempts >= 5) {
			return { error: 'Too many attempts. Please request a new code.' }
		}
		// Generic message to avoid leaking attempt count (prevents email enumeration)
		return { error: 'Invalid or expired code. Please try again or request a new code.' }
	}

	// Clear the email JWT cookie on successful verification
	await clearEmailJwtCookie()

	// Return redirect URL for client-side hard navigation
	// (server-side redirect causes soft navigation which fails silently with NextAuth)
	return { redirectUrl: `/login/magic?token=${encodeURIComponent(token)}` }
}

/**
 * Sign in with email and password
 */
export async function signInWithPassword(
	_prevState: AuthActionState,
	formData: FormData
): Promise<AuthActionState> {
	const email = formData.get('email')
	const password = formData.get('password')
	if (typeof email !== 'string' || !email) {
		return { error: 'Email is required' }
	}
	if (typeof password !== 'string' || !password) {
		return { error: 'Password is required' }
	}
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

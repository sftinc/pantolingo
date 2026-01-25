/**
 * Email JWT utilities for magic link code entry flow
 *
 * Uses next-auth/jwt to create signed JWTs containing the email address.
 * The JWT is stored in an HTTP-only cookie to keep it out of browser history,
 * server logs, and prevent XSS access.
 *
 * Multi-tab note: If a user opens multiple auth tabs, each new magic link
 * request overwrites the cookie. This is acceptable - the latest auth flow wins.
 */

import { cookies, headers } from 'next/headers'
import { encode, decode } from 'next-auth/jwt'

export const EMAIL_JWT_COOKIE = 'pantolingo-email-jwt'

const EMAIL_JWT_MAX_AGE = 10 * 60 // 10 minutes (matches auth token TTL)
const EMAIL_JWT_SALT = 'pantolingo-email-verification'

interface EmailJwtPayload {
	email: string
	purpose: string
}

/**
 * Create a signed JWT containing the email address
 *
 * @param email - The email address to encode
 * @returns The signed JWT string
 */
export async function createEmailJwt(email: string): Promise<string> {
	const secret = process.env.AUTH_SECRET
	if (!secret) {
		throw new Error('AUTH_SECRET not configured')
	}

	return encode<EmailJwtPayload>({
		token: {
			email,
			purpose: 'email-verification',
		},
		secret,
		salt: EMAIL_JWT_SALT,
		maxAge: EMAIL_JWT_MAX_AGE,
	})
}

/**
 * Verify and decode an email JWT
 *
 * @param token - The JWT string to verify
 * @returns The email address if valid, null otherwise
 */
export async function verifyEmailJwt(token: string): Promise<string | null> {
	const secret = process.env.AUTH_SECRET
	if (!secret) {
		console.error('[auth-jwt] AUTH_SECRET not configured')
		return null
	}

	try {
		const decoded = await decode<EmailJwtPayload>({
			token,
			secret,
			salt: EMAIL_JWT_SALT,
		})

		if (!decoded || decoded.purpose !== 'email-verification' || typeof decoded.email !== 'string') {
			return null
		}

		return decoded.email
	} catch {
		return null
	}
}

/**
 * Set the email JWT in an HTTP-only cookie
 *
 * @param jwt - The JWT string to store
 */
export async function setEmailJwtCookie(jwt: string): Promise<void> {
	const cookieStore = await cookies()
	const headerStore = await headers()
	const host = headerStore.get('host') || ''
	const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1')
	cookieStore.set(EMAIL_JWT_COOKIE, jwt, {
		httpOnly: true,
		secure: !isLocalhost,
		sameSite: 'lax',
		path: '/',
		maxAge: EMAIL_JWT_MAX_AGE,
	})
}

/**
 * Get the email JWT from the HTTP-only cookie
 *
 * Note: We read from the raw Cookie header instead of using cookies() API
 * because cookies() can return stale/empty values in certain Next.js render contexts.
 *
 * @returns The JWT string if present, null otherwise
 */
export async function getEmailJwtFromCookie(): Promise<string | null> {
	const headerStore = await headers()
	const cookieHeader = headerStore.get('cookie') || ''

	// Parse the cookie header manually to get our specific cookie
	const cookiePairs = cookieHeader.split(';').map((c) => c.trim())
	const ourCookie = cookiePairs.find((c) => c.startsWith(`${EMAIL_JWT_COOKIE}=`))
	const value = ourCookie ? ourCookie.substring(EMAIL_JWT_COOKIE.length + 1) : null

	return value || null
}

/**
 * Clear the email JWT cookie
 */
export async function clearEmailJwtCookie(): Promise<void> {
	const cookieStore = await cookies()
	cookieStore.delete({ name: EMAIL_JWT_COOKIE, path: '/' })
}

import { NextResponse } from 'next/server'
import { pool } from '@pantolingo/db/pool'
import type { NextRequest } from 'next/server'
import { getSafeCallbackUrl } from '@/lib/validation'

/**
 * Build redirect URL with msg key and preserved callbackUrl
 */
function buildLoginRedirect(baseUrl: string, msgKey: string, callbackUrl: string): URL {
	const params = new URLSearchParams({ msg: msgKey })
	if (callbackUrl) params.set('callbackUrl', callbackUrl)
	return new URL(`/login?${params.toString()}`, baseUrl)
}

/**
 * Redirect clean magic link URL to NextAuth callback
 * /login/magic?token=... -> /api/auth/callback/smtp?token=...&email=...&callbackUrl=...
 *
 * Looks up email from token in database so it doesn't need to be in the URL
 * Uses NextResponse.redirect() for proper HTTP 307 redirects (not soft navigation)
 */
export async function GET(request: NextRequest) {
	const token = request.nextUrl.searchParams.get('token')
	const callbackUrl = getSafeCallbackUrl(request.nextUrl.searchParams.get('callbackUrl'))
	const baseUrl = request.nextUrl.origin

	if (!token) {
		return NextResponse.redirect(buildLoginRedirect(baseUrl, 'missingtoken', callbackUrl))
	}

	// Look up email from token
	const result = await pool.query<{ identifier: string }>(
		`SELECT identifier FROM auth_token WHERE token = $1 AND expires_at > NOW()`,
		[token]
	)

	const email = result.rows[0]?.identifier
	if (!email) {
		return NextResponse.redirect(buildLoginRedirect(baseUrl, 'invalidtoken', callbackUrl))
	}

	// Redirect to NextAuth callback with all required params
	const callbackParams = new URLSearchParams({
		token,
		email,
		callbackUrl,
	})
	return NextResponse.redirect(new URL(`/api/auth/callback/smtp?${callbackParams}`, baseUrl))
}

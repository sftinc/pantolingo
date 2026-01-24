import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { getSafeCallbackUrl } from '@/lib/validation'

// Map NextAuth error codes to message keys
const errorMap: Record<string, string> = {
	Verification: 'invalidtoken',
	Configuration: 'configerror',
	AccessDenied: 'accessdenied',
}

/**
 * Redirect handler that maps NextAuth error codes to ?msg= keys
 * /login/error?error=Verification -> /login?msg=invalidtoken
 */
export function GET(request: NextRequest) {
	const searchParams = request.nextUrl.searchParams
	const error = searchParams.get('error')
	const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'), '')

	// Map to message key, fallback to autherror
	let msgKey = 'autherror'
	if (error && errorMap[error]) {
		msgKey = errorMap[error]
	} else if (error) {
		// Log unknown error codes for visibility
		console.warn(`[auth] Unknown error code: ${error}`)
	}

	// Build redirect URL preserving callbackUrl
	const params = new URLSearchParams({ msg: msgKey })
	if (callbackUrl) {
		params.set('callbackUrl', callbackUrl)
	}

	redirect(`/login?${params.toString()}`)
}

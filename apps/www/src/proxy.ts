import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cookie name must match auth-cookie.ts (can't import due to Edge runtime)
const AUTH_COOKIE_NAME = 'pantolingo-auth'

type MiddlewareFn = (req: NextRequest) => Response | void | Promise<Response | void>

export default auth((req) => {
	const { pathname } = req.nextUrl
	const isLoggedIn = !!req.auth
	const hasName = req.auth?.user?.firstName && req.auth?.user?.lastName

	// Auth pages - redirect to account if already logged in
	if (
		pathname === '/login' ||
		pathname === '/signup' ||
		pathname.startsWith('/auth/')
	) {
		if (isLoggedIn && hasName) {
			return NextResponse.redirect(new URL('/account', req.url))
		}
		return NextResponse.next()
	}

	// Legacy routes — redirect to new paths
	if (pathname === '/onboarding' || pathname === '/account/setup') {
		if (!isLoggedIn) {
			return NextResponse.redirect(new URL('/login', req.url))
		}
		return NextResponse.redirect(
			new URL(hasName ? '/account/website' : '/account/onboard', req.url)
		)
	}

	// Onboard — require session, allow no name
	if (pathname === '/account/onboard') {
		if (!isLoggedIn) {
			return NextResponse.redirect(new URL('/login', req.url))
		}
		return NextResponse.next()
	}

	// Website wizard — require session + name
	if (pathname === '/account/website') {
		if (!isLoggedIn) {
			return NextResponse.redirect(new URL('/login', req.url))
		}
		if (!hasName) {
			return NextResponse.redirect(new URL('/account/onboard', req.url))
		}
		return NextResponse.next()
	}

	// Account routes — require session with name
	if (pathname.startsWith('/account')) {
		if (!isLoggedIn) {
			const callbackUrl = encodeURIComponent(pathname + req.nextUrl.search)
			return NextResponse.redirect(new URL(`/login?callbackUrl=${callbackUrl}`, req.url))
		}
		// Redirect to onboard if no name
		if (!hasName) {
			return NextResponse.redirect(new URL('/account/onboard', req.url))
		}
		// Clear auth cookie on authenticated account access (cleanup after auth flow)
		const response = NextResponse.next()
		response.cookies.delete({ name: AUTH_COOKIE_NAME, path: '/auth' })
		return response
	}

	return NextResponse.next()
}) as MiddlewareFn

export const config = {
	matcher: [
		'/account/:path*',
		'/login',
		'/signup',
		'/onboarding',
		'/auth/:path*',
	],
}

import NextAuth from 'next-auth'
import type { Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import Credentials from 'next-auth/providers/credentials'
import { pool } from '@pantolingo/db/pool'
import { PantolingoAdapter, getUserByEmailWithPassword } from './auth-adapter'
import { SmtpProvider } from './auth-email'
import { verifyPassword } from './password'

const authConfig = {
	trustHost: true,
	adapter: PantolingoAdapter(),
	cookies: {
		sessionToken: {
			name: 'pantolingo-session',
			options: {
				httpOnly: true,
				sameSite: 'lax' as const,
				path: '/',
				secure: process.env.NODE_ENV === 'production',
			},
		},
		csrfToken: {
			name: 'pantolingo-csrf',
			options: {
				httpOnly: true,
				sameSite: 'lax' as const,
				path: '/',
				secure: process.env.NODE_ENV === 'production',
			},
		},
		callbackUrl: {
			name: 'pantolingo-callback',
			options: {
				httpOnly: true,
				sameSite: 'lax' as const,
				path: '/',
				secure: process.env.NODE_ENV === 'production',
			},
		},
	},
	providers: [
		SmtpProvider(),
		Credentials({
			credentials: {
				email: { label: 'Email', type: 'email' },
				password: { label: 'Password', type: 'password' },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null
				}

				const email = (credentials.email as string).trim().toLowerCase()
				const password = credentials.password as string

				const user = await getUserByEmailWithPassword(email)
				if (!user || !user.passwordHash) {
					return null
				}

				const isValid = await verifyPassword(password, user.passwordHash)
				if (!isValid) {
					return null
				}

				return {
					id: user.id,
					accountId: user.accountId,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName,
					name: user.name,
				}
			},
		}),
	],
	session: {
		strategy: 'jwt' as const,
		maxAge: 24 * 60 * 60, // 1 day - logout after 1 day of inactivity
		updateAge: 60 * 60, // 1 hour - refresh token if older than 1 hour
	},
	pages: {
		signIn: '/login',
		verifyRequest: '/auth/check-email',
		error: '/login/error',
	},
	callbacks: {
		async jwt({ token, user }: { token: JWT; user?: { accountId?: number; firstName?: string | null; lastName?: string | null } }) {
			// On sign-in, user is available - persist accountId to token
			if (user?.accountId) {
				token.accountId = user.accountId
				token.firstName = user.firstName
				token.lastName = user.lastName
				// Record last login time
				pool.query(`UPDATE account SET last_login_at = NOW() WHERE id = $1`, [user.accountId]).catch(
					(err) => console.error('Failed to update last_login_at:', err)
				)
			}
			// If firstName is missing from token (e.g. after setup), fetch from DB
			if (!token.firstName && token.accountId) {
				const result = await pool.query<{ first_name: string | null; last_name: string | null; email: string }>(
					`SELECT first_name, last_name, email FROM account WHERE id = $1`,
					[token.accountId]
				)
				if (result.rows[0]) {
					token.firstName = result.rows[0].first_name
					token.lastName = result.rows[0].last_name
					token.email = result.rows[0].email
					token.name = [result.rows[0].first_name, result.rows[0].last_name].filter(Boolean).join(' ') || null
				}
			}
			return token
		},
		async session({ session, token }: { session: Session; token: JWT }) {
			// Read from token, not user
			if (session.user && token.accountId) {
				session.user.accountId = token.accountId as number
				session.user.firstName = token.firstName as string | null
				session.user.lastName = token.lastName as string | null
			}
			return session
		},
	},
}

const nextAuth = NextAuth(authConfig)

export const handlers: { GET: typeof nextAuth.handlers.GET; POST: typeof nextAuth.handlers.POST } =
	nextAuth.handlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const auth: typeof nextAuth.auth = nextAuth.auth as any
export const signIn: typeof nextAuth.signIn = nextAuth.signIn
export const signOut: typeof nextAuth.signOut = nextAuth.signOut

/**
 * Require authentication and return the account ID
 * @throws Error if not authenticated
 */
export async function requireAccountId(): Promise<number> {
	const session = await auth()
	if (!session?.user?.accountId) {
		throw new Error('Unauthorized')
	}
	return session.user.accountId
}

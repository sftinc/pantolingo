import 'next-auth'
import 'next-auth/jwt'

declare module 'next-auth' {
	interface Session {
		user: {
			id: string
			accountId: number
			email: string
			name?: string | null
			firstName?: string | null
			lastName?: string | null
		}
	}

	interface User {
		id: string
		accountId: number
		email: string
		name?: string | null
		firstName?: string | null
		lastName?: string | null
	}
}

declare module 'next-auth/jwt' {
	interface JWT {
		accountId?: number
		firstName?: string | null
		lastName?: string | null
	}
}

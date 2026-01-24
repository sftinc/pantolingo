export type MessageType = 'error' | 'success' | 'warning' | 'info'

export type Message = {
	type: MessageType
	text: string
	title?: string
	icon?: boolean | string
	dismissible?: boolean
	duration?: number // auto-dismiss in seconds (0 = permanent)
	link?: string
	linkText?: string
	page?: string | string[] // Optional: restrict to specific page(s)
}

// Keys must be lowercase alphanumeric only
export const messages: Record<string, Message> = {
	logout: {
		type: 'success',
		text: 'You have been signed out successfully.',
		page: '/login',
	},
	sessionexpired: {
		type: 'error',
		title: 'Session Expired',
		text: 'Your session has expired.',
		link: '/login',
		linkText: 'Log in again',
	},
	invalidtoken: {
		type: 'error',
		text: 'The magic link has expired or is invalid.',
		page: '/login',
	},
	missingtoken: {
		type: 'error',
		text: 'Magic link token is missing.',
		page: '/login',
	},
	configerror: {
		type: 'error',
		text: 'Server configuration error. Please try again later.',
	},
	accessdenied: {
		type: 'error',
		text: 'Access was denied. Please try again.',
		page: '/login',
	},
	autherror: {
		type: 'error',
		text: 'Something went wrong during sign in. Please try again.',
		page: '/login',
	},
}

export function getMessage(key: string | null, pathname?: string): Message | null {
	if (!key) return null
	// Validate key format: lowercase alphanumeric only
	if (!/^[a-z0-9]+$/.test(key)) {
		console.warn(`[messages] Invalid message key format: ${key}`)
		return null
	}
	const msg = messages[key]
	if (!msg) {
		console.warn(`[messages] Unknown message key: ${key}`)
		return null
	}
	// Check page restriction if set
	if (msg.page && pathname) {
		const pages = Array.isArray(msg.page) ? msg.page : [msg.page]
		if (!pages.includes(pathname)) return null
	}
	return msg
}

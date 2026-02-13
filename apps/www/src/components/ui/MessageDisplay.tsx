'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getMessage, type Message } from '@/lib/messages'

interface MessageDisplayProps {
	hidden?: boolean // Hide the message (for form submit pattern)
	className?: string
}

// Use CSS variables with inline styles for consistent theming
const typeColors: Record<string, string> = {
	error: 'var(--error)',
	success: 'var(--success)',
	warning: 'var(--warning)',
	info: 'var(--accent)',
}

export function MessageDisplay({ hidden, className = '' }: MessageDisplayProps) {
	const searchParams = useSearchParams()
	const pathname = usePathname()
	const router = useRouter()
	const [message, setMessage] = useState<Message | null>(null)
	const [dismissed, setDismissed] = useState(false)

	// On mount: read msg param, store in state, clear URL
	useEffect(() => {
		const msgKey = searchParams.get('msg')
		const msg = getMessage(msgKey, pathname)

		if (msg) {
			setMessage(msg)
			setDismissed(false)

			// Clear msg param from URL while preserving others
			const params = new URLSearchParams(searchParams.toString())
			params.delete('msg')
			const newUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname
			router.replace(newUrl, { scroll: false })
		}
	}, [searchParams, pathname, router])

	// Auto-dismiss timer
	useEffect(() => {
		if (message?.duration && message.duration > 0) {
			const timer = setTimeout(() => {
				setDismissed(true)
			}, message.duration * 1000)
			return () => clearTimeout(timer)
		}
	}, [message])

	// Don't render if hidden, dismissed, or no message
	if (hidden || dismissed || !message) {
		return null
	}

	const color = typeColors[message.type] || typeColors.info

	return (
		<div
			className={`mb-4 p-3 rounded-md border ${className}`}
			style={{
				backgroundColor: `color-mix(in srgb, ${color} 10%, transparent)`,
				borderColor: color,
				color: color,
			}}
			role="alert"
		>
			<div className="flex items-start justify-between gap-2">
				<div className="flex-1">
					{message.title && (
						<p className="font-semibold mb-1">{message.title}</p>
					)}
					<p className="text-sm">{message.text}</p>
					{message.link && message.linkText && (
						<Link
							href={message.link}
							className="text-sm underline hover:no-underline mt-1 inline-block"
						>
							{message.linkText}
						</Link>
					)}
				</div>
				{message.dismissible && (
					<button
						type="button"
						onClick={() => setDismissed(true)}
						className="text-current opacity-70 hover:opacity-100 transition-opacity"
						aria-label="Dismiss message"
					>
						<svg
							className="w-4 h-4"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				)}
			</div>
		</div>
	)
}

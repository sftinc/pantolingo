'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getMessage, type Message } from '@/lib/messages'

interface MessageDisplayProps {
	hidden?: boolean // Hide the message (for form submit pattern)
	className?: string
}

const typeStyles: Record<string, string> = {
	error: 'bg-red-600/10 dark:bg-red-500/10 border-red-600 dark:border-red-500 text-red-600 dark:text-red-500',
	success: 'bg-green-600/10 dark:bg-green-500/10 border-green-600 dark:border-green-500 text-green-600 dark:text-green-500',
	warning: 'bg-yellow-600/10 dark:bg-yellow-500/10 border-yellow-600 dark:border-yellow-500 text-yellow-600 dark:text-yellow-500',
	info: 'bg-blue-600/10 dark:bg-blue-500/10 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-500',
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

	const styles = typeStyles[message.type] || typeStyles.info

	return (
		<div
			className={`mb-4 p-3 rounded-md border ${styles} ${className}`}
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

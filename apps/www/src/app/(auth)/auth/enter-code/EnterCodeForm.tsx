'use client'

import { useState, useEffect, useActionState } from 'react'
import Link from 'next/link'
import { Spinner } from '@/components/ui/Spinner'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { verifyCode, type AuthActionState } from '@/actions/auth'

// Safe charset matching auth-code.ts (excludes 0/O, 1/I/L)
const SAFE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function EnterCodeForm() {
	const [code, setCode] = useState('')
	const [isRedirecting, setIsRedirecting] = useState(false)
	const [state, formAction] = useActionState<AuthActionState, FormData>(verifyCode, null)

	// Handle successful verification - perform hard redirect
	// (soft navigation via server redirect fails silently with NextAuth)
	useEffect(() => {
		if (state?.redirectUrl) {
			setIsRedirecting(true)
			window.location.href = state.redirectUrl
		}
	}, [state?.redirectUrl])

	// Handle code input - uppercase and filter to safe charset only
	const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value.toUpperCase()
		const filtered = [...value].filter((c) => SAFE_CHARSET.includes(c)).join('')
		if (filtered.length <= 8) {
			setCode(filtered)
		}
	}

	return (
		<>
			{state?.error && (
				<div className="mb-4 p-3 bg-red-600/10 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-md text-sm">
					{state.error}
				</div>
			)}

			<form action={formAction}>
				<input
					type="text"
					name="code"
					value={code}
					onChange={handleCodeChange}
					autoFocus
					autoComplete="one-time-code"
					placeholder="XXXXXXXX"
					className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 placeholder:text-gray-600 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 mb-4"
					maxLength={8}
				/>

				{isRedirecting ? (
					<button
						type="button"
						disabled
						className="w-full py-3 rounded-md font-medium bg-blue-600 dark:bg-blue-500 text-white opacity-50 cursor-not-allowed"
					>
						<Spinner size="sm" className="mx-auto" />
					</button>
				) : (
					<SubmitButton>Continue with login code</SubmitButton>
				)}
			</form>

			<Link
				href="/auth/check-email"
				className="mt-4 inline-block text-sm text-blue-600 dark:text-blue-500 hover:underline"
			>
				Back to check email
			</Link>
		</>
	)
}

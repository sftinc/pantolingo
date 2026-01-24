'use client'

import { useState, useEffect, useActionState } from 'react'
import Link from 'next/link'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { verifyCode, type AuthActionState } from '@/actions/auth'

// Safe charset matching auth-code.ts (excludes 0/O, 1/I/L)
const SAFE_CHARSET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'

export function EnterCodeForm() {
	const [code, setCode] = useState('')
	const [state, formAction] = useActionState<AuthActionState, FormData>(verifyCode, null)

	// Handle successful verification - perform hard redirect
	// (soft navigation via server redirect fails silently with NextAuth)
	useEffect(() => {
		if (state?.redirectUrl) {
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
				<div className="mb-4 p-3 bg-[var(--error)]/10 text-[var(--error)] rounded-md text-sm">
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
					className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest rounded-md border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-body)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] mb-4"
					maxLength={8}
				/>

				<SubmitButton>Continue with login code</SubmitButton>
			</form>

			<Link
				href="/login/check-email"
				className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
			>
				Back to check email
			</Link>
		</>
	)
}

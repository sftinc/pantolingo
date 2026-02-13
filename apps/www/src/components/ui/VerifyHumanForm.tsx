'use client'

import { useState, useRef, useEffect, useActionState, startTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Turnstile } from '@/components/ui/Turnstile'
import { Spinner } from '@/components/ui/Spinner'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { sendMagicLink, type AuthActionState } from '@/actions/auth'

interface VerifyHumanFormProps {
	turnstileSiteKey: string
	flow: 'login' | 'signup'
}

/**
 * Shared verification page component for /auth/verify
 * Displays Turnstile widget and auto-submits on successful verification
 */
export function VerifyHumanForm({ turnstileSiteKey, flow }: VerifyHumanFormProps) {
	const router = useRouter()
	const formRef = useRef<HTMLFormElement>(null)
	const [turnstileKey, setTurnstileKey] = useState(0)
	const [turnstileError, setTurnstileError] = useState<string | null>(null)

	// Derive back link from flow
	const backHref = flow === 'signup' ? '/signup' : '/login'
	const backText = flow === 'signup' ? 'Back to signup' : 'Back to login'

	const [state, formAction, isPending] = useActionState<AuthActionState, FormData>(sendMagicLink, null)

	// Handle redirect or reset Turnstile on error
	useEffect(() => {
		if (state?.redirectUrl) {
			router.push(state.redirectUrl)
		} else if (state?.error) {
			setTurnstileKey((k) => k + 1)
		}
	}, [state, router])

	const handleVerify = (token: string) => {
		setTurnstileError(null)
		// Create form data with token and submit
		const formData = new FormData()
		formData.set('turnstileToken', token)
		startTransition(() => {
			formAction(formData)
		})
	}

	const handleError = () => {
		setTurnstileError('Verification failed. Please try again.')
		setTurnstileKey((k) => k + 1)
	}

	const handleExpired = () => {
		setTurnstileKey((k) => k + 1)
	}

	const error = turnstileError || state?.error

	return (
		<main className="flex min-h-screen flex-col">
			<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-end">
				<ThemeToggle />
			</div>
			<div className="flex flex-1 flex-col items-center justify-center p-6">
				<div className="w-full max-w-md bg-[var(--card-bg)] p-10 rounded-lg shadow-[0_2px_8px_var(--shadow-color)]">
					<h1 className="text-3xl font-semibold mb-6 text-[var(--text-heading)] text-center">
						Verifying it&apos;s you
					</h1>

					{error && (
						<div className="mb-4 p-3 bg-[var(--error)]/10 text-[var(--error)] rounded-md text-sm text-center">
							{error}
						</div>
					)}

					<div className="mb-6 flex items-center justify-center min-h-[65px]">
						{isPending ? (
							<Spinner size="md" />
						) : (
							<Turnstile
								key={turnstileKey}
								siteKey={turnstileSiteKey}
								onVerify={handleVerify}
								onError={handleError}
								onExpired={handleExpired}
							/>
						)}
					</div>

					{/* Hidden form for reference (actual submission happens programmatically) */}
					<form ref={formRef} action={formAction} className="hidden">
						<input type="hidden" name="turnstileToken" value="" />
					</form>

					<p className="text-center text-sm text-[var(--text-muted)]">
						<Link href={backHref} className="text-[var(--accent)] hover:underline">
							{backText}
						</Link>
					</p>
				</div>
			</div>
		</main>
	)
}

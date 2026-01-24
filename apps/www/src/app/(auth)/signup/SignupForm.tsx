'use client'

import { useState, useActionState } from 'react'
import Link from 'next/link'
import { FormInput } from '@/components/ui/FormInput'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { Turnstile } from '@/components/ui/Turnstile'
import { sendMagicLink, type AuthActionState } from '@/actions/auth'
import { isValidEmail } from '@/lib/validation'

interface SignupFormProps {
	turnstileSiteKey: string
}

export function SignupForm({ turnstileSiteKey }: SignupFormProps) {
	const [email, setEmail] = useState('')
	const [emailError, setEmailError] = useState<string | null>(null)
	const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
	const [state, formAction] = useActionState<AuthActionState, FormData>(sendMagicLink, null)

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value)
		setEmailError(null)
	}

	const handleSubmit = (formData: FormData) => {
		const emailValue = (formData.get('email') as string)?.trim()
		if (!emailValue) {
			setEmailError('Email is required')
			return
		}
		if (!isValidEmail(emailValue)) {
			setEmailError('Please enter a valid email address')
			return
		}
		if (turnstileToken) {
			formData.set('turnstileToken', turnstileToken)
		}
		formAction(formData)
	}

	const error = emailError || state?.error

	return (
		<main className="flex min-h-screen flex-col">
			<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-end">
				<ThemeToggle />
			</div>
			<div className="flex flex-1 flex-col items-center justify-center p-6">
				<div className="w-full max-w-md bg-[var(--card-bg)] p-10 rounded-lg shadow-[0_2px_8px_var(--shadow-color)]">
					<h1 className="text-3xl font-semibold mb-2 text-[var(--text-heading)] text-center">
						Create your account
					</h1>
					<p className="text-base text-[var(--text-muted)] mb-6 text-center">
						Enter your email to get started
					</p>

					{error && (
						<div className="mb-4 p-3 bg-[var(--error)]/10 text-[var(--error)] rounded-md text-sm">{error}</div>
					)}

					<form action={handleSubmit}>
						<FormInput
							id="email"
							name="email"
							type="email"
							required
							autoFocus
							placeholder="you@example.com"
							label="Email address"
							value={email}
							onChange={handleEmailChange}
							className="mb-4"
						/>
						{turnstileSiteKey && (
							<div className="mb-4">
								<Turnstile siteKey={turnstileSiteKey} onVerify={setTurnstileToken} />
							</div>
						)}
						<SubmitButton>Continue</SubmitButton>
					</form>

					<p className="mt-6 text-center text-sm text-[var(--text-muted)]">
						Already have an account?{' '}
						<Link href="/login" className="text-[var(--accent)] hover:underline">
							Sign in
						</Link>
					</p>
				</div>
			</div>
		</main>
	)
}

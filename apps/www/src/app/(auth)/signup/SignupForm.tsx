'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { FormInput } from '@/components/ui/FormInput'
import { Spinner } from '@/components/ui/Spinner'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { prepareVerification } from '@/actions/auth'
import { isValidEmail } from '@/lib/validation'

export function SignupForm() {
	const router = useRouter()
	const [email, setEmail] = useState('')
	const [emailError, setEmailError] = useState<string | null>(null)
	const [serverError, setServerError] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value)
		setEmailError(null)
		setServerError(null)
	}

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		const emailValue = email.trim().toLowerCase()
		if (!emailValue) {
			setEmailError('Email is required')
			return
		}
		if (!isValidEmail(emailValue)) {
			setEmailError('Please enter a valid email address')
			return
		}
		setEmail(emailValue)

		startTransition(async () => {
			const result = await prepareVerification(emailValue, 'signup')
			if (result.error) {
				setServerError(result.error)
			} else {
				router.push('/auth/verify')
			}
		})
	}

	const error = emailError || serverError

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

					<form onSubmit={handleSubmit}>
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
						<button
							type="submit"
							disabled={isPending}
							className="w-full py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
						>
							{isPending ? <Spinner size="sm" /> : 'Continue'}
						</button>
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

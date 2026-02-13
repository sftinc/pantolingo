'use client'

import { useState, useActionState, useTransition, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { FormInput } from '@/components/ui/FormInput'
import { MessageDisplay } from '@/components/ui/MessageDisplay'
import { Spinner } from '@/components/ui/Spinner'
import { SubmitButton } from '@/components/ui/SubmitButton'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import {
	checkEmailExists,
	prepareVerification,
	signInWithPassword,
	type AuthActionState,
} from '@/actions/auth'
import { isValidEmail, getSafeCallbackUrl } from '@/lib/validation'

type LoginStep = 'email' | 'password'

export function LoginForm() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const callbackUrl = getSafeCallbackUrl(searchParams.get('callbackUrl'))

	const [step, setStep] = useState<LoginStep>('email')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [emailError, setEmailError] = useState<string | null>(null)
	const [passwordError, setPasswordError] = useState<string | null>(null)
	const [forgotPasswordError, setForgotPasswordError] = useState<string | null>(null)
	const [isPending, startTransition] = useTransition()
	const [isForgotPending, startForgotTransition] = useTransition()
	const [hasSubmitted, setHasSubmitted] = useState(false)

	const [passwordState, passwordAction] = useActionState<AuthActionState, FormData>(
		signInWithPassword,
		null
	)

	// Handle redirect after successful password login
	useEffect(() => {
		if (passwordState?.redirectUrl) {
			router.push(passwordState.redirectUrl)
		}
	}, [passwordState, router])

	// Handle email step submission
	const handleEmailSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setHasSubmitted(true)
		setEmailError(null)

		const trimmedEmail = email.trim()
		if (!trimmedEmail) {
			setEmailError('Email is required')
			return
		}
		if (!isValidEmail(trimmedEmail)) {
			setEmailError('Please enter a valid email address')
			return
		}

		startTransition(async () => {
			const { exists, hasName } = await checkEmailExists(trimmedEmail)
			if (!exists) {
				setEmailError('No account found with this email')
			} else if (!hasName) {
				// User hasn't completed onboarding (no name/password) — skip to magic link flow
				const result = await prepareVerification(trimmedEmail, 'login')
				if (result.error) {
					setEmailError(result.error)
				} else {
					router.push('/auth/verify')
				}
			} else {
				setStep('password')
			}
		})
	}

	// Handle password step submission
	const handlePasswordSubmit = (formData: FormData) => {
		setPasswordError(null)
		const pwd = (formData.get('password') as string) || ''

		if (pwd.length < 8) {
			setPasswordError('Password must be at least 8 characters')
			return
		}

		passwordAction(formData)
	}

	// Handle forgot password - redirect to verify page
	const handleForgotPassword = () => {
		setForgotPasswordError(null)
		startForgotTransition(async () => {
			const result = await prepareVerification(email.trim(), 'login')
			if (result.error) {
				setForgotPasswordError(result.error)
			} else {
				router.push('/auth/verify')
			}
		})
	}

	// Map action error codes to user-friendly messages
	const getErrorMessage = (error: string) => {
		switch (error) {
			case 'CredentialsSignin':
				return 'Invalid credentials'
			default:
				return error
		}
	}

	// Combine inline errors from form validation and action states
	const inlineError = emailError || passwordError || forgotPasswordError || passwordState?.error

	return (
		<main className="flex min-h-screen flex-col">
			<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-end">
				<ThemeToggle />
			</div>
			<div className="flex flex-1 flex-col items-center justify-center p-6">
				<div className="w-full max-w-md bg-[var(--card-bg)] p-10 rounded-lg shadow-[0_2px_8px_var(--shadow-color)]">
					<h1 className="text-3xl font-semibold mb-2 text-[var(--text-heading)] text-center">
						Login to Pantolingo
					</h1>
					<p className="text-base text-[var(--text-muted)] mb-6 text-center">
						{step === 'email' ? 'Enter your email to continue' : 'Enter your password'}
					</p>

					<MessageDisplay hidden={hasSubmitted} />

					{inlineError && (
						<div className="mb-4 p-3 bg-[var(--error)]/10 text-[var(--error)] rounded-md text-sm">
							{getErrorMessage(inlineError)}
						</div>
					)}

					{step === 'email' ? (
						<form onSubmit={handleEmailSubmit}>
							<FormInput
								id="email"
								name="email"
								type="email"
								required
								autoFocus
								placeholder="you@example.com"
								label="Email address"
								value={email}
								onChange={(e) => {
									setEmail(e.target.value)
									setEmailError(null)
								}}
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
					) : (
						<form action={handlePasswordSubmit}>
							<input type="hidden" name="callbackUrl" value={callbackUrl} />
							<input type="hidden" name="email" value={email.trim()} />

							{/* Show email styled as readonly input */}
							<div className="mb-4">
								<label className="block text-sm font-medium text-[var(--text-body)] mb-2">
									Email address
								</label>
								<div className="flex items-center justify-between px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--input-bg)]">
									<span className="text-[var(--text-muted)]">{email.trim()}</span>
									<button
										type="button"
										onClick={() => {
											setStep('email')
											setPassword('')
											setPasswordError(null)
											setForgotPasswordError(null)
										}}
										className="text-sm text-[var(--accent)] hover:underline"
									>
										Change
									</button>
								</div>
							</div>

							<FormInput
								id="password"
								name="password"
								type="password"
								required
								autoFocus
								placeholder="Enter your password"
								label="Password"
								value={password}
								onChange={(e) => {
									setPassword(e.target.value)
									setPasswordError(null)
								}}
								className="mb-2"
							/>

							<div className="mb-4 text-right">
								<button
									type="button"
									onClick={handleForgotPassword}
									disabled={isForgotPending}
									className="text-sm text-[var(--accent)] hover:underline disabled:opacity-50"
								>
									{isForgotPending ? 'Loading...' : 'Forgot password?'}
								</button>
							</div>

							<SubmitButton>Login to Pantolingo</SubmitButton>
						</form>
					)}

					<p className="mt-6 text-center text-sm text-[var(--text-muted)]">
						Don&apos;t have an account?{' '}
						<Link href="/signup" className="text-[var(--accent)] hover:underline">
							Sign up
						</Link>
					</p>
				</div>
			</div>
		</main>
	)
}

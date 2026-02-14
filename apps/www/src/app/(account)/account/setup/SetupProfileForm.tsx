'use client'

import { useState, useActionState } from 'react'
import { completeOnboarding, type AccountActionState } from '@/actions/account'
import { getPasswordRules } from '@/lib/password'
import { PasswordRulesList } from '@/components/ui/PasswordRulesList'

export default function SetupProfileForm() {
	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [password, setPassword] = useState('')
	const rules = getPasswordRules(password)

	const [state, formAction, isPending] = useActionState<AccountActionState, FormData>(
		completeOnboarding,
		null
	)

	return (
		<main className="flex flex-1 flex-col items-center px-4 py-12 sm:px-6">
			<div className="text-center mb-8">
				<h1 className="text-3xl font-bold text-[var(--text-heading)] mb-3">
					Welcome
				</h1>
				<p className="text-base text-[var(--text-muted)] max-w-md">
					Let&apos;s finish setting up your account. Enter your name and password to secure your account.
				</p>
			</div>

			<div className="w-full max-w-md bg-[var(--card-bg)] p-8 sm:p-10 rounded-lg shadow-[0_2px_8px_var(--shadow-color)]">
				{state?.error && (
					<div className="mb-4 p-3 bg-[var(--error)]/10 text-[var(--error)] rounded-md text-sm">
						{state.error}
					</div>
				)}

				<form action={formAction}>
					<div className="flex gap-3 mb-4">
						<div className="flex-1">
							<label
								htmlFor="firstName"
								className="block text-sm font-medium text-[var(--text-body)] mb-2"
							>
								First name
							</label>
							<input
								id="firstName"
								name="firstName"
								type="text"
								required
								autoFocus
								maxLength={25}
								disabled={isPending}
								placeholder="Jane"
								value={firstName}
								onChange={(e) => setFirstName(e.target.value)}
								className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-body)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50"
							/>
						</div>
						<div className="flex-1">
							<label
								htmlFor="lastName"
								className="block text-sm font-medium text-[var(--text-body)] mb-2"
							>
								Last name
							</label>
							<input
								id="lastName"
								name="lastName"
								type="text"
								required
								maxLength={25}
								disabled={isPending}
								placeholder="Smith"
								value={lastName}
								onChange={(e) => setLastName(e.target.value)}
								className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-body)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50"
							/>
						</div>
					</div>

					<label
						htmlFor="password"
						className="block text-sm font-medium text-[var(--text-body)] mb-2"
					>
						Password
					</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						maxLength={50}
						disabled={isPending}
						placeholder="Create a password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-body)] mb-2 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50"
					/>
					<PasswordRulesList rules={rules} password={password} />

					<label
						htmlFor="confirmPassword"
						className="block text-sm font-medium text-[var(--text-body)] mb-2"
					>
						Confirm password
					</label>
					<input
						id="confirmPassword"
						name="confirmPassword"
						type="password"
						required
						maxLength={50}
						disabled={isPending}
						placeholder="Confirm your password"
						className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-body)] mb-6 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50"
					/>

					<button
						type="submit"
						tabIndex={0}
						disabled={isPending}
						className="w-full py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isPending ? 'Saving...' : 'Continue'}
					</button>
				</form>
			</div>
		</main>
	)
}

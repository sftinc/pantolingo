'use client'

import { useState, useActionState } from 'react'
import { completeOnboarding, type AccountActionState } from '@/actions/account'
import { getPasswordRules, type PasswordRules } from '@/lib/password'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

function PasswordRulesList({ rules, password }: { rules: PasswordRules; password: string }) {
	const ruleItems = [
		{ key: 'minLength' as const, label: 'At least 8 characters' },
		{ key: 'hasLowercase' as const, label: 'At least 1 lowercase letter' },
		{ key: 'hasUppercase' as const, label: 'At least 1 uppercase letter' },
		{ key: 'hasNumber' as const, label: 'At least 1 number' },
		{ key: 'hasSpecial' as const, label: 'At least 1 special character' },
		{ key: 'noSpaces' as const, label: 'No spaces' },
	]

	return (
		<ul className="text-xs mb-4 space-y-1">
			{ruleItems.map(({ key, label }) => {
				const passed = rules[key]
				// Only show green check if password has content and rule passes
				const showPassed = password.length > 0 && passed
				return (
					<li
						key={key}
						className={showPassed ? 'text-green-600' : 'text-[var(--text-muted)]'}
					>
						{showPassed ? '✓' : '○'} {label}
					</li>
				)
			})}
		</ul>
	)
}

export default function OnboardingPage() {
	const [password, setPassword] = useState('')
	const rules = getPasswordRules(password)

	const [state, formAction, isPending] = useActionState<AccountActionState, FormData>(
		completeOnboarding,
		null
	)

	return (
		<main className="flex min-h-screen flex-col">
			<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-end">
				<ThemeToggle />
			</div>
			<div className="flex flex-1 flex-col items-center justify-center p-6">
			<div className="w-full max-w-md bg-[var(--card-bg)] p-10 rounded-lg shadow-[0_2px_8px_var(--shadow-color)]">
				<h1 className="text-3xl font-semibold mb-2 text-[var(--text-heading)] text-center">
					Welcome to Pantolingo
				</h1>
				<p className="text-base text-[var(--text-muted)] mb-8 text-center">
					Let&apos;s get you set up
				</p>

				{state?.error && (
					<div className="mb-4 p-3 bg-[var(--error)]/10 text-[var(--error)] rounded-md text-sm">
						{state.error}
					</div>
				)}

				<form action={formAction}>
					{/* Name field */}
					<label
						htmlFor="name"
						className="block text-sm font-medium text-[var(--text-body)] mb-2"
					>
						Your name
					</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						autoFocus
						maxLength={50}
						disabled={isPending}
						placeholder="Jane Smith"
						className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-body)] mb-4 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50"
					/>

					{/* Password field */}
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

					{/* Confirm password field */}
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
						disabled={isPending}
						className="w-full py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isPending ? 'Saving...' : 'Continue'}
					</button>
				</form>
			</div>
			</div>
		</main>
	)
}

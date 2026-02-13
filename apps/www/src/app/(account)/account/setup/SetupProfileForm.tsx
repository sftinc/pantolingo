'use client'

import { useState, useActionState } from 'react'
import { completeOnboarding, type AccountActionState } from '@/actions/account'
import { getPasswordRules, type PasswordRules } from '@/lib/password'

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
				const showPassed = password.length > 0 && passed
				return (
					<li
						key={key}
						className={showPassed ? 'text-green-600' : 'text-gray-600 dark:text-gray-400'}
					>
						{showPassed ? '✓' : '○'} {label}
					</li>
				)
			})}
		</ul>
	)
}

export default function SetupProfileForm() {
	const [name, setName] = useState('')
	const [password, setPassword] = useState('')
	const rules = getPasswordRules(password)

	const [state, formAction, isPending] = useActionState<AccountActionState, FormData>(
		completeOnboarding,
		null
	)

	return (
		<main className="flex flex-1 flex-col items-center px-4 py-12 sm:px-6">
			<div className="text-center mb-8">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
					Welcome
				</h1>
				<p className="text-base text-gray-600 dark:text-gray-400 max-w-md">
					Let&apos;s finish setting up your account. Enter your name and password to secure your account.
				</p>
			</div>

			<div className="w-full max-w-md bg-white dark:bg-neutral-900 p-8 sm:p-10 rounded-lg shadow-md shadow-black/10 dark:shadow-black/30">
				{state?.error && (
					<div className="mb-4 p-3 bg-red-600/10 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-md text-sm">
						{state.error}
					</div>
				)}

				<form action={formAction}>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2"
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
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
					/>

					<label
						htmlFor="password"
						className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2"
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
						className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 mb-2 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
					/>
					<PasswordRulesList rules={rules} password={password} />

					<label
						htmlFor="confirmPassword"
						className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2"
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
						className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 mb-6 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
					/>

					<button
						type="submit"
						tabIndex={0}
						disabled={isPending}
						className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
					>
						{isPending ? 'Saving...' : 'Continue'}
					</button>
				</form>
			</div>
		</main>
	)
}

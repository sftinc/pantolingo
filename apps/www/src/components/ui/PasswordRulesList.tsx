'use client'

import { getPasswordRules, type PasswordRules } from '@/lib/password'

export function PasswordRulesList({ rules, password }: { rules: PasswordRules; password: string }) {
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
						className={showPassed ? 'text-green-600' : 'text-[var(--text-muted)]'}
					>
						{showPassed ? '✓' : '○'} {label}
					</li>
				)
			})}
		</ul>
	)
}

'use client'

import { cn } from '@/lib/utils'

interface SwitchProps {
	checked: boolean
	onChange: (checked: boolean) => void
	label?: string
	disabled?: boolean
}

export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
	const handleClick = () => {
		if (!disabled) {
			onChange(!checked)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault()
			handleClick()
		}
	}

	return (
		<label
			className={cn(
				'inline-flex items-center gap-3 cursor-pointer',
				disabled && 'opacity-50 cursor-not-allowed'
			)}
		>
			<button
				type="button"
				role="switch"
				aria-checked={checked}
				onClick={handleClick}
				onKeyDown={handleKeyDown}
				disabled={disabled}
				className={cn(
					'relative inline-flex h-6 w-11 flex-shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-neutral-50 dark:focus:ring-offset-neutral-950',
					checked ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-700'
				)}
			>
				<span
					className={cn(
						'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out',
						checked ? 'translate-x-5' : 'translate-x-0'
					)}
				/>
			</button>
			{label && (
				<span className="text-sm text-gray-900 dark:text-gray-100">{label}</span>
			)}
		</label>
	)
}

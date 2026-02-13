'use client'

import { useFormStatus } from 'react-dom'
import { cn } from '@/lib/utils'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string
}

export function FormInput({ label, id, className, ...props }: FormInputProps) {
	const { pending } = useFormStatus()

	return (
		<>
			{label && (
				<label htmlFor={id} className="block text-sm font-medium text-[var(--text-body)] mb-2">
					{label}
				</label>
			)}
			<input
				id={id}
				disabled={pending}
				className={cn(
					'w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-body)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed',
					className
				)}
				{...props}
			/>
		</>
	)
}

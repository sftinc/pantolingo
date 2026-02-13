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
				<label htmlFor={id} className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
					{label}
				</label>
			)}
			<input
				id={id}
				disabled={pending}
				className={cn(
					'w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed',
					className
				)}
				{...props}
			/>
		</>
	)
}

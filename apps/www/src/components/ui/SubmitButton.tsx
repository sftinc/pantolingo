'use client'

import { useFormStatus } from 'react-dom'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

interface SubmitButtonProps {
	children: React.ReactNode
	variant?: 'primary' | 'secondary' | 'success'
	className?: string
}

export function SubmitButton({ children, variant = 'primary', className }: SubmitButtonProps) {
	const { pending } = useFormStatus()

	const variantStyles = {
		primary: 'bg-blue-600 dark:bg-blue-500 text-white hover:opacity-90',
		secondary: 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600',
		success: 'bg-green-600 dark:bg-green-500 text-white hover:opacity-90',
	}

	return (
		<button
			type="submit"
			disabled={pending}
			className={cn(
				'w-full py-3 rounded-md font-medium transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
				variantStyles[variant],
				className
			)}
		>
			{pending ? <Spinner size="sm" className="mx-auto" /> : children}
		</button>
	)
}

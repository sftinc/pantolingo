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
		primary: 'bg-[var(--primary)] text-white hover:opacity-90',
		secondary: 'bg-[var(--border)] text-[var(--text-heading)] hover:bg-[var(--border-hover)]',
		success: 'bg-[var(--success)] text-white hover:opacity-90',
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

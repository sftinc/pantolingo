import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'error' | 'neutral'

interface BadgeProps {
	variant?: BadgeVariant
	children: React.ReactNode
	className?: string
}

const variantStyles: Record<BadgeVariant, string> = {
	success: 'bg-green-600/10 dark:bg-green-500/10 text-green-600 dark:text-green-500',
	warning: 'bg-yellow-600/10 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-500',
	error: 'bg-red-600/10 dark:bg-red-500/10 text-red-600 dark:text-red-500',
	neutral: 'bg-gray-400/10 dark:bg-gray-500/10 text-gray-400 dark:text-gray-500',
}

export function Badge({ variant = 'neutral', children, className }: BadgeProps) {
	return (
		<span
			className={cn(
				'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
				variantStyles[variant],
				className
			)}
		>
			{children}
		</span>
	)
}

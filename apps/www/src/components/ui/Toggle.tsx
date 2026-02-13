import Link from 'next/link'
import { cn } from '@/lib/utils'

interface ToggleOption {
	value: string
	label: string
	count?: number
}

interface ToggleProps {
	options: ToggleOption[]
	value: string
	baseUrl: string
	paramName: string
	className?: string
}

export function Toggle({ options, value, baseUrl, paramName, className }: ToggleProps) {
	return (
		<div className={cn('inline-flex rounded-lg bg-white dark:bg-neutral-900 p-1', className)}>
			{options.map((option) => {
				const isActive = option.value === value
				const url = new URL(baseUrl, 'http://localhost')
				url.searchParams.set(paramName, option.value)
				const href = url.pathname + url.search

				return (
					<Link
						key={option.value}
						href={href}
						className={cn(
							'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
							isActive
								? 'bg-blue-600 dark:bg-blue-500 text-white'
								: 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
						)}
					>
						{option.label}
						{option.count !== undefined && (
							<span className={cn('ml-1.5', isActive ? 'text-white/80' : 'text-gray-400 dark:text-gray-500')}>
								({option.count.toLocaleString()})
							</span>
						)}
					</Link>
				)
			})}
		</div>
	)
}

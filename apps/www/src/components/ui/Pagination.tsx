import Link from 'next/link'
import { cn } from '@/lib/utils'

interface PaginationProps {
	currentPage: number
	totalPages: number
	baseUrl: string
	className?: string
}

export function Pagination({ currentPage, totalPages, baseUrl, className }: PaginationProps) {
	if (totalPages <= 1) return null

	const getPageUrl = (page: number) => {
		const url = new URL(baseUrl, 'http://localhost')
		url.searchParams.set('page', String(page))
		return url.pathname + url.search
	}

	const hasPrev = currentPage > 1
	const hasNext = currentPage < totalPages

	return (
		<div className={cn('flex items-center justify-between', className)}>
			<div className="text-sm text-gray-600 dark:text-gray-400">
				Page {currentPage} of {totalPages}
			</div>
			<div className="flex gap-2">
				{hasPrev ? (
					<Link
						href={getPageUrl(currentPage - 1)}
						className="px-3 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
					>
						Previous
					</Link>
				) : (
					<span className="px-3 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-neutral-900 text-gray-400 dark:text-gray-500 cursor-not-allowed">
						Previous
					</span>
				)}
				{hasNext ? (
					<Link
						href={getPageUrl(currentPage + 1)}
						className="px-3 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-neutral-900 text-gray-900 dark:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors"
					>
						Next
					</Link>
				) : (
					<span className="px-3 py-1.5 text-sm font-medium rounded-md bg-white dark:bg-neutral-900 text-gray-400 dark:text-gray-500 cursor-not-allowed">
						Next
					</span>
				)}
			</div>
		</div>
	)
}

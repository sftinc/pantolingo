import { cn } from '@/lib/utils'

interface TableProps {
	children: React.ReactNode
	className?: string
}

export function Table({ children, className }: TableProps) {
	return (
		<div className="overflow-x-auto rounded-lg border border-gray-300 dark:border-gray-700">
			<table className={cn('w-full table-fixed text-left text-sm', className)}>{children}</table>
		</div>
	)
}

interface TableHeaderProps {
	children: React.ReactNode
	className?: string
}

export function TableHeader({ children, className }: TableHeaderProps) {
	return <thead className={cn('bg-white dark:bg-neutral-900 text-gray-600 dark:text-gray-400', className)}>{children}</thead>
}

interface TableBodyProps {
	children: React.ReactNode
	className?: string
}

export function TableBody({ children, className }: TableBodyProps) {
	return <tbody className={cn('divide-y divide-gray-300 dark:divide-gray-700', className)}>{children}</tbody>
}

interface TableRowProps {
	children: React.ReactNode
	className?: string
	onClick?: () => void
	clickable?: boolean
}

export function TableRow({ children, className, onClick, clickable }: TableRowProps) {
	return (
		<tr
			className={cn(
				'bg-white dark:bg-neutral-900',
				(clickable || onClick) && 'cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-950 transition-colors',
				className
			)}
			onClick={onClick}
		>
			{children}
		</tr>
	)
}

interface TableHeadProps {
	children: React.ReactNode
	className?: string
}

export function TableHead({ children, className }: TableHeadProps) {
	return (
		<th className={cn('px-4 py-3 font-medium text-gray-600 dark:text-gray-400', className)}>
			{children}
		</th>
	)
}

interface TableCellProps {
	children: React.ReactNode
	className?: string
}

export function TableCell({ children, className }: TableCellProps) {
	return (
		<td className={cn('px-4 py-3 text-gray-900 dark:text-gray-100', className)}>
			{children}
		</td>
	)
}

interface EmptyStateProps {
	message: string
	className?: string
}

export function EmptyState({ message, className }: EmptyStateProps) {
	return (
		<div className={cn('py-12 text-center text-gray-600 dark:text-gray-400', className)}>
			{message}
		</div>
	)
}

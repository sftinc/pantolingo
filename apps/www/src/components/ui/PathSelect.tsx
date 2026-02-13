'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { PathOption } from '@pantolingo/db'

interface PathSelectProps {
	paths: PathOption[]
	selectedPathId: number | 'none' | null // null = all paths
	baseUrl: string
	className?: string
}

type OptionValue = number | 'none' | null

interface Option {
	value: OptionValue
	label: string
}

export function PathSelect({ paths, selectedPathId, baseUrl, className }: PathSelectProps) {
	const router = useRouter()
	const [isOpen, setIsOpen] = useState(false)
	const [search, setSearch] = useState('')
	const containerRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	// Build options list (memoized)
	const options = useMemo<Option[]>(
		() => [
			{ value: null, label: 'All paths' },
			{ value: 'none', label: 'No path' },
			...paths.map((p) => ({ value: p.id, label: p.path })),
		],
		[paths]
	)

	// Get current selection label
	const getSelectedLabel = (): string => {
		if (selectedPathId === null) return 'All paths'
		if (selectedPathId === 'none') return 'No path'
		const found = paths.find((p) => p.id === selectedPathId)
		return found?.path ?? 'All paths'
	}

	// Filter options based on search (memoized)
	const filteredOptions = useMemo(
		() => options.filter((opt) => opt.label.toLowerCase().includes(search.toLowerCase())),
		[options, search]
	)

	const handleSelect = (value: OptionValue) => {
		const url = new URL(baseUrl, 'http://localhost')

		if (value === null) {
			url.searchParams.delete('path')
		} else {
			url.searchParams.set('path', String(value))
		}

		// Reset to page 1 when changing path filter
		url.searchParams.delete('page')

		setIsOpen(false)
		setSearch('')
		router.push(url.pathname + url.search)
	}

	// Close on click outside
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false)
				setSearch('')
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// Handle keyboard navigation
	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Escape') {
			setIsOpen(false)
			setSearch('')
			inputRef.current?.blur()
		} else if (e.key === 'Enter' && filteredOptions.length > 0) {
			handleSelect(filteredOptions[0].value)
		} else if (e.key === 'ArrowDown') {
			e.preventDefault()
			setIsOpen(true)
		}
	}

	return (
		<div ref={containerRef} className={cn('relative', className)}>
			{/* Input trigger */}
			<div className="inline-flex rounded-lg bg-white dark:bg-neutral-900 p-1">
				<input
					ref={inputRef}
					type="text"
					value={isOpen ? search : getSelectedLabel()}
					onChange={(e) => setSearch(e.target.value)}
					onFocus={() => {
						setIsOpen(true)
						setSearch('')
					}}
					onKeyDown={handleKeyDown}
					placeholder="Filter paths..."
					className={cn(
						'w-48 appearance-none bg-transparent',
						'px-3 py-1.5 pr-6 text-sm font-medium rounded-md',
						'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100',
						'focus:outline-none cursor-pointer placeholder:text-gray-400 dark:placeholder:text-gray-500',
						'bg-[url("data:image/svg+xml,%3Csvg%20xmlns%3D%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27%20width%3D%2712%27%20height%3D%2712%27%20viewBox%3D%270%200%2024%2024%27%20fill%3D%27none%27%20stroke%3D%27%236b7280%27%20stroke-width%3D%272%27%20stroke-linecap%3D%27round%27%20stroke-linejoin%3D%27round%27%3E%3Cpath%20d%3D%27m6%209%206%206%206-6%27%2F%3E%3C%2Fsvg%3E")]',
						'bg-no-repeat bg-[right_0.25rem_center]'
					)}
				/>
			</div>

			{/* Dropdown list */}
			{isOpen && (
				<ul
					className={cn(
						'absolute right-0 top-full z-50 mt-1',
						'w-72 max-h-64 overflow-y-auto',
						'rounded-lg bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-700',
						'shadow-lg',
						'[&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent'
					)}
				>
					{filteredOptions.length === 0 ? (
						<li className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">No matches</li>
					) : (
						filteredOptions.map((opt) => (
							<li key={String(opt.value)}>
								<button
									type="button"
									onClick={() => handleSelect(opt.value)}
									className={cn(
										'w-full text-left px-3 py-2 text-sm',
										'hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white',
										'transition-colors truncate',
										opt.value === selectedPathId
											? 'bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 font-medium'
											: 'text-gray-800 dark:text-gray-200'
									)}
								>
									{opt.label}
								</button>
							</li>
						))
					)}
				</ul>
			)}
		</div>
	)
}

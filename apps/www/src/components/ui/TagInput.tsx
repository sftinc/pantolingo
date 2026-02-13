'use client'

import { useState, useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/utils'

interface TagInputProps {
	value: string[]
	onChange: (value: string[]) => void
	placeholder?: string
	hint?: string
	disabled?: boolean
	validate?: (value: string) => string | null // Returns error message or null
}

export function TagInput({
	value,
	onChange,
	placeholder,
	hint,
	disabled,
	validate,
}: TagInputProps) {
	const [inputValue, setInputValue] = useState('')
	const [error, setError] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	const handleAdd = () => {
		const trimmed = inputValue.trim()

		// Silently ignore empty strings
		if (!trimmed) {
			setInputValue('')
			return
		}

		// Skip if already exists
		if (value.includes(trimmed)) {
			setInputValue('')
			setError(null)
			return
		}

		// Run validation if provided
		if (validate) {
			const validationError = validate(trimmed)
			if (validationError) {
				setError(validationError)
				return
			}
		}

		onChange([...value, trimmed])
		setInputValue('')
		setError(null)
	}

	const handleRemove = (index: number) => {
		const newValue = value.filter((_, i) => i !== index)
		onChange(newValue)
	}

	const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
		if (e.key === 'Enter') {
			e.preventDefault()
			handleAdd()
		} else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
			// Remove last tag on backspace when input is empty
			handleRemove(value.length - 1)
		}
	}

	const handleContainerClick = () => {
		inputRef.current?.focus()
	}

	return (
		<div>
			<div
				onClick={handleContainerClick}
				className={cn(
					'flex flex-wrap gap-2 p-3 rounded-lg border border-gray-300 dark:border-gray-700 bg-neutral-50 dark:bg-neutral-950 min-h-[44px] cursor-text',
					disabled && 'opacity-50 cursor-not-allowed'
				)}
			>
				{value.map((tag, index) => (
					<span
						key={index}
						className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 text-sm"
					>
						{tag}
						{!disabled && (
							<button
								type="button"
								onClick={(e) => {
									e.stopPropagation()
									handleRemove(index)
								}}
								className="p-0.5 hover:bg-blue-600/20 dark:hover:bg-blue-500/20 rounded"
								aria-label={`Remove ${tag}`}
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="14"
									height="14"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<line x1="18" y1="6" x2="6" y2="18" />
									<line x1="6" y1="6" x2="18" y2="18" />
								</svg>
							</button>
						)}
					</span>
				))}
				<input
					ref={inputRef}
					type="text"
					value={inputValue}
					onChange={(e) => {
						setInputValue(e.target.value)
						setError(null)
					}}
					onKeyDown={handleKeyDown}
					onBlur={handleAdd}
					placeholder={value.length === 0 ? placeholder : ''}
					disabled={disabled}
					className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-600 dark:placeholder:text-gray-400"
				/>
			</div>
			{hint && !error && (
				<p className="mt-1 text-xs text-gray-600 dark:text-gray-400">{hint}</p>
			)}
			{error && (
				<p className="mt-1 text-xs text-red-600 dark:text-red-500">{error}</p>
			)}
		</div>
	)
}

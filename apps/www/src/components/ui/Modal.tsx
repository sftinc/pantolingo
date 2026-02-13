'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { Spinner } from './Spinner'

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	title: string
	children: React.ReactNode
	className?: string
	badge?: React.ReactNode
}

export function Modal({ isOpen, onClose, title, children, className, badge }: ModalProps) {
	const dialogRef = useRef<HTMLDialogElement>(null)

	useEffect(() => {
		const dialog = dialogRef.current
		if (!dialog) return

		if (isOpen) {
			dialog.showModal()
		} else {
			dialog.close()
		}
	}, [isOpen])

	useEffect(() => {
		const dialog = dialogRef.current
		if (!dialog) return

		const handleClose = () => onClose()
		dialog.addEventListener('close', handleClose)
		return () => dialog.removeEventListener('close', handleClose)
	}, [onClose])

	// Close on backdrop click
	const handleBackdropClick = (e: React.MouseEvent) => {
		if (e.target === dialogRef.current) {
			onClose()
		}
	}

	// Close on Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isOpen) {
				onClose()
			}
		}
		document.addEventListener('keydown', handleKeyDown)
		return () => document.removeEventListener('keydown', handleKeyDown)
	}, [isOpen, onClose])

	return (
		<dialog
			ref={dialogRef}
			className={cn(
				'fixed inset-y-0 inset-x-4 m-auto max-h-[85vh] w-full max-w-[min(calc(100%-2rem),56rem)] rounded-lg bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 p-0 shadow-xl shadow-black/10 dark:shadow-black/30 backdrop:bg-black/50',
				className
			)}
			onClick={handleBackdropClick}
		>
			<div className="flex flex-col max-h-[85vh]">
				<div className="flex items-center justify-between border-b border-gray-300 dark:border-gray-700 px-6 py-4">
					<h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
					<div className="flex items-center gap-3">
						{badge}
						<button
							onClick={onClose}
							className="p-1 rounded-md text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors focus:outline-none"
							aria-label="Close"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								width="20"
								height="20"
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
					</div>
				</div>
				<div className="flex-1 overflow-auto p-6">{children}</div>
			</div>
		</dialog>
	)
}

interface ModalFooterProps {
	children: React.ReactNode
	className?: string
}

export function ModalFooter({ children, className }: ModalFooterProps) {
	return (
		<div className={cn('flex justify-end gap-3 border-t border-gray-300 dark:border-gray-700 pt-4 mt-4', className)}>
			{children}
		</div>
	)
}

interface ButtonProps {
	children: React.ReactNode
	variant?: 'primary' | 'secondary' | 'success'
	onClick?: () => void
	disabled?: boolean
	loading?: boolean
	type?: 'button' | 'submit'
	className?: string
}

export function Button({ children, variant = 'secondary', onClick, disabled, loading, type = 'button', className }: ButtonProps) {
	const variantStyles = {
		primary: 'bg-blue-600 dark:bg-blue-500 text-white hover:bg-blue-700 dark:hover:bg-blue-400',
		secondary: 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 hover:bg-gray-400 dark:hover:bg-gray-600',
		success: 'bg-green-600 dark:bg-green-500 text-white hover:opacity-90',
	}

	return (
		<button
			type={type}
			onClick={onClick}
			disabled={disabled || loading}
			className={cn(
				'px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
				variantStyles[variant],
				className
			)}
		>
			{loading ? <Spinner size="sm" /> : children}
		</button>
	)
}

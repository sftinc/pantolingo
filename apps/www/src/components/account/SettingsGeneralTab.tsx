'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Modal'
import { saveGeneralSettings, enableDevMode } from '@/actions/website'
import { LANGUAGE_DATA } from '@pantolingo/lang'
import { UI_COLORS, UI_COLOR_LABELS, COLOR_SWATCH } from '@/lib/ui-colors'

interface SettingsGeneralTabProps {
	websiteId: number
	initialName: string
	hostname: string
	sourceLang: string
	initialUiColor: string | null
	devModeRemaining: number | null
}

function SourceLanguageDropdown({
	value,
	onChange,
	disabled,
}: {
	value: string
	onChange: (code: string) => void
	disabled: boolean
}) {
	const [isOpen, setIsOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)
	const sortedLangs = [...LANGUAGE_DATA].sort((a, b) => a.englishName.localeCompare(b.englishName))
	const selectedLang = LANGUAGE_DATA.find((l) => l.code === value)

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	return (
		<div>
			<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">Source Language</label>
			<div ref={containerRef} className="relative">
				<button
					type="button"
					onClick={() => !disabled && setIsOpen(!isOpen)}
					className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--card-bg)] border border-[var(--border)] text-sm text-[var(--text-heading)] hover:border-[var(--border-hover)] transition-colors cursor-pointer disabled:opacity-50"
					disabled={disabled}
				>
					<span>{selectedLang?.flag}</span>
					<span className="flex-1 text-left">{selectedLang?.englishName ?? value}</span>
					<svg
						className={`w-4 h-4 text-[var(--text-subtle)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="m6 9 6 6 6-6" />
					</svg>
				</button>

				{isOpen && (
					<ul className="absolute left-0 top-full z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg bg-[var(--card-bg)] border border-[var(--border)] shadow-lg [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
						{sortedLangs.map((lang) => (
							<li key={lang.code}>
								<button
									type="button"
									onClick={() => {
										onChange(lang.code)
										setIsOpen(false)
									}}
									className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer ${
										lang.code === value
											? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
											: 'text-[var(--text-muted)]'
									}`}
								>
									<span>{lang.flag}</span>
									<span>{lang.englishName}</span>
								</button>
							</li>
						))}
					</ul>
				)}
			</div>
		</div>
	)
}

function DevModeControl({ websiteId, initialRemaining }: { websiteId: number; initialRemaining: number | null }) {
	const [remaining, setRemaining] = useState<number | null>(
		initialRemaining && initialRemaining > 0 ? initialRemaining : null,
	)
	const [isEnabling, startTransition] = useTransition()

	useEffect(() => {
		if (remaining === null || remaining <= 0) return
		const interval = setInterval(() => {
			setRemaining((prev) => {
				if (prev === null || prev <= 1) return null
				return prev - 1
			})
		}, 1000)
		return () => clearInterval(interval)
	// Dep is a boolean so the interval starts/stops only on null↔non-null transitions,
	// not on every tick. Using [remaining] would tear down and recreate the interval each second.
	}, [remaining !== null]) // eslint-disable-line react-hooks/exhaustive-deps

	const handleEnable = () => {
		startTransition(async () => {
			const result = await enableDevMode(websiteId)
			if (result.success && result.remainingSeconds) {
				setRemaining(result.remainingSeconds)
			}
		})
	}

	const isActive = remaining !== null && remaining > 0
	const timeLeft = isActive ? `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, '0')} remaining` : ''

	return (
		<div className="flex items-center justify-between gap-4">
			<div>
				<label className="block text-sm font-medium text-[var(--text-muted)]">
					Dev Mode:{' '}
					<span className={isActive ? 'text-orange-600 dark:text-orange-400' : ''}>
						{isActive ? 'Enabled' : 'Disabled'}
					</span>
				</label>
				<p className="text-xs text-[var(--text-muted)] mt-0.5">
					Bypass static asset caching for development and testing
				</p>
			</div>
			<div>
				{isActive ? (
					<span className="text-xs font-medium text-orange-600 dark:text-orange-400">{timeLeft}</span>
				) : (
					<button
						type="button"
						onClick={handleEnable}
						disabled={isEnabling}
						className="px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text-heading)] bg-[var(--card-bg)] hover:bg-[var(--page-bg)] transition-colors cursor-pointer disabled:opacity-50"
					>
						{isEnabling ? 'Enabling...' : 'Enable for 15 mins'}
					</button>
				)}
			</div>
		</div>
	)
}

export function SettingsGeneralTab({
	websiteId,
	initialName,
	hostname,
	sourceLang,
	initialUiColor,
	devModeRemaining,
}: SettingsGeneralTabProps) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [success, setSuccess] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const [name, setName] = useState(initialName)
	const [selectedSourceLang, setSelectedSourceLang] = useState(sourceLang)
	const [uiColor, setUiColor] = useState<string | null>(initialUiColor)

	const handleSave = () => {
		setError(null)
		setSuccess(false)

		const trimmedName = name.trim()
		setName(trimmedName)

		startTransition(async () => {
			const result = await saveGeneralSettings(websiteId, {
				name: trimmedName,
				sourceLang: selectedSourceLang,
				uiColor,
			})

			if (result.success) {
				setSuccess(true)
				router.refresh()
			} else {
				setError(result.error || 'Failed to save settings')
			}
			window.scrollTo({ top: 0, behavior: 'smooth' })
		})
	}

	const cardClass = 'bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-6'

	return (
		<div className="space-y-5">
			{success && (
				<div className="p-3 rounded-lg bg-[var(--success)]/10 text-[var(--success)] text-sm">
					Settings saved successfully
				</div>
			)}

			{error && <div className="p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm">{error}</div>}

			{/* General */}
			<div className={cardClass}>
				<h2 className="text-sm font-semibold text-[var(--text-heading)] mb-5">General</h2>
				<div className="space-y-5">
					{/* Name */}
					<div>
						<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">Name</label>
						<input
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							disabled={isPending}
							className="w-full px-3 py-2 text-sm rounded-md bg-[var(--page-bg)] border border-[var(--border)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
							maxLength={20}
						/>
					</div>

					{/* Hostname (read-only) */}
					<div>
						<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">Hostname</label>
						<input
							type="text"
							value={hostname}
							readOnly
							className="w-full px-3 py-2 text-sm rounded-md bg-[var(--border)]/30 border border-[var(--border)] text-[var(--text-muted)] cursor-not-allowed"
						/>
					</div>

					{/* Source Language */}
					<SourceLanguageDropdown
						value={selectedSourceLang}
						onChange={setSelectedSourceLang}
						disabled={isPending}
					/>

					{/* Accent Color */}
					<div>
						<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">Theme Color</label>
						<div className="flex flex-wrap gap-2">
							{/* Auto (null) circle */}
							<button
								type="button"
								title="Auto"
								onClick={() => setUiColor(null)}
								disabled={isPending}
								className={`w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 cursor-pointer transition-transform disabled:opacity-50 ${
									uiColor === null
										? 'ring-2 ring-purple-500 ring-offset-2 ring-offset-[var(--card-bg)] scale-110'
										: ''
								}`}
							/>
							{UI_COLORS.map((color) => {
								const swatch = COLOR_SWATCH[color]
								const selected = uiColor === color
								return (
									<button
										key={color}
										type="button"
										title={UI_COLOR_LABELS[color]}
										onClick={() => setUiColor(color)}
										disabled={isPending}
										className={`w-7 h-7 rounded-full ${swatch.bg} cursor-pointer transition-transform disabled:opacity-50 ${
											selected
												? `ring-2 ${swatch.ring} ring-offset-2 ring-offset-[var(--card-bg)] scale-110`
												: ''
										}`}
									/>
								)
							})}
						</div>
						<p className="text-xs text-[var(--text-muted)] mt-1.5">
							Accent color for navigation and website switcher
						</p>
					</div>
				</div>
			</div>

			{/* Dev Mode */}
			<div className={cardClass}>
				<DevModeControl websiteId={websiteId} initialRemaining={devModeRemaining} />
			</div>

			{/* Save Button */}
			<div className="flex justify-end">
				<Button variant="primary" onClick={handleSave} loading={isPending}>
					Save Settings
				</Button>
			</div>
		</div>
	)
}

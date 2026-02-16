'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TagInput } from '@/components/ui/TagInput'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Modal'
import { saveWebsiteSettings, enableDevMode } from '@/actions/website'
import { LANGUAGE_DATA } from '@pantolingo/lang'
import { UI_COLORS, UI_COLOR_LABELS, COLOR_SWATCH } from '@/lib/ui-colors'

interface WebsiteSettingsFormProps {
	websiteId: number
	initialName: string
	hostname: string
	sourceLang: string
	initialUiColor: string | null
	initialSkipWords: string[]
	initialSkipPath: string[]
	initialSkipSelectors: string[]
	initialTranslatePath: boolean
	devModeRemaining: number | null
}

function parseSkipPath(skipPath: string[]): { contains: string[]; regex: string[] } {
	const contains: string[] = []
	const regex: string[] = []

	for (const item of skipPath) {
		if (item.startsWith('regex:')) {
			regex.push(item.slice(6)) // Strip 'regex:' prefix
		} else if (item.startsWith('includes:')) {
			contains.push(item.slice(9)) // Strip 'includes:' prefix
		} else {
			// Legacy items without prefix are treated as contains
			contains.push(item)
		}
	}

	return { contains, regex }
}

function combineSkipPath(contains: string[], regex: string[]): string[] {
	const result: string[] = []

	for (const item of contains) {
		result.push(`includes:${item}`)
	}

	for (const item of regex) {
		result.push(`regex:${item}`)
	}

	return result
}

function validateRegex(pattern: string): string | null {
	if (pattern.length > 100) {
		return 'Pattern too long (max 100 characters)'
	}

	try {
		new RegExp(pattern)
	} catch {
		return 'Invalid regular expression'
	}

	// Detect catastrophic backtracking patterns (nested quantifiers)
	if (/(\+|\*|\})\)?(\+|\*|\{)/.test(pattern)) {
		return 'Pattern may cause performance issues'
	}

	return null
}

function validateSkipWord(word: string): string | null {
	// Reject HTML tags
	if (/<[^>]+>/.test(word)) {
		return 'HTML tags are not allowed'
	}

	// Reject script injection patterns
	if (/javascript:/i.test(word) || /on\w+=/i.test(word)) {
		return 'Invalid pattern'
	}

	return null
}

function validateSelector(selector: string): string | null {
	if (selector.length > 200) {
		return 'Selector too long (max 200 characters)'
	}

	// SSR guard - skip DOM validation on server
	if (typeof document === 'undefined') {
		return null
	}

	try {
		document.createElement('div').matches(selector)
	} catch {
		return 'Invalid CSS selector'
	}

	return null
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

export function WebsiteSettingsForm({
	websiteId,
	initialName,
	hostname,
	sourceLang,
	initialUiColor,
	initialSkipWords,
	initialSkipPath,
	initialSkipSelectors,
	initialTranslatePath,
	devModeRemaining,
}: WebsiteSettingsFormProps) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [success, setSuccess] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const { contains: initialContains, regex: initialRegex } = parseSkipPath(initialSkipPath)

	const [name, setName] = useState(initialName)
	const [selectedSourceLang, setSelectedSourceLang] = useState(sourceLang)
	const [uiColor, setUiColor] = useState<string | null>(initialUiColor)
	const [skipWords, setSkipWords] = useState(initialSkipWords)
	const [skipPathContains, setSkipPathContains] = useState(initialContains)
	const [skipPathRegex, setSkipPathRegex] = useState(initialRegex)
	const [skipSelectors, setSkipSelectors] = useState(initialSkipSelectors)
	const [translatePath, setTranslatePath] = useState(initialTranslatePath)

	const handleSave = () => {
		setError(null)
		setSuccess(false)

		const trimmedName = name.trim()
		setName(trimmedName)

		const trimmedSkipWords = skipWords.map((s) => s.trim()).filter(Boolean)
		setSkipWords(trimmedSkipWords)

		const trimmedContains = skipPathContains.map((s) => s.trim()).filter(Boolean)
		setSkipPathContains(trimmedContains)

		const trimmedRegex = skipPathRegex.map((s) => s.trim()).filter(Boolean)
		setSkipPathRegex(trimmedRegex)

		const trimmedSelectors = skipSelectors.map((s) => s.trim()).filter(Boolean)
		setSkipSelectors(trimmedSelectors)

		startTransition(async () => {
			const result = await saveWebsiteSettings(websiteId, {
				name: trimmedName,
				sourceLang: selectedSourceLang,
				uiColor,
				skipWords: trimmedSkipWords,
				skipPath: combineSkipPath(trimmedContains, trimmedRegex),
				skipSelectors: trimmedSelectors,
				translatePath,
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

			{/* Options */}
			<div className={cardClass}>
				<h2 className="text-sm font-semibold text-[var(--text-heading)] mb-5">Options</h2>
				<div className="space-y-5">
					{/* Translate URL Paths */}
					<div className="flex items-center justify-between gap-4">
						<div>
							<label className="block text-sm font-medium text-[var(--text-muted)]">Translate URL Paths</label>
							<p className="text-xs text-[var(--text-muted)] mt-0.5">
								When enabled, URL paths will be translated (e.g., /about becomes /acerca-de)
							</p>
						</div>
						<Switch checked={translatePath} onChange={setTranslatePath} disabled={isPending} />
					</div>

					{/* Dev Mode */}
					<DevModeControl websiteId={websiteId} initialRemaining={devModeRemaining} />
				</div>
			</div>

			{/* Skip Selectors */}
			<div className={cardClass}>
				<h2 className="text-sm font-semibold text-[var(--text-heading)] mb-1">Skip Selectors</h2>
				<p className="text-xs text-[var(--text-muted)] mb-4">
					CSS selectors for elements that should not be translated
				</p>
				<TagInput
					value={skipSelectors}
					onChange={setSkipSelectors}
					placeholder="Add CSS selectors..."
					disabled={isPending}
					validate={validateSelector}
				/>
			</div>

			{/* Skip Paths */}
			<div className={cardClass}>
				<h2 className="text-sm font-semibold text-[var(--text-heading)] mb-5">Skip Paths</h2>
				<div className="space-y-5">
					{/* Contains */}
					<div>
						<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">Contains</label>
						<p className="text-xs text-[var(--text-muted)] mb-2">
							Paths containing these strings will not be translated
						</p>
						<TagInput
							value={skipPathContains}
							onChange={setSkipPathContains}
							placeholder="Add path patterns..."
							disabled={isPending}
						/>
					</div>

					{/* Regex */}
					<div>
						<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">Regex</label>
						<p className="text-xs text-[var(--text-muted)] mb-2">
							Paths matching these regular expressions will not be translated
						</p>
						<TagInput
							value={skipPathRegex}
							onChange={setSkipPathRegex}
							placeholder="Add regex patterns..."
							disabled={isPending}
							validate={validateRegex}
						/>
					</div>
				</div>
			</div>

			{/* Skip Words */}
			<div className={cardClass}>
				<h2 className="text-sm font-semibold text-[var(--text-heading)] mb-1">Skip Words</h2>
				<p className="text-xs text-[var(--text-muted)] mb-4">
					Words that should not be translated (e.g., brand names, product names)
				</p>
				<TagInput
					value={skipWords}
					onChange={setSkipWords}
					placeholder="Add words to skip..."
					disabled={isPending}
					validate={validateSkipWord}
				/>
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

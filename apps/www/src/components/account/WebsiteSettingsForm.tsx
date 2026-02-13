'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { TagInput } from '@/components/ui/TagInput'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Modal'
import { saveWebsiteSettings } from '@/actions/website'
import { getFlag, getLanguageName, LANGUAGE_DATA } from '@pantolingo/lang'

interface WebsiteSettingsFormProps {
	websiteId: number
	initialName: string
	hostname: string
	sourceLang: string
	initialSkipWords: string[]
	initialSkipPath: string[]
	initialSkipSelectors: string[]
	initialTranslatePath: boolean
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

function SourceLanguageDropdown({ value, onChange, disabled }: { value: string; onChange: (code: string) => void; disabled: boolean }) {
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
			<label className="block mb-2 text-sm font-medium text-[var(--text-heading)]">
				Source Language
			</label>
			<div ref={containerRef} className="relative">
				<button
					type="button"
					onClick={() => !disabled && setIsOpen(!isOpen)}
					className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-[var(--card-bg)] border border-[var(--border)] text-sm text-[var(--text-heading)] hover:border-[var(--border-hover)] transition-colors cursor-pointer disabled:opacity-50"
					disabled={disabled}
				>
					<span>{selectedLang?.flag}</span>
					<span className="flex-1 text-left">{selectedLang?.englishName ?? value}</span>
					<svg className={`w-4 h-4 text-[var(--text-subtle)] transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
						<path d="m6 9 6 6 6-6" />
					</svg>
				</button>

				{isOpen && (
					<ul className="absolute left-0 top-full z-50 mt-1 w-full max-h-64 overflow-y-auto rounded-lg bg-[var(--card-bg)] border border-[var(--border)] shadow-lg [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
						{sortedLangs.map((lang) => (
							<li key={lang.code}>
								<button
									type="button"
									onClick={() => { onChange(lang.code); setIsOpen(false) }}
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

export function WebsiteSettingsForm({
	websiteId,
	initialName,
	hostname,
	sourceLang,
	initialSkipWords,
	initialSkipPath,
	initialSkipSelectors,
	initialTranslatePath,
}: WebsiteSettingsFormProps) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [success, setSuccess] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const { contains: initialContains, regex: initialRegex } = parseSkipPath(initialSkipPath)

	const [name, setName] = useState(initialName)
	const [selectedSourceLang, setSelectedSourceLang] = useState(sourceLang)
	const [skipWords, setSkipWords] = useState(initialSkipWords)
	const [skipPathContains, setSkipPathContains] = useState(initialContains)
	const [skipPathRegex, setSkipPathRegex] = useState(initialRegex)
	const [skipSelectors, setSkipSelectors] = useState(initialSkipSelectors)
	const [translatePath, setTranslatePath] = useState(initialTranslatePath)

	const handleSave = () => {
		setError(null)
		setSuccess(false)

		startTransition(async () => {
			const result = await saveWebsiteSettings(websiteId, {
				name: name.trim(),
				sourceLang: selectedSourceLang,
				skipWords,
				skipPath: combineSkipPath(skipPathContains, skipPathRegex),
				skipSelectors,
				translatePath,
			})

			if (result.success) {
				setSuccess(true)
				router.refresh()
			} else {
				setError(result.error || 'Failed to save settings')
			}
		})
	}

	return (
		<div className="space-y-8 max-w-2xl">
			{success && (
				<div className="p-3 rounded-lg bg-[var(--success)]/10 text-[var(--success)] text-sm">
					Settings saved successfully
				</div>
			)}

			{error && (
				<div className="p-3 rounded-lg bg-[var(--error)]/10 text-[var(--error)] text-sm">
					{error}
				</div>
			)}

			{/* Name */}
			<div>
				<label className="block mb-2 text-sm font-medium text-[var(--text-heading)]">
					Name
				</label>
				<input
					type="text"
					value={name}
					onChange={(e) => setName(e.target.value)}
					disabled={isPending}
					className="w-full px-3 py-2 text-sm rounded-md bg-[var(--card-bg)] border border-[var(--border)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50"
					maxLength={20}
				/>
			</div>

			{/* Hostname (read-only) */}
			<div>
				<label className="block mb-2 text-sm font-medium text-[var(--text-heading)]">
					Hostname
				</label>
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

			{/* Skip Words */}
			<div>
				<label className="block mb-2 text-sm font-medium text-[var(--text-heading)]">
					Skip Words
				</label>
				<p className="mb-2 text-xs text-[var(--text-muted)]">
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

			{/* Skip Paths (Contains) */}
			<div>
				<label className="block mb-2 text-sm font-medium text-[var(--text-heading)]">
					Skip Paths (Contains)
				</label>
				<p className="mb-2 text-xs text-[var(--text-muted)]">
					Paths containing these strings will not be translated (e.g., /api/, /admin)
				</p>
				<TagInput
					value={skipPathContains}
					onChange={setSkipPathContains}
					placeholder="Add path patterns..."
					disabled={isPending}
				/>
			</div>

			{/* Skip Paths (Regex) */}
			<div>
				<label className="block mb-2 text-sm font-medium text-[var(--text-heading)]">
					Skip Paths (Regex)
				</label>
				<p className="mb-2 text-xs text-[var(--text-muted)]">
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

			{/* Skip Selectors */}
			<div>
				<label className="block mb-2 text-sm font-medium text-[var(--text-heading)]">
					Skip Selectors
				</label>
				<p className="mb-2 text-xs text-[var(--text-muted)]">
					CSS selectors for elements that should not be translated (e.g., .brand-name, [data-no-translate])
				</p>
				<TagInput
					value={skipSelectors}
					onChange={setSkipSelectors}
					placeholder="Add CSS selectors..."
					disabled={isPending}
					validate={validateSelector}
				/>
			</div>

			{/* Translate Path */}
			<div className="flex items-start justify-between gap-4">
				<div>
					<label className="block mb-1 text-sm font-medium text-[var(--text-heading)]">
						Translate URL Paths
					</label>
					<p className="text-xs text-[var(--text-muted)]">
						When enabled, URL paths will be translated (e.g., /about becomes /acerca-de)
					</p>
				</div>
				<Switch
					checked={translatePath}
					onChange={setTranslatePath}
					disabled={isPending}
				/>
			</div>

			{/* Save Button */}
			<div className="pt-4 border-t border-[var(--border)]">
				<Button
					variant="primary"
					onClick={handleSave}
					loading={isPending}
				>
					Save Settings
				</Button>
			</div>
		</div>
	)
}

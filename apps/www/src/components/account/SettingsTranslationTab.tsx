'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TagInput } from '@/components/ui/TagInput'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Modal'
import { saveTranslationSettings } from '@/actions/website'

interface SettingsTranslationTabProps {
	websiteId: number
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
			regex.push(item.slice(6))
		} else if (item.startsWith('includes:')) {
			contains.push(item.slice(9))
		} else {
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

	if (/(\+|\*|\})\)?(\+|\*|\{)/.test(pattern)) {
		return 'Pattern may cause performance issues'
	}

	return null
}

function validateSkipWord(word: string): string | null {
	if (/<[^>]+>/.test(word)) {
		return 'HTML tags are not allowed'
	}

	if (/javascript:/i.test(word) || /on\w+=/i.test(word)) {
		return 'Invalid pattern'
	}

	return null
}

function validateSelector(selector: string): string | null {
	if (selector.length > 200) {
		return 'Selector too long (max 200 characters)'
	}

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

export function SettingsTranslationTab({
	websiteId,
	initialSkipWords,
	initialSkipPath,
	initialSkipSelectors,
	initialTranslatePath,
}: SettingsTranslationTabProps) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [success, setSuccess] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const { contains: initialContains, regex: initialRegex } = parseSkipPath(initialSkipPath)

	const [skipWords, setSkipWords] = useState(initialSkipWords)
	const [skipPathContains, setSkipPathContains] = useState(initialContains)
	const [skipPathRegex, setSkipPathRegex] = useState(initialRegex)
	const [skipSelectors, setSkipSelectors] = useState(initialSkipSelectors)
	const [translatePath, setTranslatePath] = useState(initialTranslatePath)

	const handleSave = () => {
		setError(null)
		setSuccess(false)

		const trimmedSkipWords = skipWords.map((s) => s.trim()).filter(Boolean)
		setSkipWords(trimmedSkipWords)

		const trimmedContains = skipPathContains.map((s) => s.trim()).filter(Boolean)
		setSkipPathContains(trimmedContains)

		const trimmedRegex = skipPathRegex.map((s) => s.trim()).filter(Boolean)
		setSkipPathRegex(trimmedRegex)

		const trimmedSelectors = skipSelectors.map((s) => s.trim()).filter(Boolean)
		setSkipSelectors(trimmedSelectors)

		startTransition(async () => {
			const result = await saveTranslationSettings(websiteId, {
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

			{/* Translate URL Paths */}
			<div className={cardClass}>
				<div className="flex items-center justify-between gap-4">
					<div>
						<label className="block text-sm font-medium text-[var(--text-muted)]">Translate URL Paths</label>
						<p className="text-xs text-[var(--text-muted)] mt-0.5">
							When enabled, URL paths will be translated (e.g., /about becomes /acerca-de)
						</p>
					</div>
					<Switch checked={translatePath} onChange={setTranslatePath} disabled={isPending} />
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

'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TagInput } from '@/components/ui/TagInput'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Modal'
import { saveWebsiteSettings } from '@/actions/website'
import { getFlag, getLanguageName } from '@pantolingo/lang'

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

			{/* Source Language (read-only) */}
			<div>
				<label className="block mb-2 text-sm font-medium text-[var(--text-heading)]">
					Source Language
				</label>
				<div className="flex items-center gap-2 px-3 py-2 text-sm rounded-md bg-[var(--border)]/30 border border-[var(--border)] text-[var(--text-muted)]">
					<span>{getFlag(sourceLang)}</span>
					<span>{getLanguageName(sourceLang).split(' (')[0]}</span>
				</div>
			</div>

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

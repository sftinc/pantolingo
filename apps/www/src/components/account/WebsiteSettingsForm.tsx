'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TagInput } from '@/components/ui/TagInput'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Modal'
import { saveWebsiteSettings } from '@/actions/website'

interface WebsiteSettingsFormProps {
	websiteId: number
	initialSkipWords: string[]
	initialSkipPath: string[]
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

export function WebsiteSettingsForm({
	websiteId,
	initialSkipWords,
	initialSkipPath,
	initialTranslatePath,
}: WebsiteSettingsFormProps) {
	const router = useRouter()
	const [isPending, startTransition] = useTransition()
	const [success, setSuccess] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const { contains: initialContains, regex: initialRegex } = parseSkipPath(initialSkipPath)

	const [skipWords, setSkipWords] = useState(initialSkipWords)
	const [skipPathContains, setSkipPathContains] = useState(initialContains)
	const [skipPathRegex, setSkipPathRegex] = useState(initialRegex)
	const [translatePath, setTranslatePath] = useState(initialTranslatePath)

	const handleSave = () => {
		setError(null)
		setSuccess(false)

		startTransition(async () => {
			const result = await saveWebsiteSettings(websiteId, {
				skipWords,
				skipPath: combineSkipPath(skipPathContains, skipPathRegex),
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

			{/* Translate Path */}
			<div>
				<label className="block mb-2 text-sm font-medium text-[var(--text-heading)]">
					Translate URL Paths
				</label>
				<p className="mb-2 text-xs text-[var(--text-muted)]">
					When enabled, URL paths will be translated (e.g., /about becomes /acerca-de)
				</p>
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

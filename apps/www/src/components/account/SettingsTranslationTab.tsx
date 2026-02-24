'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TagInput } from '@/components/ui/TagInput'
import { Switch } from '@/components/ui/Switch'
import { Button } from '@/components/ui/Modal'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { saveTranslationSettings } from '@/actions/website'

interface SettingsTranslationTabProps {
	websiteId: number
	initialSkipWords: string[]
	initialSkipPath: string[]
	initialSkipSelectors: string[]
	initialTranslatePath: boolean
}

type ExcludePathRuleType = 'includes' | 'startsWith' | 'endsWith' | 'regex'

interface ExcludePathRule {
	type: ExcludePathRuleType
	pattern: string
}

const RULE_TYPES: ExcludePathRuleType[] = ['includes', 'startsWith', 'endsWith', 'regex']

function parseSkipPath(skipPath: string[]): ExcludePathRule[] {
	const rules: ExcludePathRule[] = []

	for (const item of skipPath) {
		if (item.startsWith('regex:')) {
			rules.push({ type: 'regex', pattern: item.slice(6) })
		} else if (item.startsWith('startsWith:')) {
			rules.push({ type: 'startsWith', pattern: item.slice(11) })
		} else if (item.startsWith('endsWith:')) {
			rules.push({ type: 'endsWith', pattern: item.slice(9) })
		} else if (item.startsWith('includes:')) {
			rules.push({ type: 'includes', pattern: item.slice(9) })
		} else {
			// Legacy plain strings → includes
			rules.push({ type: 'includes', pattern: item })
		}
	}

	return rules
}

function combineSkipPath(rules: ExcludePathRule[]): string[] {
	return rules.map((rule) => `${rule.type}:${rule.pattern}`)
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

	const [skipWords, setSkipWords] = useState(initialSkipWords)
	const [skipPathRules, setSkipPathRules] = useState<ExcludePathRule[]>(() => parseSkipPath(initialSkipPath))
	const [skipSelectors, setSkipSelectors] = useState(initialSkipSelectors)
	const [translatePath, setTranslatePath] = useState(initialTranslatePath)

	// Add Rule form state
	const [showAddForm, setShowAddForm] = useState(false)
	const [newRuleType, setNewRuleType] = useState<ExcludePathRuleType>('includes')
	const [newRulePattern, setNewRulePattern] = useState('')
	const [addRuleError, setAddRuleError] = useState<string | null>(null)

	const handleAddRule = () => {
		setAddRuleError(null)
		const pattern = newRulePattern.trim()

		if (!pattern) {
			setAddRuleError('Pattern is required')
			return
		}
		if (pattern.length > 200) {
			setAddRuleError('Pattern too long (max 200 characters)')
			return
		}
		if (newRuleType === 'regex') {
			const regexError = validateRegex(pattern)
			if (regexError) {
				setAddRuleError(regexError)
				return
			}
		}
		if (skipPathRules.some((r) => r.type === newRuleType && r.pattern === pattern)) {
			setAddRuleError('Duplicate rule')
			return
		}
		if (skipPathRules.length >= 25) {
			setAddRuleError('Maximum 25 rules allowed')
			return
		}

		setSkipPathRules([...skipPathRules, { type: newRuleType, pattern }])
		setNewRulePattern('')
		setNewRuleType('includes')
		setShowAddForm(false)
	}

	const handleRemoveRule = (index: number) => {
		setSkipPathRules(skipPathRules.filter((_, i) => i !== index))
	}

	const handleSave = () => {
		setError(null)
		setSuccess(false)

		const trimmedSkipWords = skipWords.map((s) => s.trim()).filter(Boolean)
		setSkipWords(trimmedSkipWords)

		const trimmedRules = skipPathRules
			.map((r) => ({ ...r, pattern: r.pattern.trim() }))
			.filter((r) => r.pattern)
		setSkipPathRules(trimmedRules)

		const trimmedSelectors = skipSelectors.map((s) => s.trim()).filter(Boolean)
		setSkipSelectors(trimmedSelectors)

		startTransition(async () => {
			const result = await saveTranslationSettings(websiteId, {
				skipWords: trimmedSkipWords,
				skipPath: combineSkipPath(trimmedRules),
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

			{/* Exclude Paths */}
			<div className={cardClass}>
				<div className="flex items-center justify-between mb-1">
					<h2 className="text-sm font-semibold text-[var(--text-heading)]">Exclude Paths</h2>
					{!showAddForm && (
						<button
							type="button"
							onClick={() => setShowAddForm(true)}
							disabled={isPending}
							className="px-3 py-1 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
						>
							Add Rule
						</button>
					)}
				</div>
				<p className="text-xs text-[var(--text-muted)] mb-4">
					Paths matching these rules will not be translated
				</p>

				{/* Add Rule inline form */}
				{showAddForm && (
					<div className="mb-4 p-3 rounded-lg border border-[var(--border)] bg-[var(--page-bg)]">
						<div className="flex items-start gap-2">
							<select
								value={newRuleType}
								onChange={(e) => setNewRuleType(e.target.value as ExcludePathRuleType)}
								className="shrink-0 w-32 px-2 py-1.5 text-sm rounded-md border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-heading)]"
							>
								{RULE_TYPES.map((t) => (
									<option key={t} value={t}>
										{t}
									</option>
								))}
							</select>
							<input
								type="text"
								value={newRulePattern}
								onChange={(e) => {
									setNewRulePattern(e.target.value)
									setAddRuleError(null)
								}}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleAddRule()
									if (e.key === 'Escape') {
										setShowAddForm(false)
										setAddRuleError(null)
										setNewRulePattern('')
									}
								}}
								placeholder="Enter pattern..."
								autoFocus
								className="flex-1 min-w-0 px-2 py-1.5 text-sm rounded-md border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] font-mono"
							/>
							<button
								type="button"
								onClick={handleAddRule}
								className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition-opacity"
							>
								Add
							</button>
							<button
								type="button"
								onClick={() => {
									setShowAddForm(false)
									setAddRuleError(null)
									setNewRulePattern('')
								}}
								className="shrink-0 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
							>
								Cancel
							</button>
						</div>
						{addRuleError && (
							<p className="mt-2 text-xs text-[var(--error)]">{addRuleError}</p>
						)}
					</div>
				)}

				{/* Rules table */}
				<Table>
					<TableHeader className="[&_tr]:bg-[var(--page-bg)]">
						<TableRow>
							<TableHead className="w-36">Type</TableHead>
							<TableHead>Pattern</TableHead>
							<TableHead className="w-16 text-right">{''}</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{skipPathRules.length > 0 ? (
							skipPathRules.map((rule, index) => (
								<TableRow key={`${rule.type}-${rule.pattern}-${index}`}>
									<TableCell>
										<Badge variant="neutral">{rule.type}</Badge>
									</TableCell>
									<TableCell>
										<code className="text-xs font-mono">{rule.pattern}</code>
									</TableCell>
									<TableCell className="text-right">
										<button
											type="button"
											onClick={() => handleRemoveRule(index)}
											disabled={isPending}
											className="text-[var(--text-muted)] hover:text-[var(--error)] transition-colors disabled:opacity-50"
											title="Remove rule"
										>
											<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
												<path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
											</svg>
										</button>
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell className="text-center text-[var(--text-muted)]" colSpan={3}>
									No exclude path rules configured
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			{/* Exclude Selectors */}
			<div className={cardClass}>
				<h2 className="text-sm font-semibold text-[var(--text-heading)] mb-1">Exclude Selectors</h2>
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

			{/* Exclude Words */}
			<div className={cardClass}>
				<h2 className="text-sm font-semibold text-[var(--text-heading)] mb-1">Exclude Words</h2>
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

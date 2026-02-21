'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '@/components/ui/Modal'
import { createWebsite } from '@/actions/onboard'
import { validateHostname } from '@/actions/website'
import { deriveTranslationSubdomain } from '@pantolingo/lang'

export interface LanguageOption {
	code: string
	name: string
	flag: string
}

interface WebsiteWizardModalProps {
	isOpen: boolean
	onClose: () => void
	languages: LanguageOption[]
}

interface WizardState {
	step: 1 | 2 | 3 | 4 | 5
	name: string
	hostname: string
	sourceLang: LanguageOption | null
	targetLangs: LanguageOption[]
	error: string
	loading: boolean
}

const INITIAL_STATE: WizardState = {
	step: 1,
	name: '',
	hostname: '',
	sourceLang: null,
	targetLangs: [],
	error: '',
	loading: false,
}

export function WebsiteWizardModal({ isOpen, onClose, languages }: WebsiteWizardModalProps) {
	const router = useRouter()
	const [state, setState] = useState<WizardState>(INITIAL_STATE)

	const set = (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch }))

	// Reset wizard state when modal closes
	useEffect(() => {
		if (!isOpen) {
			setState(INITIAL_STATE)
		}
	}, [isOpen])

	const handleStep1 = () => {
		if (!state.name.trim()) return set({ error: 'Website name is required' })
		if (state.name.trim().length > 100) return set({ error: 'Name must be 100 characters or less' })
		set({ step: 2, error: '' })
	}

	const handleStep2 = async () => {
		if (!state.hostname.trim()) return set({ error: 'Hostname is required' })
		set({ loading: true, error: '' })
		const result = await validateHostname(state.hostname)
		if (!result.valid) {
			return set({ loading: false, error: result.error || 'Invalid hostname' })
		}
		set({ step: 3, loading: false, error: '' })
	}

	const handleStep3 = () => {
		if (!state.sourceLang) return set({ error: 'Select a source language' })
		set({ step: 4, error: '' })
	}

	const handleStep4 = () => {
		if (state.targetLangs.length === 0) return set({ error: 'Add at least one translation language' })
		set({ step: 5, error: '' })
	}

	const handleCreate = async () => {
		set({ loading: true, error: '' })
		const result = await createWebsite({
			name: state.name.trim(),
			hostname: state.hostname.trim(),
			sourceLang: state.sourceLang!.code,
			targetLangs: state.targetLangs.map((l) => l.code),
		})
		if (result.success) {
			onClose()
			router.push(`/account/${result.publicCode}/languages`)
		} else {
			set({ loading: false, error: result.error || 'Failed to create website' })
		}
	}

	const goBack = () => {
		set({ error: '', step: (state.step - 1) as 1 | 2 | 3 | 4 })
	}

	const handleAddLang = (lang: LanguageOption) => {
		set({ targetLangs: [...state.targetLangs, lang], error: '' })
	}

	const handleRemoveLang = (code: string) => {
		set({ targetLangs: state.targetLangs.filter((l) => l.code !== code) })
	}

	const STEP_DESCRIPTIONS: Record<number, string> = {
		1: 'Give your website a name so you can find it later.',
		2: 'The domain where your original website lives.',
		3: 'The language your website is written in today.',
		4: 'The languages you\'d like to translate into.',
		5: 'Make sure everything looks right, then create your website.',
	}

	return (
		<Modal
			isOpen={isOpen}
			onClose={onClose}
			title="Add website"
			description={STEP_DESCRIPTIONS[state.step]}
			closeOnBackdropClick={false}
			className="max-w-lg overflow-visible [&>div]:overflow-visible"
			contentClassName="overflow-visible"
		>
			{/* Step indicator */}
			<div className="flex items-center gap-2 mb-8">
				{[1, 2, 3, 4, 5].map((n) => (
					<div key={n} className="flex items-center gap-2">
						<div
							className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
								n === state.step
									? 'bg-[var(--accent)] text-white'
									: n < state.step
										? 'bg-[var(--accent)]/20 text-[var(--accent)]'
										: 'bg-[var(--border)] text-[var(--text-muted)]'
							}`}
						>
							{n < state.step ? (
								<svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
									<path d="M20 6 9 17l-5-5" />
								</svg>
							) : (
								n
							)}
						</div>
						{n < 5 && <div className={`w-8 h-0.5 ${n < state.step ? 'bg-[var(--accent)]/40' : 'bg-[var(--border)]'}`} />}
					</div>
				))}
			</div>

			{state.error && (
				<div className="mb-4 p-3 bg-[var(--error)]/10 text-[var(--error)] rounded-md text-sm">
					{state.error}
				</div>
			)}

			{state.step === 1 && (
				<Step1
					name={state.name}
					loading={state.loading}
					onNameChange={(name) => set({ name })}
					onContinue={handleStep1}
				/>
			)}

			{state.step === 2 && (
				<Step2
					hostname={state.hostname}
					loading={state.loading}
					onHostnameChange={(hostname) => set({ hostname })}
					onContinue={handleStep2}
					onBack={goBack}
				/>
			)}

			{state.step === 3 && (
				<Step3
					sourceLang={state.sourceLang}
					languages={languages}
					loading={state.loading}
					onSourceLangChange={(sourceLang) => set({ sourceLang })}
					onContinue={handleStep3}
					onBack={goBack}
				/>
			)}

			{state.step === 4 && (
				<Step4
					targetLangs={state.targetLangs}
					languages={languages}
					sourceLangCode={state.sourceLang?.code ?? ''}
					loading={state.loading}
					onAddLang={handleAddLang}
					onRemoveLang={handleRemoveLang}
					onContinue={handleStep4}
					onBack={goBack}
				/>
			)}

			{state.step === 5 && (
				<Step5
					name={state.name}
					hostname={state.hostname}
					sourceLang={state.sourceLang!}
					targetLangs={state.targetLangs}
					loading={state.loading}
					onCreate={handleCreate}
					onBack={goBack}
				/>
			)}
		</Modal>
	)
}

// ---------------------------------------------------------------------------
// Step Components
// ---------------------------------------------------------------------------

function Step1({
	name,
	loading,
	onNameChange,
	onContinue,
}: {
	name: string
	loading: boolean
	onNameChange: (v: string) => void
	onContinue: () => void
}) {
	return (
		<div>
			<label htmlFor="wizard-name" className="block text-sm font-medium text-[var(--text-body)] mb-2">
				Website name
			</label>
			<input
				id="wizard-name"
				type="text"
				required
				autoFocus
				maxLength={100}
				disabled={loading}
				placeholder="My Blog"
				value={name}
				onChange={(e) => onNameChange(e.target.value)}
				onKeyDown={(e) => e.key === 'Enter' && onContinue()}
				className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-body)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50"
			/>

			<button
				tabIndex={0}
				type="button"
				onClick={onContinue}
				disabled={loading || !name.trim()}
				className="w-full mt-8 py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
			>
				Continue
			</button>
		</div>
	)
}

function Step2({
	hostname,
	loading,
	onHostnameChange,
	onContinue,
	onBack,
}: {
	hostname: string
	loading: boolean
	onHostnameChange: (v: string) => void
	onContinue: () => void
	onBack: () => void
}) {
	return (
		<div>
			<label htmlFor="wizard-hostname" className="block text-sm font-medium text-[var(--text-body)] mb-2">
				Hostname
			</label>
			<input
				id="wizard-hostname"
				type="text"
				required
				autoFocus
				maxLength={253}
				disabled={loading}
				placeholder="example.com"
				value={hostname}
				onChange={(e) => onHostnameChange(e.target.value)}
				onKeyDown={(e) => e.key === 'Enter' && onContinue()}
				className="w-full px-4 py-3 rounded-md border border-[var(--border)] bg-[var(--input-bg)] text-[var(--text-body)] mb-1 focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent disabled:opacity-50"
			/>
			<p className="text-xs text-[var(--text-muted)] mb-4">
				Enter without https:// (e.g., www.example.com)
			</p>

			<div className="flex gap-3 mt-8">
				<button
					type="button"
					onClick={onBack}
					disabled={loading}
					className="flex-1 py-3 border border-[var(--border)] text-[var(--text-body)] rounded-md font-medium hover:bg-[var(--border)]/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Back
				</button>
				<button
					tabIndex={0}
					type="button"
					onClick={onContinue}
					disabled={loading || !hostname.trim()}
					className="flex-1 py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? (
						<svg className="w-5 h-5 animate-spin mx-auto" viewBox="0 0 24 24" fill="none">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
					) : 'Continue'}
				</button>
			</div>
		</div>
	)
}

function Step3({
	sourceLang,
	languages,
	loading,
	onSourceLangChange,
	onContinue,
	onBack,
}: {
	sourceLang: LanguageOption | null
	languages: LanguageOption[]
	loading: boolean
	onSourceLangChange: (v: LanguageOption) => void
	onContinue: () => void
	onBack: () => void
}) {
	const continueRef = useRef<HTMLButtonElement>(null)
	return (
		<div>
			<label className="block text-sm font-medium text-[var(--text-body)] mb-2">
				Source language
			</label>
			<LanguageDropdown
				selected={sourceLang}
				languages={languages}
				disabled={loading}
				onSelect={(lang) => {
					onSourceLangChange(lang)
					setTimeout(() => continueRef.current?.focus(), 0)
				}}
			/>

			<div className="flex gap-3 mt-8">
				<button
					type="button"
					onClick={onBack}
					disabled={loading}
					className="flex-1 py-3 border border-[var(--border)] text-[var(--text-body)] rounded-md font-medium hover:bg-[var(--border)]/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Back
				</button>
				<button
					ref={continueRef}
					tabIndex={0}
					type="button"
					onClick={onContinue}
					disabled={loading || !sourceLang}
					className="flex-1 py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Continue
				</button>
			</div>
		</div>
	)
}

function Step4({
	targetLangs,
	languages,
	sourceLangCode,
	loading,
	onAddLang,
	onRemoveLang,
	onContinue,
	onBack,
}: {
	targetLangs: LanguageOption[]
	languages: LanguageOption[]
	sourceLangCode: string
	loading: boolean
	onAddLang: (lang: LanguageOption) => void
	onRemoveLang: (code: string) => void
	onContinue: () => void
	onBack: () => void
}) {
	// Build set of subdomain prefixes already taken by selected languages
	const takenSubdomains = new Set(targetLangs.map((l) => deriveTranslationSubdomain(l.code)))

	// Filter: exclude source lang, already-selected, and same-subdomain-prefix languages
	const availableLanguages = languages.filter((l) => {
		if (l.code === sourceLangCode) return false
		if (targetLangs.some((t) => t.code === l.code)) return false
		if (takenSubdomains.has(deriveTranslationSubdomain(l.code))) return false
		return true
	})

	return (
		<div>
			<label className="block text-sm font-medium text-[var(--text-body)] mb-2">
				Translation languages
			</label>
			<LanguageDropdown
				selected={null}
				languages={availableLanguages}
				disabled={loading}
				placeholder="Add a language"
				onSelect={onAddLang}
			/>

			{/* Selected languages as removable pills */}
			{targetLangs.length > 0 && (
				<div className="flex flex-wrap gap-2 mt-4">
					{targetLangs.map((lang) => (
						<span
							key={lang.code}
							className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 text-sm font-medium text-[var(--accent)]"
						>
							<span>{lang.flag}</span>
							<span>{lang.name}</span>
							<button
								type="button"
								onClick={() => onRemoveLang(lang.code)}
								disabled={loading}
								className="ml-0.5 hover:text-[var(--error)] transition-colors cursor-pointer disabled:opacity-50"
								aria-label={`Remove ${lang.name}`}
							>
								<svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
									<path d="M18 6 6 18M6 6l12 12" />
								</svg>
							</button>
						</span>
					))}
				</div>
			)}

			<div className="flex gap-3 mt-8">
				<button
					type="button"
					onClick={onBack}
					disabled={loading}
					className="flex-1 py-3 border border-[var(--border)] text-[var(--text-body)] rounded-md font-medium hover:bg-[var(--border)]/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Back
				</button>
				<button
					tabIndex={0}
					type="button"
					onClick={onContinue}
					disabled={loading || targetLangs.length === 0}
					className="flex-1 py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Continue
				</button>
			</div>
		</div>
	)
}

function Step5({
	name,
	hostname,
	sourceLang,
	targetLangs,
	loading,
	onCreate,
	onBack,
}: {
	name: string
	hostname: string
	sourceLang: LanguageOption
	targetLangs: LanguageOption[]
	loading: boolean
	onCreate: () => void
	onBack: () => void
}) {
	return (
		<div>
			<div className="bg-[var(--input-bg)] border border-[var(--border)] rounded-md p-4 space-y-4">
				<div>
					<span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Website name</span>
					<p className="text-[15px] font-medium text-[var(--text-heading)] mt-0.5">{name}</p>
				</div>
				<div>
					<span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Hostname</span>
					<p className="text-[15px] font-medium text-[var(--text-heading)] mt-0.5">{hostname}</p>
				</div>
				<div>
					<span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Source language</span>
					<p className="text-[15px] font-medium text-[var(--text-heading)] mt-0.5">{sourceLang.flag} {sourceLang.name}</p>
				</div>
				<div>
					<span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Translation languages</span>
					<div className="flex flex-wrap gap-2 mt-1.5">
						{targetLangs.map((lang) => (
							<span
								key={lang.code}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 text-sm font-medium text-[var(--accent)]"
							>
								<span>{lang.flag}</span>
								<span>{lang.name}</span>
							</span>
						))}
					</div>
				</div>
			</div>

			<div className="flex gap-3 mt-8">
				<button
					type="button"
					onClick={onBack}
					disabled={loading}
					className="flex-1 py-3 border border-[var(--border)] text-[var(--text-body)] rounded-md font-medium hover:bg-[var(--border)]/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Back
				</button>
				<button
					tabIndex={0}
					type="button"
					onClick={onCreate}
					disabled={loading}
					className="flex-1 py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{loading ? (
						<svg className="w-5 h-5 animate-spin mx-auto" viewBox="0 0 24 24" fill="none">
							<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
							<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
						</svg>
					) : 'Create Website'}
				</button>
			</div>
		</div>
	)
}

// ---------------------------------------------------------------------------
// Language Dropdown (reusable within wizard)
// ---------------------------------------------------------------------------

function LanguageDropdown({
	selected,
	languages,
	disabled,
	placeholder = 'Select a language',
	onSelect,
}: {
	selected: LanguageOption | null
	languages: LanguageOption[]
	disabled: boolean
	placeholder?: string
	onSelect: (lang: LanguageOption) => void
}) {
	const [isOpen, setIsOpen] = useState(false)
	const [search, setSearch] = useState('')
	const dropdownRef = useRef<HTMLDivElement>(null)
	const searchRef = useRef<HTMLInputElement>(null)

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	const handleToggle = () => {
		const next = !isOpen
		setIsOpen(next)
		if (next) {
			setSearch('')
			setTimeout(() => searchRef.current?.focus(), 0)
		}
	}

	const handleSelect = (lang: LanguageOption) => {
		onSelect(lang)
		setIsOpen(false)
		setSearch('')
	}

	const filtered = search
		? languages.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
		: languages

	return (
		<div ref={dropdownRef} className="relative">
			<button
				type="button"
				tabIndex={0}
				onClick={handleToggle}
				disabled={disabled}
				className="w-full flex items-center gap-2 px-4 py-3 rounded-md bg-[var(--input-bg)] border border-[var(--border)] text-sm font-medium text-[var(--text-heading)] hover:border-[var(--border-hover)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
			>
				{selected ? (
					<>
						<span>{selected.flag}</span>
						<span className="flex-1 text-left">{selected.name}</span>
					</>
				) : (
					<span className="flex-1 text-left text-[var(--text-muted)] font-normal">{placeholder}</span>
				)}
				<svg className={`w-4 h-4 text-[var(--text-subtle)] transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>

			{isOpen && (
				<div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg bg-[var(--card-bg)] border border-[var(--border)] shadow-lg">
					<div className="p-2 border-b border-[var(--border)]">
						<input
							ref={searchRef}
							type="text"
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							placeholder="Search languages..."
							className="w-full px-3 py-1.5 rounded-md border border-[var(--border)] bg-[var(--input-bg)] text-sm text-[var(--text-body)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
						/>
					</div>
					<ul className="max-h-52 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
						{filtered.length === 0 ? (
							<li className="px-3 py-2 text-sm text-[var(--text-muted)]">No languages found</li>
						) : (
							filtered.map((lang) => (
								<li key={lang.code}>
									<button
										type="button"
										onClick={() => handleSelect(lang)}
										className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer ${
											selected?.code === lang.code
												? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
												: 'text-[var(--text-muted)]'
										}`}
									>
										<span>{lang.flag}</span>
										<span>{lang.name}</span>
									</button>
								</li>
							))
						)}
					</ul>
				</div>
			)}
		</div>
	)
}

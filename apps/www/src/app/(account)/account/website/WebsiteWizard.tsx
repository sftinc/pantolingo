'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createWebsite } from '@/actions/onboard'

interface LanguageOption {
	code: string
	name: string
	flag: string
}

interface WizardState {
	step: 0 | 1 | 2 | 3 | 4 | 5
	name: string
	hostname: string
	sourceLang: LanguageOption | null
	targetLang: LanguageOption | null
	error: string
	loading: boolean
}

export default function WebsiteWizard({ languages }: { languages: LanguageOption[] }) {
	const router = useRouter()
	const [state, setState] = useState<WizardState>({
		step: 0,
		name: '',
		hostname: '',
		sourceLang: null,
		targetLang: null,
		error: '',
		loading: false,
	})

	const set = (patch: Partial<WizardState>) => setState((s) => ({ ...s, ...patch }))

	const handleStep1 = () => {
		if (!state.name.trim()) return set({ error: 'Website name is required' })
		if (state.name.trim().length > 100) return set({ error: 'Name must be 100 characters or less' })
		set({ step: 2, error: '' })
	}

	const handleStep2 = () => {
		if (!state.hostname.trim()) return set({ error: 'Hostname is required' })
		set({ step: 3, error: '' })
	}

	const handleStep3 = () => {
		if (!state.sourceLang) return set({ error: 'Select a source language' })
		set({ step: 4, error: '' })
	}

	const handleStep4 = () => {
		if (!state.targetLang) return set({ error: 'Select a translation language' })
		set({ step: 5, error: '' })
	}

	const handleCreate = async () => {
		set({ loading: true, error: '' })
		const result = await createWebsite({
			name: state.name.trim(),
			hostname: state.hostname.trim(),
			sourceLang: state.sourceLang!.code,
			targetLang: state.targetLang!.code,
		})
		if (result.success) {
			router.push(`/account/${result.publicCode}/languages`)
		} else {
			set({ loading: false, error: result.error || 'Failed to create website' })
		}
	}

	const goBack = () => {
		set({ error: '', step: (state.step - 1) as 0 | 1 | 2 | 3 | 4 })
	}

	const STEP_LABELS = [
		'Website name',
		'Hostname',
		'Source language',
		'Translation language',
		'Review & create',
	]

	if (state.step === 0) {
		return (
			<main className="flex flex-1 flex-col items-center px-4 py-12 sm:px-6">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-[var(--text-heading)] mb-3">
						Add your website
					</h1>
					<p className="text-base text-[var(--text-muted)] max-w-md">
						Connect your website to Pantolingo and start translating it into other languages in <strong className="text-[var(--text-heading)]">under 5 minutes</strong>.
					</p>
				</div>
				<div className="w-full max-w-md bg-[var(--card-bg)] p-8 sm:p-10 rounded-lg shadow-[0_2px_8px_var(--shadow-color)]">
					<div className="space-y-3 mb-8">
						{STEP_LABELS.map((label, i) => (
							<div key={i} className="flex items-center gap-3">
								<div className="w-8 h-8 shrink-0 rounded-full bg-[var(--border)] flex items-center justify-center text-sm font-medium text-[var(--text-muted)]">
									{i + 1}
								</div>
								<span className="text-base text-[var(--text-body)]">{label}</span>
							</div>
						))}
					</div>
					<button
						type="button"
						onClick={() => set({ step: 1 })}
						className="w-full py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer"
					>
						Get Started
					</button>
				</div>
			</main>
		)
	}

	return (
		<main className="flex flex-1 flex-col items-center px-4 py-12 sm:px-6">
			<div className="text-center mb-8">
				<h1 className="text-3xl font-bold text-[var(--text-heading)] mb-3">
					Add your website
				</h1>
				<p className="text-base text-[var(--text-muted)] max-w-md">
					{state.step === 1 && 'Name your website to get started.'}
					{state.step === 2 && 'Enter the hostname of your website.'}
					{state.step === 3 && 'What language is your website currently in?'}
					{state.step === 4 && 'Choose the language you want to translate into.'}
					{state.step === 5 && 'Review your details and create your website.'}
				</p>
			</div>

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

			<div className="w-full max-w-md bg-[var(--card-bg)] p-8 sm:p-10 rounded-lg shadow-[0_2px_8px_var(--shadow-color)]">
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
						targetLang={state.targetLang}
						languages={languages.filter((l) => l.code !== state.sourceLang?.code)}
						loading={state.loading}
						onTargetLangChange={(targetLang) => set({ targetLang })}
						onContinue={handleStep4}
						onBack={goBack}
					/>
				)}

				{state.step === 5 && (
					<Step5
						name={state.name}
						hostname={state.hostname}
						sourceLang={state.sourceLang!}
						targetLang={state.targetLang!}
						loading={state.loading}
						onCreate={handleCreate}
						onBack={goBack}
					/>
				)}
			</div>
		</main>
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
			<label htmlFor="name" className="block text-sm font-medium text-[var(--text-body)] mb-2">
				Website name
			</label>
			<input
				id="name"
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
				type="button"
				onClick={onContinue}
				disabled={loading}
				className="w-full mt-6 py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
			<label htmlFor="hostname" className="block text-sm font-medium text-[var(--text-body)] mb-2">
				Hostname
			</label>
			<input
				id="hostname"
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

			<div className="flex gap-3">
				<button
					type="button"
					onClick={onBack}
					disabled={loading}
					className="flex-1 py-3 border border-[var(--border)] text-[var(--text-body)] rounded-md font-medium hover:bg-[var(--border)]/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Back
				</button>
				<button
					type="button"
					onClick={onContinue}
					disabled={loading}
					className="flex-1 py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Continue
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
	return (
		<div>
			<label className="block text-sm font-medium text-[var(--text-body)] mb-2">
				Source language
			</label>
			<LanguageDropdown
				selected={sourceLang}
				languages={languages}
				disabled={loading}
				onSelect={onSourceLangChange}
			/>

			<div className="flex gap-3 mt-6">
				<button
					type="button"
					onClick={onBack}
					disabled={loading}
					className="flex-1 py-3 border border-[var(--border)] text-[var(--text-body)] rounded-md font-medium hover:bg-[var(--border)]/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Back
				</button>
				<button
					type="button"
					onClick={onContinue}
					disabled={loading}
					className="flex-1 py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Continue
				</button>
			</div>
		</div>
	)
}

function Step4({
	targetLang,
	languages,
	loading,
	onTargetLangChange,
	onContinue,
	onBack,
}: {
	targetLang: LanguageOption | null
	languages: LanguageOption[]
	loading: boolean
	onTargetLangChange: (v: LanguageOption) => void
	onContinue: () => void
	onBack: () => void
}) {
	return (
		<div>
			<label className="block text-sm font-medium text-[var(--text-body)] mb-2">
				Translation language
			</label>
			<LanguageDropdown
				selected={targetLang}
				languages={languages}
				disabled={loading}
				onSelect={onTargetLangChange}
			/>

			<div className="flex gap-3 mt-6">
				<button
					type="button"
					onClick={onBack}
					disabled={loading}
					className="flex-1 py-3 border border-[var(--border)] text-[var(--text-body)] rounded-md font-medium hover:bg-[var(--border)]/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Back
				</button>
				<button
					type="button"
					onClick={onContinue}
					disabled={loading}
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
	targetLang,
	loading,
	onCreate,
	onBack,
}: {
	name: string
	hostname: string
	sourceLang: LanguageOption
	targetLang: LanguageOption
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
					<span className="text-xs font-medium text-[var(--text-muted)] uppercase tracking-wide">Translation language</span>
					<p className="text-[15px] font-medium text-[var(--text-heading)] mt-0.5">{targetLang.flag} {targetLang.name}</p>
				</div>
			</div>

			<div className="flex gap-3 mt-6">
				<button
					type="button"
					onClick={onBack}
					disabled={loading}
					className="flex-1 py-3 border border-[var(--border)] text-[var(--text-body)] rounded-md font-medium hover:bg-[var(--border)]/30 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Back
				</button>
				<button
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
	onSelect,
}: {
	selected: LanguageOption | null
	languages: LanguageOption[]
	disabled: boolean
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
					<span className="flex-1 text-left text-[var(--text-muted)] font-normal">Select a language</span>
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

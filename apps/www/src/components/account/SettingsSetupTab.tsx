'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { LanguageCard, CopyButton } from './LanguageCard'
import { Modal, ModalFooter, Button } from '@/components/ui/Modal'
import { LANGUAGE_DATA } from '@pantolingo/lang'
import { addLanguagesToWebsite } from '@/actions/website'
import type { LanguageWithDnsStatus } from '@pantolingo/db'

interface LanguageOption {
	code: string
	name: string
	flag: string
}

interface SettingsSetupTabProps {
	websiteId: number
	initialLanguages: LanguageWithDnsStatus[]
	hostname: string
	sourceLang: string
}

const allLanguages: LanguageOption[] = LANGUAGE_DATA.map((l) => ({
	code: l.code,
	name: l.englishName,
	flag: l.flag,
}))

export function SettingsSetupTab({ websiteId, initialLanguages, hostname, sourceLang }: SettingsSetupTabProps) {
	const [languages, setLanguages] = useState(initialLanguages)
	const [showAddModal, setShowAddModal] = useState(false)
	const [selectedLangs, setSelectedLangs] = useState<LanguageOption[]>([])
	const [addError, setAddError] = useState('')
	const [isPending, startTransition] = useTransition()

	const handleDnsCheckComplete = (languageId: number, newStatus: string) => {
		setLanguages((prev) =>
			prev.map((lang) =>
				lang.id === languageId
					? { ...lang, dnsStatus: newStatus, dnsCheckedAt: new Date() }
					: lang
			)
		)
	}

	const handleHostnameChange = (languageId: number, newHostname: string) => {
		setLanguages((prev) =>
			prev.map((lang) =>
				lang.id === languageId
					? { ...lang, hostname: newHostname }
					: lang
			)
		)
	}

	const handleOpenAddModal = () => {
		setSelectedLangs([])
		setAddError('')
		setShowAddModal(true)
	}

	const handleAddLang = (lang: LanguageOption) => {
		setSelectedLangs((prev) => [...prev, lang])
		setAddError('')
	}

	const handleRemoveLang = (code: string) => {
		setSelectedLangs((prev) => prev.filter((l) => l.code !== code))
	}

	const handleSubmitLangs = () => {
		if (selectedLangs.length === 0) return
		startTransition(async () => {
			const result = await addLanguagesToWebsite(websiteId, selectedLangs.map((l) => l.code))
			if (result.success && result.languages) {
				setLanguages((prev) => [...prev, ...result.languages!])
				setShowAddModal(false)
			} else {
				setAddError(result.error || 'Failed to add languages')
			}
		})
	}

	// Filter: exclude source lang and existing/selected languages by exact code
	const existingCodes = new Set(languages.map((l) => l.targetLang))
	const selectedCodes = new Set(selectedLangs.map((l) => l.code))

	const availableLanguages = allLanguages.filter((l) => {
		if (l.code === sourceLang) return false
		if (existingCodes.has(l.code)) return false
		if (selectedCodes.has(l.code)) return false
		return true
	})

	const sourceLangShort = sourceLang.split('-')[0]

	const hreflangLines = [
		`<link rel="alternate" hreflang="${sourceLangShort}" href="https://${hostname}">`,
		...languages.map((lang) => {
			const code = lang.targetLang.split('-')[0]
			return `<link rel="alternate" hreflang="${code}" href="https://${lang.hostname}">`
		}),
		`<script type="text/javascript" src="https://cdn.pantolingo.com/somescript.min.js"></script>`,
	]

	const hreflangBlock = hreflangLines.join('\n')

	const cardClass = 'bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-6'

	return (
		<div className="space-y-5">
			{/* Languages */}
			<div className={cardClass}>
				<div className="flex items-center justify-between mb-1">
					<h2 className="text-sm font-semibold text-[var(--text-heading)]">Languages</h2>
					<button
						onClick={handleOpenAddModal}
						className="px-3 py-1 text-xs font-medium rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition-opacity cursor-pointer"
					>
						Add Language
					</button>
				</div>
				<p className="text-xs text-[var(--text-muted)] mb-4">
					Configure target languages and DNS records
				</p>

				{languages.length === 0 ? (
					<div className="rounded-lg border border-[var(--border)] p-8 text-center">
						<p className="text-sm text-[var(--text-muted)]">No languages configured</p>
					</div>
				) : (
					<div className="space-y-3">
						{languages.map((lang) => (
							<LanguageCard
								key={lang.id}
								websiteId={websiteId}
								websiteHostname={hostname}
								language={lang}
								onDnsCheckComplete={handleDnsCheckComplete}
								onHostnameChange={handleHostnameChange}
							/>
						))}
					</div>
				)}
			</div>

			{/* HTML / SEO Code */}
			<div className={cardClass}>
				<div className="flex items-center justify-between mb-1">
					<h2 className="text-sm font-semibold text-[var(--text-heading)]">HTML / SEO Code</h2>
					<CopyButton text={hreflangBlock} />
				</div>
				<p className="text-xs text-[var(--text-muted)] mb-4">
					Add this code to the <code className="px-1 py-0.5 rounded bg-[var(--page-bg)] text-[var(--text-heading)] font-mono text-[11px]">&lt;head&gt;</code> of your website
				</p>
				<pre className="rounded-md bg-[var(--page-bg)] border border-[var(--border)] p-4 text-xs font-mono text-[var(--text-heading)] whitespace-pre overflow-x-auto">
					{hreflangLines.map((line, i) => (
						<div key={i}>{line}</div>
					))}
				</pre>
			</div>

			{/* Add Language Modal */}
			<Modal
				isOpen={showAddModal}
				onClose={() => setShowAddModal(false)}
				title="Add language"
				size="sm"
				className="overflow-visible [&>div]:overflow-visible"
				contentClassName="overflow-visible"
			>
				<label className="block text-sm font-medium text-[var(--text-body)] mb-2">
					Translation languages
				</label>
				<AddLanguageDropdown
					languages={availableLanguages}
					disabled={isPending}
					onSelect={handleAddLang}
				/>

				{selectedLangs.length > 0 && (
					<div className="flex flex-wrap gap-2 mt-4">
						{selectedLangs.map((lang) => (
							<span
								key={lang.code}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--accent)]/10 text-sm font-medium text-[var(--accent)]"
							>
								<span>{lang.flag}</span>
								<span>{lang.name}</span>
								<button
									type="button"
									onClick={() => handleRemoveLang(lang.code)}
									disabled={isPending}
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

				{addError && (
					<p className="text-xs text-[var(--error)] mt-2">{addError}</p>
				)}

				<ModalFooter>
					<Button variant="primary" onClick={handleSubmitLangs} disabled={isPending || selectedLangs.length === 0} loading={isPending}>
						{isPending ? 'Adding...' : 'Add'}
					</Button>
				</ModalFooter>
			</Modal>
		</div>
	)
}

function AddLanguageDropdown({
	languages,
	disabled,
	onSelect,
}: {
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
				disabled={disabled || languages.length === 0}
				className="w-full flex items-center gap-2 px-4 py-3 rounded-md bg-[var(--input-bg)] border border-[var(--border)] text-sm font-medium text-[var(--text-heading)] hover:border-[var(--border-hover)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
			>
				<span className="flex-1 text-left text-[var(--text-muted)] font-normal">
					{languages.length === 0 ? 'No more languages available' : 'Select a language'}
				</span>
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
										className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer text-[var(--text-muted)]"
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

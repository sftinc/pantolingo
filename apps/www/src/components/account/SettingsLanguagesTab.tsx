'use client'

import { useState } from 'react'
import { LanguageCard, CopyButton } from './LanguageCard'
import { LANGUAGE_DATA } from '@pantolingo/lang'
import type { LanguageWithDnsStatus } from '@pantolingo/db'

interface SettingsLanguagesTabProps {
	websiteId: number
	initialLanguages: LanguageWithDnsStatus[]
	hostname: string
	sourceLang: string
}

export function SettingsLanguagesTab({ websiteId, initialLanguages, hostname, sourceLang }: SettingsLanguagesTabProps) {
	const [languages, setLanguages] = useState(initialLanguages)

	const handleDnsCheckComplete = (languageId: number, newStatus: string) => {
		setLanguages((prev) =>
			prev.map((lang) =>
				lang.id === languageId
					? { ...lang, dnsStatus: newStatus, dnsCheckedAt: new Date() }
					: lang
			)
		)
	}

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
						disabled
						title="Coming soon"
						className="px-3 py-1 text-xs font-medium rounded-md bg-[var(--accent)] text-white opacity-50 cursor-not-allowed"
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
								language={lang}
								onDnsCheckComplete={handleDnsCheckComplete}
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
				<pre className="rounded-md bg-[var(--page-bg)] border border-[var(--border)] p-4 text-xs font-mono text-[var(--text-heading)] overflow-x-auto">
					{hreflangLines.map((line, i) => (
						<div key={i}>{line}</div>
					))}
				</pre>
			</div>
		</div>
	)
}

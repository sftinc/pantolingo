'use client'

import { useState } from 'react'
import { LanguageCard } from './LanguageCard'
import type { LanguageWithDnsStatus } from '@pantolingo/db'

interface SettingsLanguagesTabProps {
	websiteId: number
	initialLanguages: LanguageWithDnsStatus[]
}

export function SettingsLanguagesTab({ websiteId, initialLanguages }: SettingsLanguagesTabProps) {
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

	if (languages.length === 0) {
		return (
			<div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-8 text-center">
				<p className="text-sm text-[var(--text-muted)]">No languages configured</p>
			</div>
		)
	}

	return (
		<div className="space-y-5">
			{languages.map((lang) => (
				<LanguageCard
					key={lang.id}
					websiteId={websiteId}
					language={lang}
					onDnsCheckComplete={handleDnsCheckComplete}
				/>
			))}
		</div>
	)
}

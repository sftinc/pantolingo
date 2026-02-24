'use client'

import { useState } from 'react'
import { SettingsGeneralTab } from './SettingsGeneralTab'
import { SettingsLanguagesTab } from './SettingsLanguagesTab'
import { SettingsTranslationTab } from './SettingsTranslationTab'
import type { LanguageWithDnsStatus } from '@pantolingo/db'

type Tab = 'general' | 'languages' | 'translation'

interface SettingsPageProps {
	websiteId: number
	website: {
		name: string
		hostname: string
		sourceLang: string
		uiColor: string | null
		skipWords: string[]
		skipPath: string[]
		skipSelectors: string[]
		translatePath: boolean
		cacheDisabledRemaining: number | null
	}
	languages: LanguageWithDnsStatus[]
}

const TABS: { key: Tab; label: string }[] = [
	{ key: 'general', label: 'General' },
	{ key: 'languages', label: 'Languages' },
	{ key: 'translation', label: 'Translations' },
]

export function SettingsPage({ websiteId, website, languages }: SettingsPageProps) {
	const [activeTab, setActiveTab] = useState<Tab>('general')

	return (
		<div>
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-1 w-fit">
					{TABS.map((tab) => (
						<button
							key={tab.key}
							onClick={() => setActiveTab(tab.key)}
							className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								activeTab === tab.key
									? 'bg-[var(--accent)] text-white'
									: 'text-[var(--text-muted)] hover:bg-[var(--border)]'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>
				{activeTab === 'languages' && (
					<button
						disabled
						title="Coming soon"
						className="px-3 py-1.5 text-xs font-medium rounded-md bg-[var(--accent)] text-white opacity-50 cursor-not-allowed"
					>
						Add Language
					</button>
				)}
			</div>

			{activeTab === 'general' && (
				<SettingsGeneralTab
					websiteId={websiteId}
					initialName={website.name}
					hostname={website.hostname}
					sourceLang={website.sourceLang}
					initialUiColor={website.uiColor}
					devModeRemaining={website.cacheDisabledRemaining}
				/>
			)}

			{activeTab === 'languages' && (
				<SettingsLanguagesTab
					websiteId={websiteId}
					initialLanguages={languages}
				/>
			)}

			{activeTab === 'translation' && (
				<SettingsTranslationTab
					websiteId={websiteId}
					initialSkipWords={website.skipWords}
					initialSkipPath={website.skipPath}
					initialSkipSelectors={website.skipSelectors}
					initialTranslatePath={website.translatePath}
				/>
			)}
		</div>
	)
}

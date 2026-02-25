'use client'

import { useState, useCallback } from 'react'
import { SettingsGeneralTab } from './SettingsGeneralTab'
import { SettingsLanguagesTab } from './SettingsLanguagesTab'
import { SettingsTranslationTab } from './SettingsTranslationTab'
import { Modal, ModalFooter, Button } from '@/components/ui/Modal'
import type { LanguageWithDnsStatus } from '@pantolingo/db'

type Tab = 'general' | 'languages' | 'translation'

interface SettingsPageProps {
	websiteId: number
	publicCode: string
	initialTab: Tab
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

function getTabUrl(publicCode: string, tab: Tab): string {
	if (tab === 'general') return `/account/${publicCode}/settings`
	return `/account/${publicCode}/settings/${tab}`
}

export function SettingsPage({ websiteId, publicCode, initialTab, website, languages }: SettingsPageProps) {
	const [activeTab, setActiveTab] = useState<Tab>(initialTab)
	const [dirtyTabs, setDirtyTabs] = useState<Record<Tab, boolean>>({ general: false, languages: false, translation: false })
	const [pendingTab, setPendingTab] = useState<Tab | null>(null)

	const switchTab = (tab: Tab) => {
		setActiveTab(tab)
		window.history.pushState(null, '', getTabUrl(publicCode, tab))
	}

	const handleTabClick = (tab: Tab) => {
		if (tab === activeTab) return
		if (dirtyTabs[activeTab]) {
			setPendingTab(tab)
		} else {
			switchTab(tab)
		}
	}

	const handleDiscard = () => {
		if (pendingTab) {
			setDirtyTabs((prev) => ({ ...prev, [activeTab]: false }))
			switchTab(pendingTab)
			setPendingTab(null)
		}
	}

	const handleStay = () => {
		setPendingTab(null)
	}

	const handleGeneralDirty = useCallback((dirty: boolean) => {
		setDirtyTabs((prev) => ({ ...prev, general: dirty }))
	}, [])

	const handleTranslationDirty = useCallback((dirty: boolean) => {
		setDirtyTabs((prev) => ({ ...prev, translation: dirty }))
	}, [])

	return (
		<div className="max-w-2xl">
			<div className="flex items-center justify-between mb-5">
				<div className="flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-1 w-fit">
					{TABS.map((tab) => (
						<button
							key={tab.key}
							onClick={() => handleTabClick(tab.key)}
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
					onDirtyChange={handleGeneralDirty}
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
					onDirtyChange={handleTranslationDirty}
				/>
			)}

			<Modal isOpen={pendingTab !== null} onClose={handleStay} title="Unsaved Changes" hideClose className="max-w-lg">
				<p className="text-sm text-[var(--text-muted)]">
					You have unsaved changes that will be lost. <span className="font-semibold">Do you want to discard your changes?</span>
				</p>
				<ModalFooter>
					<Button variant="secondary" onClick={handleStay}>Stay</Button>
					<Button variant="primary" onClick={handleDiscard}>Discard</Button>
				</ModalFooter>
			</Modal>
		</div>
	)
}

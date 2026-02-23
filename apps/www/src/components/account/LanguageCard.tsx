'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/Badge'
import { LANGUAGE_DATA } from '@pantolingo/lang'
import { checkDnsStatus } from '@/actions/website'
import type { LanguageWithDnsStatus } from '@pantolingo/db'

const STATUS_BADGE: Record<string, 'success' | 'warning' | 'error'> = {
	active: 'success',
	pending: 'warning',
	failed: 'error',
}

const STATUS_LABEL: Record<string, string> = {
	active: 'Active',
	pending: 'Pending',
	failed: 'Failed',
}

interface LanguageCardProps {
	websiteId: number
	language: LanguageWithDnsStatus
	onDnsCheckComplete: (languageId: number, newStatus: string) => void
}

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false)

	const handleCopy = () => {
		navigator.clipboard.writeText(text).then(() => {
			setCopied(true)
			setTimeout(() => setCopied(false), 1500)
		}).catch(() => {})
	}

	return (
		<button
			onClick={handleCopy}
			className="p-1 rounded text-[var(--text-subtle)] hover:text-[var(--text-muted)] hover:bg-[var(--border)] transition-colors cursor-pointer"
			title="Copy"
		>
			{copied ? (
				<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--success)]">
					<polyline points="20 6 9 17 4 12" />
				</svg>
			) : (
				<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
				</svg>
			)}
		</button>
	)
}

export function LanguageCard({ websiteId, language, onDnsCheckComplete }: LanguageCardProps) {
	const [isPending, startTransition] = useTransition()
	const langData = LANGUAGE_DATA.find((l) => l.code === language.targetLang)
	const isActive = language.dnsStatus === 'active'

	const handleCheckDns = () => {
		startTransition(async () => {
			const result = await checkDnsStatus(websiteId, language.id)
			if (result.success && result.dnsStatus) {
				onDnsCheckComplete(language.id, result.dnsStatus)
			}
		})
	}

	const timestamp = language.dnsCheckedAt
		? new Date(language.dnsCheckedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
		: null

	return (
		<div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-5">
			<div className={`flex items-center justify-between ${!isActive ? 'mb-3' : ''}`}>
				<div className="flex items-center gap-2">
					<span className="text-base">{langData?.flag}</span>
					<span className="text-sm font-medium text-[var(--text-heading)]">
						{langData?.englishName ?? language.targetLang}
					</span>
					<Badge variant={STATUS_BADGE[language.dnsStatus] ?? 'neutral'}>
						{STATUS_LABEL[language.dnsStatus] ?? language.dnsStatus}
					</Badge>
					{timestamp && (
						<span className="text-xs text-[var(--text-subtle)]">{timestamp}</span>
					)}
				</div>
				<div className="flex items-center gap-2">
					{!isActive && (
						<button
							onClick={handleCheckDns}
							disabled={isPending}
							className="px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text-heading)] bg-[var(--card-bg)] hover:bg-[var(--page-bg)] transition-colors cursor-pointer disabled:opacity-50"
						>
							{isPending ? 'Checking...' : 'Check DNS'}
						</button>
					)}
					<button
						disabled
						className="p-1 text-[var(--text-subtle)] opacity-50 cursor-not-allowed"
						title="Remove language"
					>
						<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
							<path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
						</svg>
					</button>
				</div>
			</div>

			{!isActive && (
				<div className="rounded-md bg-[var(--page-bg)] border border-[var(--border)] p-3">
					<p className="text-xs font-medium text-[var(--text-subtle)] mb-2">Add CNAME DNS Record</p>
					<div className="flex items-center gap-2 font-mono text-sm">
						<span className="text-[var(--text-heading)]">{language.hostname}</span>
						<CopyButton text={language.hostname} />
						<span className="text-[var(--text-subtle)]">&rarr;</span>
						<span className="text-[var(--text-heading)]">cname.pantolingo.com</span>
						<CopyButton text="cname.pantolingo.com" />
					</div>
				</div>
			)}
		</div>
	)
}

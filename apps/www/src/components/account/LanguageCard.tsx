'use client'

import { useState, useTransition } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Modal, ModalFooter, Button } from '@/components/ui/Modal'
import { LANGUAGE_DATA } from '@pantolingo/lang'
import { checkDnsStatus, updateLanguageHostname } from '@/actions/website'
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

const STATUS_BG: Record<string, string> = {
	active: 'rgba(34, 197, 94, 0.05)',
	pending: 'rgba(234, 179, 8, 0.05)',
	failed: 'rgba(239, 68, 68, 0.05)',
}

const STATUS_BORDER: Record<string, string> = {
	active: 'rgba(34, 197, 94, 0.2)',
	pending: 'rgba(234, 179, 8, 0.2)',
	failed: 'rgba(239, 68, 68, 0.2)',
}

interface LanguageCardProps {
	websiteId: number
	websiteHostname: string
	language: LanguageWithDnsStatus
	onDnsCheckComplete: (languageId: number, newStatus: string) => void
	onHostnameChange?: (languageId: number, newHostname: string) => void
}

export function CopyButton({ text }: { text: string }) {
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

export function LanguageCard({ websiteId, websiteHostname, language, onDnsCheckComplete, onHostnameChange }: LanguageCardProps) {
	const [isPending, startTransition] = useTransition()
	const langData = LANGUAGE_DATA.find((l) => l.code === language.targetLang)
	const isActive = language.dnsStatus === 'active'

	const [showInfo, setShowInfo] = useState(false)
	const [showEditModal, setShowEditModal] = useState(false)
	const [subdomainValue, setSubdomainValue] = useState('')
	const [hostnameError, setHostnameError] = useState('')
	const [isSaving, startSaveTransition] = useTransition()

	const apexSuffix = '.' + websiteHostname
	const getSubdomain = (h: string) => {
		if (h.endsWith(apexSuffix)) return h.slice(0, -apexSuffix.length)
		const dot = h.indexOf('.')
		return dot > 0 ? h.slice(0, dot) : h
	}

	const handleOpenEditModal = () => {
		setSubdomainValue(getSubdomain(language.hostname))
		setHostnameError('')
		setShowEditModal(true)
	}

	const handleSaveHostname = () => {
		const trimmed = subdomainValue.trim().toLowerCase()
		if (!trimmed) return
		const fullHostname = trimmed + apexSuffix
		startSaveTransition(async () => {
			setHostnameError('')
			const result = await updateLanguageHostname(websiteId, language.id, fullHostname)
			if (result.success) {
				setShowEditModal(false)
				onHostnameChange?.(language.id, fullHostname)
			} else {
				setHostnameError(result.error || 'Failed to update hostname')
			}
		})
	}

	const handleCheckDns = () => {
		startTransition(async () => {
			const result = await checkDnsStatus(websiteId, language.id)
			if (result.success && result.dnsStatus) {
				onDnsCheckComplete(language.id, result.dnsStatus)
			}
		})
	}

	return (
		<>
			<div
				className="rounded-lg p-5"
				style={{
					backgroundColor: STATUS_BG[language.dnsStatus] ?? 'var(--card-bg)',
					border: `1px solid ${STATUS_BORDER[language.dnsStatus] ?? 'var(--border)'}`,
				}}
			>
				<div className={`flex items-center flex-wrap gap-2 ${(!isActive || showInfo) ? 'mb-3' : ''}`}>
					<Badge variant={STATUS_BADGE[language.dnsStatus] ?? 'neutral'}>
						{STATUS_LABEL[language.dnsStatus] ?? language.dnsStatus}
					</Badge>
					<span className="text-base">{langData?.flag}</span>
					<span className="text-sm font-medium text-[var(--text-heading)]">
						{langData?.englishName ?? language.targetLang}
					</span>
					<span className="flex-1" />
					<div className="flex items-center gap-2">
						{!language.verifiedAt && (
							<button
								onClick={handleOpenEditModal}
								className="p-1 rounded text-[var(--text-subtle)] hover:text-[var(--text-muted)] hover:bg-[var(--border)] transition-colors cursor-pointer"
								title="Edit hostname"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
								</svg>
							</button>
						)}
						{!isActive && (
							<button
								disabled
								className="p-1 text-[var(--text-subtle)] opacity-50 cursor-not-allowed"
								title="Remove language"
							>
								<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
								</svg>
							</button>
						)}
						{isActive ? (
							<button
								onClick={() => setShowInfo(!showInfo)}
								className="px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text-heading)] bg-[var(--card-bg)] hover:bg-[var(--page-bg)] transition-colors cursor-pointer"
							>
								{showInfo ? 'Hide Info' : 'View Info'}
							</button>
						) : (
							<button
								onClick={handleCheckDns}
								disabled={isPending}
								className="px-2.5 py-1 text-xs font-medium rounded-md border border-[var(--border)] text-[var(--text-heading)] bg-[var(--card-bg)] hover:bg-[var(--page-bg)] transition-colors cursor-pointer disabled:opacity-50"
							>
								{isPending ? 'Checking...' : 'Check DNS'}
							</button>
						)}
					</div>
				</div>

				{!isActive && (
					<div className="rounded-md bg-[var(--page-bg)] border border-[var(--border)] p-3">
						<p className="text-xs font-medium text-[var(--text-subtle)] mb-2">Add CNAME DNS Record</p>
						<div className="space-y-1.5">
							<div className="flex items-center gap-2 font-mono text-sm">
								<span className="text-xs font-sans font-medium text-gray-400 w-12 shrink-0">Name</span>
								<span className="text-[var(--text-heading)] truncate">{language.hostname}</span>
								<CopyButton text={language.hostname} />
							</div>
							<div className="flex items-center gap-2 font-mono text-sm">
								<span className="text-xs font-sans font-medium text-gray-400 w-12 shrink-0">Value</span>
								<span className="text-[var(--text-heading)] truncate">cname.pantolingo.com</span>
								<CopyButton text="cname.pantolingo.com" />
							</div>
						</div>
					</div>
				)}

				{isActive && showInfo && (
					<div className="rounded-md bg-[var(--page-bg)] border border-[var(--border)] p-3">
						<p className="text-xs font-medium text-[var(--text-subtle)] mb-2">CNAME DNS Record</p>
						<div className="space-y-1.5">
							<div className="flex items-center gap-2 font-mono text-sm">
								<span className="text-xs font-sans font-medium text-gray-400 w-12 shrink-0">Name</span>
								<span className="text-[var(--text-heading)] truncate">{language.hostname}</span>
							</div>
							<div className="flex items-center gap-2 font-mono text-sm">
								<span className="text-xs font-sans font-medium text-gray-400 w-12 shrink-0">Value</span>
								<span className="text-[var(--text-heading)] truncate">cname.pantolingo.com</span>
							</div>
						</div>
					</div>
				)}
			</div>

			<Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Hostname" className="max-w-sm">
				<div className="flex items-center gap-2 mb-4">
					<span className="text-base">{langData?.flag}</span>
					<span className="text-sm font-medium text-[var(--text-heading)]">
						{langData?.englishName ?? language.targetLang}
					</span>
				</div>
				<div className="flex rounded-md border border-[var(--border)] overflow-hidden">
					<input
						type="text"
						value={subdomainValue}
						onChange={(e) => setSubdomainValue(e.target.value)}
						disabled={isSaving}
						className="flex-1 min-w-0 px-3 py-2 text-sm font-mono bg-[var(--input-bg)] text-[var(--text-heading)] focus:outline-none disabled:opacity-50"
						placeholder="subdomain"
					/>
					<span className="px-3 py-2 text-sm font-mono text-[var(--text-subtle)] bg-[var(--page-bg)] border-l border-[var(--border)] shrink-0">
						{apexSuffix}
					</span>
				</div>
				{hostnameError && (
					<p className="text-xs text-[var(--error)] mt-2">{hostnameError}</p>
				)}
				<ModalFooter>
					<Button variant="secondary" onClick={() => setShowEditModal(false)} disabled={isSaving}>Cancel</Button>
					<Button variant="primary" onClick={handleSaveHostname} disabled={isSaving || !subdomainValue.trim()}>
						{isSaving ? 'Saving...' : 'Save'}
					</Button>
				</ModalFooter>
			</Modal>
		</>
	)
}

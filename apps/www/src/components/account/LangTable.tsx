'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from '@/components/ui/Table'
import { formatNumber } from '@/lib/utils'
import { getFlag, getLanguageName } from '@pantolingo/lang'
import type { LangWithStats } from '@pantolingo/db'

interface LangTableProps {
	langs: LangWithStats[]
	publicCode: string
}

export function LangTable({ langs, publicCode }: LangTableProps) {
	const router = useRouter()

	if (langs.length === 0) {
		return <EmptyState message="No languages configured for this website" />
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead className="text-right">Segments</TableHead>
					<TableHead className="text-right">Paths</TableHead>
					<TableHead className="w-12">{''}</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{langs.map((lang) => (
					<TableRow
						key={lang.targetLang}
						clickable
						onClick={() => router.push(`/account/${publicCode}/segments?lang=${lang.targetLang}`)}
					>
						<TableCell className="font-medium">
							{getFlag(lang.targetLang)} {getLanguageName(lang.targetLang).split(' (')[0]}
						</TableCell>
						<TableCell className="text-right tabular-nums">
							<Link
								href={`/account/${publicCode}/segments?lang=${lang.targetLang}`}
								onClick={(e) => e.stopPropagation()}
								className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
							>
								{formatNumber(lang.translatedSegmentCount)}
							</Link>
						</TableCell>
						<TableCell className="text-right tabular-nums">
							<Link
								href={`/account/${publicCode}/paths?lang=${lang.targetLang}`}
								onClick={(e) => e.stopPropagation()}
								className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
							>
								{formatNumber(lang.translatedPathCount)}
							</Link>
						</TableCell>
						<TableCell className="text-right">
							<ActionsMenu langCd={lang.targetLang} />
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}

function ActionsMenu({ langCd }: { langCd: string }) {
	const [isOpen, setIsOpen] = useState(false)
	const btnRef = useRef<HTMLButtonElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)
	const [pos, setPos] = useState({ top: 0, right: 0 })

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (
				menuRef.current && !menuRef.current.contains(e.target as Node) &&
				btnRef.current && !btnRef.current.contains(e.target as Node)
			) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	// Close on scroll (matching mock behavior)
	useEffect(() => {
		if (!isOpen) return
		const handler = () => setIsOpen(false)
		window.addEventListener('scroll', handler, true)
		return () => window.removeEventListener('scroll', handler, true)
	}, [isOpen])

	function handleToggle(e: React.MouseEvent) {
		e.stopPropagation()
		if (!isOpen && btnRef.current) {
			const rect = btnRef.current.getBoundingClientRect()
			setPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right })
		}
		setIsOpen(!isOpen)
	}

	return (
		<div className="relative inline-block">
			<button
				ref={btnRef}
				onClick={handleToggle}
				className="p-1.5 rounded-md text-[var(--text-subtle)] hover:text-[var(--text-heading)] hover:bg-[var(--border)] transition-colors cursor-pointer"
				aria-label={`Actions for ${langCd}`}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
					<circle cx="10" cy="4" r="1.5" />
					<circle cx="10" cy="10" r="1.5" />
					<circle cx="10" cy="16" r="1.5" />
				</svg>
			</button>

			{isOpen && (
				<div
					ref={menuRef}
					className="fixed z-50 w-36 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] shadow-lg py-1 overflow-hidden"
					style={{ top: pos.top, right: pos.right }}
				>
					<button
						onClick={(e) => {
							e.stopPropagation()
							setIsOpen(false)
						}}
						className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-active-bg)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
						Edit
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation()
							setIsOpen(false)
						}}
						className="w-full flex items-center gap-2 px-4 py-2 text-sm text-[var(--error)] hover:bg-[var(--nav-active-bg)] transition-colors cursor-pointer"
					>
						<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
						Delete
					</button>
				</div>
			)}
		</div>
	)
}

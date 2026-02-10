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
							{getFlag(lang.targetLang)} {getLanguageName(lang.targetLang)}
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
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	return (
		<div ref={menuRef} className="relative inline-block">
			<button
				onClick={(e) => {
					e.stopPropagation()
					setIsOpen(!isOpen)
				}}
				className="p-1 rounded-md text-[var(--text-subtle)] hover:text-[var(--text-heading)] hover:bg-[var(--border)] transition-colors cursor-pointer"
				aria-label={`Actions for ${langCd}`}
			>
				<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
					<circle cx="12" cy="5" r="2" />
					<circle cx="12" cy="12" r="2" />
					<circle cx="12" cy="19" r="2" />
				</svg>
			</button>

			{isOpen && (
				<div className="absolute right-0 top-full z-50 mt-1 w-32 rounded-lg bg-[var(--card-bg)] border border-[var(--border)] shadow-lg overflow-hidden">
					<button
						onClick={(e) => {
							e.stopPropagation()
							setIsOpen(false)
						}}
						className="w-full text-left px-3 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-active-bg)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
					>
						Edit
					</button>
					<button
						onClick={(e) => {
							e.stopPropagation()
							setIsOpen(false)
						}}
						className="w-full text-left px-3 py-2 text-sm text-[var(--error)] hover:bg-[var(--nav-active-bg)] transition-colors cursor-pointer"
					>
						Delete
					</button>
				</div>
			)}
		</div>
	)
}

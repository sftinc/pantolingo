'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table'
import { formatNumber } from '@/lib/utils'
import { getFlag, getLanguageName } from '@pantolingo/lang'
import type { LangWithStats } from '@pantolingo/db'

interface LangTableProps {
	langs: LangWithStats[]
	publicCode: string
	filter?: 'all' | 'unreviewed'
}

export function LangTable({ langs, publicCode, filter = 'all' }: LangTableProps) {
	const router = useRouter()

	if (langs.length === 0) {
		return (
			<div className="text-center py-12 bg-[var(--card-bg)] rounded-lg">
				<p className="text-[var(--text-muted)]">No languages yet. Add a language to start translating your website.</p>
			</div>
		)
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Name</TableHead>
					<TableHead className="text-right">Segments</TableHead>
					<TableHead className="text-right">Paths</TableHead>
					<TableHead className="text-right hidden sm:table-cell">Words</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				{langs.map((lang) => {
					const segmentCount = filter === 'unreviewed' ? lang.unreviewedSegmentCount : lang.translatedSegmentCount
					const pathCount = filter === 'unreviewed' ? lang.unreviewedPathCount : lang.translatedPathCount
					const wordCount = (filter === 'unreviewed' ? lang.unreviewedWordCount : lang.totalWordCount) ?? 0
					const filterParam = filter === 'unreviewed' ? '&filter=unreviewed' : ''

					return (
					<TableRow
						key={lang.targetLang}
						clickable
						onClick={() => router.push(`/account/${publicCode}/segments?lang=${lang.targetLang}${filterParam}`)}
					>
						<TableCell className="font-medium">
							{getFlag(lang.targetLang)} {getLanguageName(lang.targetLang).split(' (')[0]}
						</TableCell>
						<TableCell className="text-right tabular-nums">
							<Link
								href={`/account/${publicCode}/segments?lang=${lang.targetLang}${filterParam}`}
								onClick={(e) => e.stopPropagation()}
								className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
							>
								{formatNumber(segmentCount)}
							</Link>
						</TableCell>
						<TableCell className="text-right tabular-nums">
							<Link
								href={`/account/${publicCode}/paths?lang=${lang.targetLang}${filterParam}`}
								onClick={(e) => e.stopPropagation()}
								className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
							>
								{formatNumber(pathCount)}
							</Link>
						</TableCell>
						<TableCell className="text-right tabular-nums text-[var(--text-muted)] hidden sm:table-cell">
							{formatNumber(wordCount)}
						</TableCell>
					</TableRow>
					)
				})}
			</TableBody>
		</Table>
	)
}

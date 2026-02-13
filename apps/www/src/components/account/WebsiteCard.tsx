'use client'

import { useRouter } from 'next/navigation'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { formatNumber } from '@/lib/utils'
import { getLanguageName } from '@pantolingo/lang'
import type { WebsiteWithStats } from '@pantolingo/db'

interface WebsiteCardProps {
	website: WebsiteWithStats
}

export function WebsiteCard({ website }: WebsiteCardProps) {
	const router = useRouter()

	const handleSettingsClick = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		router.push(`/account/${website.publicCode}/settings`)
	}

	return (
		<Card href={`/account/${website.publicCode}`}>
			<CardHeader className="flex flex-row items-start justify-between">
				<div>
					<CardTitle>{website.hostname}</CardTitle>
					<CardDescription>Source: {getLanguageName(website.sourceLang)}</CardDescription>
				</div>
				<button
					onClick={handleSettingsClick}
					className="p-1.5 rounded-md text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--border)] transition-colors focus:outline-none cursor-pointer"
					aria-label="Website settings"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<circle cx="12" cy="12" r="3" />
						<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
					</svg>
				</button>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-3 gap-4 text-center">
					<div>
						<div className="text-2xl font-semibold text-[var(--text-heading)]">
							{formatNumber(website.langCount)}
						</div>
						<div className="text-xs text-[var(--text-muted)]">
							{website.langCount === 1 ? 'Language' : 'Languages'}
						</div>
					</div>
					<div>
						<div className="text-2xl font-semibold text-[var(--text-heading)]">
							{formatNumber(website.segmentCount)}
						</div>
						<div className="text-xs text-[var(--text-muted)]">Segments</div>
					</div>
					<div>
						<div className="text-2xl font-semibold text-[var(--text-heading)]">
							{formatNumber(website.pathCount)}
						</div>
						<div className="text-xs text-[var(--text-muted)]">Paths</div>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

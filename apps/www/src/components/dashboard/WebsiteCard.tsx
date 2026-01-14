import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card'
import { formatNumber } from '@/lib/utils'
import { getLanguageName } from '@pantolingo/lang'
import type { WebsiteWithStats } from '@pantolingo/db'

interface WebsiteCardProps {
	website: WebsiteWithStats
}

export function WebsiteCard({ website }: WebsiteCardProps) {
	return (
		<Card href={`/dashboard/website/${website.id}`}>
			<CardHeader>
				<CardTitle>{website.domain}</CardTitle>
				<CardDescription>Source: {getLanguageName(website.sourceLang)}</CardDescription>
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

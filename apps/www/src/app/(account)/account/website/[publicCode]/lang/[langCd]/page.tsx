import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import {
	canAccessWebsiteByPublicCode,
	getWebsiteByPublicCode,
	isValidLangForWebsite,
	getPathsForWebsite,
	getSegmentsForLang,
	getPathsForLang,
} from '@pantolingo/db'
import { BreadcrumbNav } from '@/components/account/BreadcrumbNav'
import { SegmentTable } from '@/components/account/SegmentTable'
import { PathTable } from '@/components/account/PathTable'
import { Toggle } from '@/components/ui/Toggle'
import { PathSelect } from '@/components/ui/PathSelect'
import { Pagination } from '@/components/ui/Pagination'
import { formatNumber } from '@/lib/utils'
import { getFlag, getLanguageLabel } from '@pantolingo/lang'

export const dynamic = 'force-dynamic'

interface LangDetailPageProps {
	params: Promise<{ publicCode: string; langCd: string }>
	searchParams: Promise<{ view?: string; filter?: string; page?: string; path?: string }>
}

export default async function LangDetailPage({ params, searchParams }: LangDetailPageProps) {
	const session = await auth()

	if (!session) {
		redirect('/login')
	}

	const { publicCode, langCd } = await params
	const { view = 'segments', filter = 'unreviewed', page = '1', path } = await searchParams
	const pageNum = parseInt(page, 10) || 1
	const limit = 50

	// Parse path param: undefined = all, 'none' = orphans, number = specific path
	const pathId: number | 'none' | undefined =
		path === undefined ? undefined : path === 'none' ? 'none' : parseInt(path, 10) || undefined

	// Validate publicCode format (16-char hex)
	if (!/^[0-9a-f]{16}$/i.test(publicCode)) {
		redirect('/account')
	}

	// Check authorization and get websiteId
	const websiteId = await canAccessWebsiteByPublicCode(session.user.accountId, publicCode)
	if (!websiteId) {
		redirect('/account')
	}

	const website = await getWebsiteByPublicCode(publicCode)

	// Website not found - redirect to account
	if (!website) {
		redirect('/account')
	}

	// Invalid language for this website - redirect to website page
	const validLang = await isValidLangForWebsite(websiteId, langCd)
	if (!validLang) {
		redirect(`/account/website/${publicCode}`)
	}

	const validView = view === 'paths' ? 'paths' : 'segments'
	const validFilter = filter === 'all' ? 'all' : 'unreviewed'

	// Fetch paths for the dropdown (only when viewing segments)
	const pathOptions = validView === 'segments' ? await getPathsForWebsite(websiteId) : []

	const segmentData =
		validView === 'segments'
			? await getSegmentsForLang(websiteId, langCd, validFilter, pageNum, limit, pathId)
			: null
	const pathData =
		validView === 'paths'
			? await getPathsForLang(websiteId, langCd, validFilter, pageNum, limit)
			: null
	const data = segmentData ?? pathData!

	// Build path param string for URLs
	const pathParam = pathId !== undefined ? `&path=${pathId}` : ''
	const baseUrl = `/account/website/${publicCode}/lang/${langCd}?view=${validView}&filter=${validFilter}${pathParam}`

	return (
		<div>
			<BreadcrumbNav
				breadcrumbs={[
					{ label: 'Account', href: '/account' },
					{
						label: `${website.hostname} ${getFlag(website.sourceLang)}`,
						href: `/account/website/${publicCode}`,
					},
					{ label: `${getLanguageLabel(langCd)} (${formatNumber(data.total)})` },
				]}
			/>

			{/* View and Filter toggles */}
			<div className="mb-6 flex flex-wrap items-center gap-4">
				<Toggle
					options={[
						{ value: 'segments', label: 'Segments' },
						{ value: 'paths', label: 'Paths' },
					]}
					value={validView}
					baseUrl={`/account/website/${publicCode}/lang/${langCd}?filter=${validFilter}`}
					paramName="view"
				/>
				<Toggle
					options={[
						{ value: 'unreviewed', label: 'Unreviewed' },
						{ value: 'all', label: 'All' },
					]}
					value={validFilter}
					baseUrl={`/account/website/${publicCode}/lang/${langCd}?view=${validView}${pathParam}`}
					paramName="filter"
				/>
				{validView === 'segments' && (
					<PathSelect
						paths={pathOptions}
						selectedPathId={pathId ?? null}
						baseUrl={`/account/website/${publicCode}/lang/${langCd}?view=${validView}&filter=${validFilter}`}
						className="ml-auto"
					/>
				)}
			</div>

			{/* Empty state message */}
			{data.total === 0 && validFilter === 'unreviewed' && (
				<div className="mb-6 rounded-lg bg-[var(--success-bg)] p-4 text-[var(--success-text)]">
					All translations have been reviewed. Switch to &quot;All&quot; to see all translations.
				</div>
			)}

			{/* Data table */}
			{segmentData && <SegmentTable segments={segmentData.items} targetLang={langCd} websiteId={websiteId} />}
			{pathData && <PathTable paths={pathData.items} targetLang={langCd} websiteId={websiteId} />}

			{/* Pagination */}
			<div className="mt-6">
				<Pagination currentPage={data.page} totalPages={data.totalPages} baseUrl={baseUrl} />
			</div>
		</div>
	)
}

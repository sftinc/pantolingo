import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
	canAccessWebsiteByPublicCode,
	getLangsForWebsite,
	getLastLang,
	isValidLangForWebsite,
	getSegmentsForLang,
	getPathsForWebsite,
	updateWebsiteActivity,
} from '@pantolingo/db'
import { SegmentTable } from '@/components/account/SegmentTable'
import { LanguageDropdown } from '@/components/account/LanguageDropdown'
import { Toggle } from '@/components/ui/Toggle'
import { PathSelect } from '@/components/ui/PathSelect'
import { Pagination } from '@/components/ui/Pagination'
import { formatNumber } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface SegmentsPageProps {
	params: Promise<{ publicCode: string }>
	searchParams: Promise<{ lang?: string; filter?: string; page?: string; path?: string }>
}

export default async function SegmentsPage({ params, searchParams }: SegmentsPageProps) {
	const session = await auth()
	if (!session) redirect('/login')

	const { publicCode } = await params
	const { lang, filter = 'all', page = '1', path } = await searchParams

	const access = await canAccessWebsiteByPublicCode(session.user.accountId, publicCode)
	if (!access) redirect('/account')
	const websiteId = access.websiteId

	const langs = await getLangsForWebsite(websiteId)

	if (langs.length === 0) {
		return (
			<div>
				<h1 className="mb-6 text-2xl font-semibold text-[var(--text-heading)]">Segments</h1>
				<div className="text-center py-12 bg-[var(--card-bg)] rounded-lg">
					<p className="text-[var(--text-muted)] mb-2">No segments yet</p>
					<p className="text-sm text-[var(--text-muted)]">
						<a href={`/account/${publicCode}/languages`} className="text-[var(--accent)] hover:underline">Add a language</a> to start translating your website.
					</p>
				</div>
			</div>
		)
	}

	// Resolve language: ?lang= param → last_lang → first language
	let resolvedLangCd = lang
	if (!resolvedLangCd) {
		const lastLang = await getLastLang(session.user.accountId, websiteId)
		if (lastLang && (await isValidLangForWebsite(websiteId, lastLang))) {
			resolvedLangCd = lastLang
		}
	}
	if (!resolvedLangCd || !(await isValidLangForWebsite(websiteId, resolvedLangCd))) {
		resolvedLangCd = langs[0].targetLang
	}

	await updateWebsiteActivity(session.user.accountId, websiteId, resolvedLangCd)

	const pageNum = parseInt(page, 10) || 1
	const limit = 50
	const validFilter = filter === 'unreviewed' ? 'unreviewed' : 'all'
	const pathId: number | 'none' | undefined =
		path === undefined ? undefined : path === 'none' ? 'none' : parseInt(path, 10) || undefined

	const [data, pathOptions] = await Promise.all([
		getSegmentsForLang(websiteId, resolvedLangCd, validFilter, pageNum, limit, pathId),
		getPathsForWebsite(websiteId),
	])

	const pathParam = pathId !== undefined ? `path=${pathId}` : ''

	return (
		<div>
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<h1 className="text-2xl font-semibold text-[var(--text-heading)]">Segments</h1>
					<span className="text-sm text-[var(--text-muted)]">({formatNumber(data.total)})</span>
				</div>
				<LanguageDropdown
					langs={langs.map((l) => ({ langCd: l.targetLang }))}
					currentLangCd={resolvedLangCd}
					publicCode={publicCode}
					basePath="segments"
				/>
			</div>

			<div className="mb-6 flex flex-wrap items-center gap-4">
				<Toggle
					options={[
						{ value: 'all', label: 'All' },
						{ value: 'unreviewed', label: 'Unreviewed' },
					]}
					value={validFilter}
					baseUrl={`/account/${publicCode}/segments${pathParam ? `?${pathParam}` : ''}`}
					paramName="filter"
				/>
				<PathSelect
					paths={pathOptions}
					selectedPathId={pathId ?? null}
					baseUrl={`/account/${publicCode}/segments?filter=${validFilter}`}
				/>
			</div>

			{data.total === 0 && validFilter === 'unreviewed' && (
				<div className="mb-6 rounded-lg bg-[var(--card-bg)] border border-[var(--success)] p-4 text-[var(--success)]">
					All translations have been reviewed. Switch to &quot;All&quot; to see all translations.
				</div>
			)}

			<SegmentTable segments={data.items} targetLang={resolvedLangCd} websiteId={websiteId} />

			<div className="mt-6">
				<Pagination currentPage={data.page} totalPages={data.totalPages} baseUrl={`/account/${publicCode}/segments?filter=${validFilter}${pathParam ? `&${pathParam}` : ''}`} />
			</div>
		</div>
	)
}

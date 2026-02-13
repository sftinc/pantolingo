import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
	canAccessWebsiteByPublicCode,
	getLangsForWebsite,
	getLastLang,
	isValidLangForWebsite,
	getPathsForLang,
	updateWebsiteActivity,
} from '@pantolingo/db'
import { PathTable } from '@/components/account/PathTable'
import { LanguageDropdown } from '@/components/account/LanguageDropdown'
import { Toggle } from '@/components/ui/Toggle'
import { Pagination } from '@/components/ui/Pagination'
import { formatNumber } from '@/lib/utils'

export const dynamic = 'force-dynamic'

interface PathsPageProps {
	params: Promise<{ publicCode: string }>
	searchParams: Promise<{ lang?: string; filter?: string; page?: string }>
}

export default async function PathsPage({ params, searchParams }: PathsPageProps) {
	const session = await auth()
	if (!session) redirect('/login')

	const { publicCode } = await params
	const { lang, filter = 'all', page = '1' } = await searchParams

	const access = await canAccessWebsiteByPublicCode(session.user.accountId, publicCode)
	if (!access) redirect('/account')
	const websiteId = access.websiteId

	const langs = await getLangsForWebsite(websiteId)

	if (langs.length === 0) {
		return (
			<div>
				<h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">Paths</h1>
				<div className="text-center py-12 bg-white dark:bg-neutral-900 rounded-lg">
					<p className="text-gray-600 dark:text-gray-400 mb-2">No paths yet</p>
					<p className="text-sm text-gray-600 dark:text-gray-400">
						<a href={`/account/${publicCode}/languages`} className="text-blue-600 dark:text-blue-500 hover:underline">Add a language</a> to start translating your website.
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

	const data = await getPathsForLang(websiteId, resolvedLangCd, validFilter, pageNum, limit)

	return (
		<div>
			<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Paths</h1>
					<span className="text-sm text-gray-600 dark:text-gray-400">({formatNumber(data.total)})</span>
				</div>
				<LanguageDropdown
					langs={langs.map((l) => ({ langCd: l.targetLang }))}
					currentLangCd={resolvedLangCd}
					publicCode={publicCode}
					basePath="paths"
				/>
			</div>

			<div className="mb-6 flex flex-wrap items-center gap-4">
				<Toggle
					options={[
						{ value: 'all', label: 'All' },
						{ value: 'unreviewed', label: 'Unreviewed' },
					]}
					value={validFilter}
					baseUrl={`/account/${publicCode}/paths`}
					paramName="filter"
				/>
			</div>

			{data.total === 0 && validFilter === 'unreviewed' && (
				<div className="mb-6 rounded-lg bg-white dark:bg-neutral-900 border border-green-600 dark:border-green-500 p-4 text-green-600 dark:text-green-500">
					All translations have been reviewed. Switch to &quot;All&quot; to see all translations.
				</div>
			)}

			<PathTable paths={data.items} targetLang={resolvedLangCd} websiteId={websiteId} />

			<div className="mt-6">
				<Pagination currentPage={data.page} totalPages={data.totalPages} baseUrl={`/account/${publicCode}/paths?filter=${validFilter}`} />
			</div>
		</div>
	)
}

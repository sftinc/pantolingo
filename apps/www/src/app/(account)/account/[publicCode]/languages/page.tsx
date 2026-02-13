import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canAccessWebsiteByPublicCode, getLangsForWebsite, updateWebsiteActivity } from '@pantolingo/db'
import { LangTable } from '@/components/account/LangTable'
import { Toggle } from '@/components/ui/Toggle'

export const dynamic = 'force-dynamic'

interface LanguagesPageProps {
	params: Promise<{ publicCode: string }>
	searchParams: Promise<{ filter?: string }>
}

export default async function LanguagesPage({ params, searchParams }: LanguagesPageProps) {
	const session = await auth()
	if (!session) redirect('/login')

	const { publicCode } = await params
	const { filter = 'all' } = await searchParams
	const validFilter = filter === 'unreviewed' ? 'unreviewed' : 'all'

	const access = await canAccessWebsiteByPublicCode(session.user.accountId, publicCode)
	if (!access) redirect('/account')
	const websiteId = access.websiteId

	await updateWebsiteActivity(session.user.accountId, websiteId)

	const langs = await getLangsForWebsite(websiteId)

	// Filter to only unreviewed if requested
	const filteredLangs =
		validFilter === 'unreviewed'
			? langs.filter((l) => l.unreviewedSegmentCount + l.unreviewedPathCount > 0)
			: langs

	return (
		<div>
			<div className="mb-6">
				<h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Languages</h1>
			</div>

			{langs.length > 0 && (
				<div className="mb-6 flex flex-wrap items-center gap-4">
					<Toggle
						options={[
							{ value: 'all', label: 'All' },
							{ value: 'unreviewed', label: 'Unreviewed' },
						]}
						value={validFilter}
						baseUrl={`/account/${publicCode}/languages`}
						paramName="filter"
					/>
				</div>
			)}

			<LangTable langs={filteredLangs} publicCode={publicCode} filter={validFilter} />
		</div>
	)
}

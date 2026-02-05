import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { canAccessWebsiteByPublicCode, getWebsiteByPublicCode, getLangsForWebsite } from '@pantolingo/db'
import { getFlag } from '@pantolingo/lang'
import { BreadcrumbNav } from '@/components/account/BreadcrumbNav'
import { LangTable } from '@/components/account/LangTable'

export const dynamic = 'force-dynamic'

interface WebsiteDetailPageProps {
	params: Promise<{ publicCode: string }>
}

export default async function WebsiteDetailPage({ params }: WebsiteDetailPageProps) {
	const session = await auth()

	if (!session) {
		redirect('/login')
	}

	const { publicCode } = await params

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

	if (!website) {
		redirect('/account')
	}

	const langs = await getLangsForWebsite(websiteId)

	return (
		<div>
			<BreadcrumbNav
				breadcrumbs={[
					{ label: 'Account', href: '/account' },
					{ label: `${website.hostname} ${getFlag(website.sourceLang)}` },
				]}
			/>

			<h2 className="mb-4 text-2xl font-semibold text-[var(--text-heading)]">Languages</h2>

			<LangTable langs={langs} publicCode={publicCode} />
		</div>
	)
}

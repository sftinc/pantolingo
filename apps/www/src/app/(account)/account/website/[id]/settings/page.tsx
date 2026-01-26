import { notFound, redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { canAccessWebsite, getWebsiteById } from '@pantolingo/db'
import { BreadcrumbNav } from '@/components/account/BreadcrumbNav'
import { WebsiteSettingsForm } from '@/components/account/WebsiteSettingsForm'

export const dynamic = 'force-dynamic'

interface SettingsPageProps {
	params: Promise<{ id: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
	const session = await auth()

	if (!session) {
		redirect('/login')
	}

	const { id } = await params
	const websiteId = parseInt(id, 10)

	if (isNaN(websiteId)) {
		notFound()
	}

	if (!(await canAccessWebsite(session.user.accountId, websiteId))) {
		notFound()
	}

	const website = await getWebsiteById(websiteId)

	if (!website) {
		notFound()
	}

	return (
		<div>
			<BreadcrumbNav
				breadcrumbs={[
					{ label: 'Account', href: '/account' },
					{ label: website.hostname, href: `/account/website/${websiteId}` },
					{ label: 'Settings' },
				]}
			/>

			<h2 className="mb-6 text-2xl font-semibold text-[var(--text-heading)]">Settings</h2>

			<WebsiteSettingsForm
				websiteId={websiteId}
				initialSkipWords={website.skipWords}
				initialSkipPath={website.skipPath}
				initialTranslatePath={website.translatePath}
			/>
		</div>
	)
}

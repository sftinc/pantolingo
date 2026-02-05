import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { canAccessWebsiteByPublicCode, getWebsiteByPublicCode } from '@pantolingo/db'
import { BreadcrumbNav } from '@/components/account/BreadcrumbNav'
import { WebsiteSettingsForm } from '@/components/account/WebsiteSettingsForm'

export const dynamic = 'force-dynamic'

interface SettingsPageProps {
	params: Promise<{ publicCode: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
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

	return (
		<div>
			<BreadcrumbNav
				breadcrumbs={[
					{ label: 'Account', href: '/account' },
					{ label: website.hostname, href: `/account/website/${website.publicCode}` },
					{ label: 'Settings' },
				]}
			/>

			<h2 className="mb-6 text-2xl font-semibold text-[var(--text-heading)]">Settings</h2>

			<WebsiteSettingsForm
				websiteId={websiteId}
				initialSkipWords={website.skipWords}
				initialSkipPath={website.skipPath}
				initialSkipSelectors={website.skipSelectors}
				initialTranslatePath={website.translatePath}
			/>
		</div>
	)
}

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canAccessWebsiteByPublicCode, getWebsiteByPublicCode } from '@pantolingo/db'
import { WebsiteSettingsForm } from '@/components/account/WebsiteSettingsForm'

export const dynamic = 'force-dynamic'

interface SettingsPageProps {
	params: Promise<{ publicCode: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
	const session = await auth()
	if (!session) redirect('/login')

	const { publicCode } = await params

	const access = await canAccessWebsiteByPublicCode(session.user.accountId, publicCode)
	if (!access) redirect('/account')

	const website = await getWebsiteByPublicCode(publicCode)
	if (!website) redirect('/account')

	return (
		<div>
			<h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">Settings</h1>

			<WebsiteSettingsForm
				websiteId={access.websiteId}
				initialName={website.name}
				hostname={website.hostname}
				sourceLang={website.sourceLang}
				initialSkipWords={website.skipWords}
				initialSkipPath={website.skipPath}
				initialSkipSelectors={website.skipSelectors}
				initialTranslatePath={website.translatePath}
			/>
		</div>
	)
}

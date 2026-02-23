import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canAccessWebsiteByPublicCode, getWebsiteByPublicCode, getLanguagesWithDnsStatus } from '@pantolingo/db'
import { SettingsPage } from '@/components/account/SettingsPage'

export const dynamic = 'force-dynamic'

interface SettingsPageProps {
	params: Promise<{ publicCode: string }>
}

export default async function Settings({ params }: SettingsPageProps) {
	const session = await auth()
	if (!session) redirect('/login')

	const { publicCode } = await params

	const access = await canAccessWebsiteByPublicCode(session.user.accountId, publicCode)
	if (!access) redirect('/account')

	const [website, languages] = await Promise.all([
		getWebsiteByPublicCode(publicCode),
		getLanguagesWithDnsStatus(access.websiteId),
	])
	if (!website) redirect('/account')

	return (
		<div>
			<h1 className="mb-6 text-2xl font-semibold text-[var(--text-heading)]">Settings</h1>

			<SettingsPage
				websiteId={access.websiteId}
				website={{
					name: website.name,
					hostname: website.hostname,
					sourceLang: website.sourceLang,
					uiColor: website.uiColor,
					skipWords: website.skipWords,
					skipPath: website.skipPath,
					skipSelectors: website.skipSelectors,
					translatePath: website.translatePath,
					cacheDisabledRemaining: website.cacheDisabledRemaining,
				}}
				languages={languages}
			/>
		</div>
	)
}

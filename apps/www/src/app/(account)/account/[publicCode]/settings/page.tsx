import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canAccessWebsiteByPublicCode, getWebsiteByPublicCode, getLanguagesWithDnsStatus } from '@pantolingo/db'
import { SettingsPage } from '@/components/account/SettingsPage'

export const dynamic = 'force-dynamic'

interface SettingsPageProps {
	params: Promise<{ publicCode: string }>
	searchParams: Promise<{ tab?: string }>
}

const VALID_TABS = ['general', 'setup', 'translation'] as const
type Tab = (typeof VALID_TABS)[number]

export default async function Settings({ params, searchParams }: SettingsPageProps) {
	const session = await auth()
	if (!session) redirect('/login')

	const [{ publicCode }, { tab }] = await Promise.all([params, searchParams])
	const initialTab: Tab = VALID_TABS.includes(tab as Tab) ? (tab as Tab) : 'general'

	const access = await canAccessWebsiteByPublicCode(session.user.accountId, publicCode)
	if (!access) redirect('/account')

	const website = await getWebsiteByPublicCode(publicCode)
	if (!website) redirect('/account')

	const languages = await getLanguagesWithDnsStatus(access.websiteId)

	return (
		<div>
			<h1 className="mb-6 text-2xl font-semibold text-[var(--text-heading)]">Settings</h1>

			<SettingsPage
				publicCode={publicCode}
				initialTab={initialTab}
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

import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canAccessWebsiteByPublicCode, getWebsiteByPublicCode, getLanguagesWithDnsStatus } from '@pantolingo/db'
import { SettingsPage } from '@/components/account/SettingsPage'

export const dynamic = 'force-dynamic'

const VALID_TABS = ['general', 'languages', 'translation'] as const
type Tab = (typeof VALID_TABS)[number]

interface SettingsPageProps {
	params: Promise<{ publicCode: string; tab?: string[] }>
}

export default async function Settings({ params }: SettingsPageProps) {
	const session = await auth()
	if (!session) redirect('/login')

	const { publicCode, tab } = await params

	// Validate tab parameter
	let initialTab: Tab = 'general'
	if (tab && tab.length > 0) {
		if (tab.length > 1 || !VALID_TABS.includes(tab[0] as Tab)) {
			redirect(`/account/${publicCode}/settings`)
		}
		initialTab = tab[0] as Tab
	}

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
				publicCode={publicCode}
				initialTab={initialTab}
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

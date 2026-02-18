import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getLanguageOptions, SUPPORTED_LANGUAGES } from '@pantolingo/lang'
import WebsiteWizard from './WebsiteWizard'

export const dynamic = 'force-dynamic'

export default async function WebsitePage() {
	const session = await auth()
	if (!session) redirect('/login')

	// Must complete profile first
	if (!session.user.firstName) redirect('/account/onboard')

	const languages = getLanguageOptions(SUPPORTED_LANGUAGES).map((l) => ({
		code: l.code,
		name: l.name,
		flag: l.flag,
	}))

	return <WebsiteWizard languages={languages} />
}

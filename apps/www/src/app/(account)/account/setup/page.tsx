import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { getMostRecentWebsite } from '@pantolingo/db'
import { getLanguageOptions, SUPPORTED_LANGUAGES } from '@pantolingo/lang'
import SetupProfileForm from './SetupProfileForm'
import SetupWebsiteForm from './SetupWebsiteForm'

export const dynamic = 'force-dynamic'

export default async function SetupPage() {
	const session = await auth()
	if (!session) redirect('/login')

	const hasName = !!session.user.name

	if (hasName) {
		// Check if they already have websites
		const publicCode = await getMostRecentWebsite(session.user.accountId)
		if (publicCode) {
			// Fully done — redirect to account
			redirect(`/account/${publicCode}/languages`)
		}

		// Step 2: add website
		const languages = getLanguageOptions(SUPPORTED_LANGUAGES).map((l) => ({
			code: l.code,
			name: l.name,
			flag: l.flag,
		}))
		return <SetupWebsiteForm languages={languages} />
	}

	// Step 1: name + password
	return <SetupProfileForm />
}

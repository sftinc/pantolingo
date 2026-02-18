import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMostRecentWebsite } from '@pantolingo/db'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
	const session = await auth()

	if (!session) {
		redirect('/login')
	}

	// Missing name — onboard first
	if (!session.user.firstName) {
		redirect('/account/onboard')
	}

	// Has websites — go to last website
	const publicCode = await getMostRecentWebsite(session.user.accountId)
	if (publicCode) {
		redirect(`/account/${publicCode}/languages`)
	}

	// No websites — start the website wizard
	redirect('/account/website')
}

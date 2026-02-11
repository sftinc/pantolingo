import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getMostRecentWebsite } from '@pantolingo/db'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
	const session = await auth()

	if (!session) {
		redirect('/login')
	}

	const publicCode = await getMostRecentWebsite(session.user.accountId)

	if (publicCode) {
		redirect(`/account/${publicCode}/languages`)
	}

	// No websites — send to setup to add first website
	redirect('/account/setup')
}

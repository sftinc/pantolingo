import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

/**
 * Legacy setup page — redirects to new onboarding routes.
 * Kept for backwards compatibility with bookmarks and links.
 */
export default async function SetupPage() {
	const session = await auth()
	if (!session) redirect('/login')

	if (!session.user.firstName) {
		redirect('/account/onboard')
	}

	redirect('/account/website')
}

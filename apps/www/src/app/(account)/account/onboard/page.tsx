import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import OnboardProfileForm from './OnboardProfileForm'

export const dynamic = 'force-dynamic'

export default async function OnboardPage() {
	const session = await auth()
	if (!session) redirect('/login')

	// Already has name — skip to account router
	if (session.user.firstName) redirect('/account')

	return <OnboardProfileForm />
}

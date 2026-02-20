import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProfileMenu } from '@/components/account/ProfileMenu'
import { SimpleHeader } from '@/components/account/SimpleHeader'

export default async function WebsiteLayout({ children }: { children: React.ReactNode }) {
	const session = await auth()
	if (!session) redirect('/login')

	async function handleSignOut() {
		'use server'
		await signOut({ redirectTo: '/login?msg=logout' })
	}

	const firstName = session.user.firstName ?? ''
	const lastName = session.user.lastName ?? ''
	const userName = firstName && lastName
		? `${firstName[0]}. ${lastName}`
		: firstName || lastName || session.user.email

	return (
		<>
			<SimpleHeader>
				<ProfileMenu
					userName={userName}
					userProfile={{ firstName, lastName, email: session.user.email }}
					signOutAction={handleSignOut}
				/>
			</SimpleHeader>
			{children}
		</>
	)
}

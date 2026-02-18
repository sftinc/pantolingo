import Link from 'next/link'
import { auth, signOut } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { ProfileMenu } from '@/components/account/ProfileMenu'

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
			<header className="border-b border-[var(--border)] bg-[var(--card-bg)]">
				<div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8 flex items-center justify-between">
					<Link href="/" className="text-xl font-semibold text-[var(--text-heading)]">
						Pantolingo
					</Link>
					<ProfileMenu
						userName={userName}
						userProfile={{ firstName, lastName, email: session.user.email }}
						signOutAction={handleSignOut}
					/>
				</div>
			</header>
			{children}
		</>
	)
}

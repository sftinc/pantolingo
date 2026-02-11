import { redirect } from 'next/navigation'
import { auth, signOut } from '@/lib/auth'
import { canAccessWebsiteByPublicCode, getWebsiteByPublicCode, getWebsitesWithStats } from '@pantolingo/db'
import { SidebarLayout } from '@/components/account/SidebarLayout'

interface WebsiteLayoutProps {
	params: Promise<{ publicCode: string }>
	children: React.ReactNode
}

export default async function WebsiteLayout({ params, children }: WebsiteLayoutProps) {
	const session = await auth()

	if (!session) {
		redirect('/login')
	}

	const { publicCode } = await params

	// Validate publicCode format (16-char hex)
	if (!/^[0-9a-f]{16}$/i.test(publicCode)) {
		redirect('/account')
	}

	// Check authorization
	const access = await canAccessWebsiteByPublicCode(session.user.accountId, publicCode)
	if (!access) {
		redirect('/account')
	}
	const { role } = access

	const website = await getWebsiteByPublicCode(publicCode)
	if (!website) {
		redirect('/account')
	}

	// Load websites for switcher
	const allWebsites = await getWebsitesWithStats(session.user.accountId)

	async function handleSignOut() {
		'use server'
		await signOut({ redirectTo: '/login?msg=logout' })
	}

	const userName = (() => {
		const parts = session.user.name!.trim().split(/\s+/)
		if (parts.length === 1) return parts[0]
		return `${parts[0][0]}. ${parts[parts.length - 1]}`
	})()

	return (
		<SidebarLayout
			currentWebsite={{ publicCode: website.publicCode, hostname: website.hostname, name: website.name, sourceLang: website.sourceLang, role }}
			websites={allWebsites.map((w) => ({ publicCode: w.publicCode, hostname: w.hostname, name: w.name }))}
			userName={userName}
			signOutAction={handleSignOut}
		>
			{children}
		</SidebarLayout>
	)
}

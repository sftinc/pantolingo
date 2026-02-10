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

	// No websites — show add-website placeholder
	return (
		<div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
			<div className="text-center max-w-md">
				<div className="mb-6 text-4xl font-bold text-[var(--text-heading)]">Pantolingo</div>
				<p className="mb-2 text-sm text-[var(--text-muted)]">
					Welcome, {session.user.name}
				</p>
				<div className="mt-8 rounded-lg border-2 border-dashed border-[var(--border)] p-8 bg-[var(--card-bg)]">
					<p className="text-lg font-medium text-[var(--text-heading)] mb-2">Add your first website</p>
					<p className="text-sm text-[var(--text-muted)]">
						Get started by adding a website to translate. The add-website flow is coming soon.
					</p>
				</div>
			</div>
		</div>
	)
}

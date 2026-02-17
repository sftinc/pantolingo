import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function BillingPage() {
	const session = await auth()
	if (!session) redirect('/login')

	return (
		<div className="flex min-h-screen items-center justify-center">
			<div className="mx-auto max-w-md text-center">
				<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--nav-hover-bg)]">
					<svg className="h-8 w-8 text-[var(--text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.5" />
						<path strokeLinecap="round" strokeWidth="1.5" d="M2 10h20" />
					</svg>
				</div>
				<h1 className="mb-2 text-2xl font-semibold text-[var(--text-heading)]">Billing</h1>
				<p className="text-[var(--text-muted)]">Billing and subscription management coming soon.</p>
			</div>
		</div>
	)
}

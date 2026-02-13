import { auth } from '@/lib/auth'
import { Nav } from '@/components/marketing/Nav'
import { Footer } from '@/components/marketing/Footer'

export default async function MarketingLayout({ children }: { children: React.ReactNode }) {
	const session = await auth()

	return (
		<div className="min-h-screen flex flex-col bg-neutral-50 dark:bg-neutral-950">
			<Nav isAuthenticated={!!session} />
			<main className="flex-1">{children}</main>
			<Footer />
		</div>
	)
}

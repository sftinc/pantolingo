import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
	const session = await auth()

	if (!session) {
		redirect('/login')
	}

	return <div className="min-h-screen bg-[var(--page-bg)]">{children}</div>
}

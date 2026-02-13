import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
	const session = await auth()

	if (!session) {
		redirect('/login')
	}

	return <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">{children}</div>
}

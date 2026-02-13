import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { getAuthCookieData } from '@/lib/auth-cookie'
import { EnterCodeForm } from './EnterCodeForm'

// Force dynamic rendering to ensure fresh cookie reads
export const dynamic = 'force-dynamic'

export default async function AuthEnterCodePage() {
	// Read auth cookie and verify
	const authData = await getAuthCookieData()
	if (!authData) {
		redirect('/login?msg=sessionexpired')
	}

	return (
		<main className="flex min-h-screen flex-col">
			<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-end">
				<ThemeToggle />
			</div>
			<div className="flex flex-1 flex-col items-center justify-center p-6">
				<div className="text-center max-w-md bg-white dark:bg-neutral-900 p-10 rounded-lg shadow-md shadow-black/10 dark:shadow-black/30">
					<h1 className="text-2xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
						Enter your code
					</h1>
					<p className="text-base text-gray-600 dark:text-gray-400 mb-6">
						Enter the 8-character code from your email
					</p>

					<EnterCodeForm />
				</div>
			</div>
		</main>
	)
}

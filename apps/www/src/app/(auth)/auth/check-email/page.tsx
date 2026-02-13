import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { getAuthCookieData } from '@/lib/auth-cookie'

// Force dynamic rendering to ensure fresh cookie reads
export const dynamic = 'force-dynamic'

export default async function AuthCheckEmailPage() {
	// Read auth cookie and verify
	const authData = await getAuthCookieData()
	if (!authData) {
		redirect('/login?msg=sessionexpired')
	}

	// Derive back link from flow
	const backHref = authData.flow === 'signup' ? '/signup' : '/login'
	const backText = authData.flow === 'signup' ? 'Back to Sign up' : 'Back to Login'

	return (
		<main className="flex min-h-screen flex-col">
			<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-end">
				<ThemeToggle />
			</div>
			<div className="flex flex-1 flex-col items-center justify-center p-6">
				<div className="text-center max-w-md bg-white dark:bg-neutral-900 p-10 rounded-lg shadow-md shadow-black/10 dark:shadow-black/30">
					<div className="mb-4 text-5xl">📧</div>
					<h1 className="text-2xl font-semibold mb-4 text-gray-900 dark:text-gray-100">
						Check your email
					</h1>
					<p className="text-base leading-relaxed text-gray-600 dark:text-gray-400">
						A sign-in link has been sent to{' '}
						<strong className="text-gray-800 dark:text-gray-200">{authData.email}</strong>
					</p>
					<p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
						Click the link in the email to sign in, or enter the code manually. The link and
						code expire in 10 minutes.
					</p>

					<div className="mt-6 space-y-3">
						<Link
							href="/auth/enter-code"
							prefetch={false}
							className="block w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-md font-medium hover:opacity-90 transition text-center"
						>
							Enter code manually
						</Link>

						<Link
							href={backHref}
							className="block w-full py-3 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:text-gray-200 transition text-center text-sm"
						>
							{backText}
						</Link>
					</div>
				</div>
			</div>
		</main>
	)
}

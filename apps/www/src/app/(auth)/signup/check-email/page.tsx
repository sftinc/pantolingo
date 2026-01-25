import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { getEmailJwtFromCookie, verifyEmailJwt } from '@/lib/auth-jwt'

// Force dynamic rendering to ensure fresh cookie reads
export const dynamic = 'force-dynamic'

export default async function SignupCheckEmailPage() {
	// Read JWT from HTTP-only cookie and verify
	const emailJwt = await getEmailJwtFromCookie()
	if (!emailJwt) {
		redirect('/signup')
	}

	const email = await verifyEmailJwt(emailJwt)
	if (!email) {
		redirect('/signup')
	}

	return (
		<main className="flex min-h-screen flex-col">
			<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-end">
				<ThemeToggle />
			</div>
			<div className="flex flex-1 flex-col items-center justify-center p-6">
				<div className="text-center max-w-md bg-[var(--card-bg)] p-10 rounded-lg shadow-[0_2px_8px_var(--shadow-color)]">
					<div className="mb-4 text-5xl">📧</div>
					<h1 className="text-2xl font-semibold mb-4 text-[var(--text-heading)]">
						Check your email
					</h1>
					<p className="text-base leading-relaxed text-[var(--text-muted)]">
						A sign-in link has been sent to{' '}
						<strong className="text-[var(--text-body)]">{email}</strong>
					</p>
					<p className="mt-2 text-sm text-[var(--text-muted)]">
						Click the link in the email to sign in, or enter the code manually. The link and
						code expire in 10 minutes.
					</p>

					<div className="mt-6 space-y-3">
						<Link
							href="/login/enter-code"
							prefetch={false}
							className="block w-full py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition text-center"
						>
							Enter code manually
						</Link>

						<Link
							href="/signup"
							className="block w-full py-3 text-[var(--text-muted)] hover:text-[var(--text-body)] transition text-center text-sm"
						>
							Back to Sign up
						</Link>
					</div>
				</div>
			</div>
		</main>
	)
}

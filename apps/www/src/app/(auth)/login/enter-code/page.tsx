import { redirect } from 'next/navigation'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { getEmailJwtFromCookie, verifyEmailJwt } from '@/lib/auth-jwt'
import { EnterCodeForm } from './EnterCodeForm'

export default async function EnterCodePage() {
	// Read JWT from HTTP-only cookie and verify
	const emailJwt = await getEmailJwtFromCookie()
	if (!emailJwt) {
		redirect('/login?msg=sessionexpired')
	}

	const email = await verifyEmailJwt(emailJwt)
	if (!email) {
		redirect('/login?msg=sessionexpired')
	}

	return (
		<main className="flex min-h-screen flex-col">
			<div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex justify-end">
				<ThemeToggle />
			</div>
			<div className="flex flex-1 flex-col items-center justify-center p-6">
				<div className="text-center max-w-md bg-[var(--card-bg)] p-10 rounded-lg shadow-[0_2px_8px_var(--shadow-color)]">
					<h1 className="text-2xl font-semibold mb-2 text-[var(--text-heading)]">
						Enter your code
					</h1>
					<p className="text-base text-[var(--text-muted)] mb-6">
						Enter the 8-character code from your email
					</p>

					<EnterCodeForm />
				</div>
			</div>
		</main>
	)
}

import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { signOutToLogin } from '@/actions/account'

export default function SetupLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<header className="border-b border-[var(--border)] bg-[var(--card-bg)]">
				<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
					<Link href="/" className="text-xl font-semibold text-[var(--text-heading)]">
						Pantolingo
					</Link>
					<div className="flex items-center gap-4">
						<ThemeToggle />
						<form action={signOutToLogin}>
							<button
								type="submit"
								className="text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
							>
								Sign out
							</button>
						</form>
					</div>
				</div>
			</header>
			{children}
		</>
	)
}

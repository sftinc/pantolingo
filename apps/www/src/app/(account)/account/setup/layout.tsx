import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { signOutToLogin } from '@/actions/account'

export default function SetupLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<header className="border-b border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900">
				<div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 flex items-center justify-between">
					<Link href="/" className="text-xl font-semibold text-gray-900 dark:text-gray-100">
						Pantolingo
					</Link>
					<div className="flex items-center gap-4">
						<ThemeToggle />
						<form action={signOutToLogin}>
							<button
								type="submit"
								className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors cursor-pointer"
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

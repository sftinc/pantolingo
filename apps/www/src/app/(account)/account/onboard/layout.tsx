import { ThemeToggle } from '@/components/ui/ThemeToggle'
import { SimpleHeader } from '@/components/account/SimpleHeader'
import { signOutToLogin } from '@/actions/account'

export default function OnboardLayout({ children }: { children: React.ReactNode }) {
	return (
		<>
			<SimpleHeader>
				<div className="flex items-center gap-4">
					<ThemeToggle />
					<form action={signOutToLogin}>
						<button
							type="submit"
							tabIndex={0}
							className="text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors cursor-pointer"
						>
							Sign out
						</button>
					</form>
				</div>
			</SimpleHeader>
			{children}
		</>
	)
}

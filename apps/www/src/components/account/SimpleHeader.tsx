import Link from 'next/link'

export function SimpleHeader({ children }: { children: React.ReactNode }) {
	return (
		<header className="border-b border-[var(--border)] bg-[var(--card-bg)]">
			<div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
				<Link href="/" className="text-xl font-semibold text-[var(--text-heading)]">
					Pantolingo
				</Link>
				{children}
			</div>
		</header>
	)
}

import Link from 'next/link'

const navLinks = [
	{ href: '/', label: 'Home' },
	{ href: '/features', label: 'Features' },
	{ href: '/pricing', label: 'Pricing' },
]

const legalLinks = [
	{ href: '/privacy', label: 'Privacy' },
	{ href: '/terms', label: 'Terms' },
	{ href: '/contact', label: 'Contact' },
]

export function Footer() {
	return (
		<footer className="border-t border-[var(--border)] bg-[var(--card-bg)]">
			<div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
					{/* Logo and copyright */}
					<div className="flex flex-col gap-2">
						<Link href="/" className="text-xl font-semibold text-[var(--text-heading)]">
							Pantolingo
						</Link>
						<p className="text-sm text-[var(--text-subtle)]">
							© {new Date().getFullYear()} Pantolingo. All rights reserved.
						</p>
					</div>

					{/* Nav links */}
					<div className="flex flex-col gap-2">
						<h3 className="text-sm font-medium text-[var(--text-heading)]">Navigation</h3>
						<div className="flex flex-col gap-2">
							{navLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className="text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
								>
									{link.label}
								</Link>
							))}
						</div>
					</div>

					{/* Legal links */}
					<div className="flex flex-col gap-2">
						<h3 className="text-sm font-medium text-[var(--text-heading)]">Legal</h3>
						<div className="flex flex-col gap-2">
							{legalLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									className="text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
								>
									{link.label}
								</Link>
							))}
						</div>
					</div>
				</div>
			</div>
		</footer>
	)
}

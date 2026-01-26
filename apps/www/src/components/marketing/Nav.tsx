'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

interface NavProps {
	isAuthenticated: boolean
}

const navLinks = [
	{ href: '/', label: 'Home' },
	{ href: '/features', label: 'Features' },
	{ href: '/pricing', label: 'Pricing' },
]

export function Nav({ isAuthenticated }: NavProps) {
	const [menuOpen, setMenuOpen] = useState(false)

	return (
		<header className="border-b border-[var(--border)] bg-[var(--card-bg)]">
			<nav
				aria-label="Main navigation"
				className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8"
			>
				{/* Desktop navigation */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-8">
						<Link href="/" className="text-xl font-semibold text-[var(--text-heading)]">
							Pantolingo
						</Link>
						<div className="hidden md:flex items-center gap-6">
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

					<div className="hidden md:flex items-center gap-4">
						<ThemeToggle />
						{isAuthenticated ? (
							<Link
								href="/account"
								className="text-sm px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-heading)] hover:bg-[var(--border)] transition"
							>
								Account
							</Link>
						) : (
							<>
								<Link
									href="/login"
									className="text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
								>
									Login
								</Link>
								<Link
									href="/signup"
									className="text-sm px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-heading)] hover:bg-[var(--border)] transition"
								>
									Sign up
								</Link>
							</>
						)}
					</div>

					{/* Mobile: Theme toggle + hamburger */}
					<div className="flex md:hidden items-center gap-2">
						<ThemeToggle />
						<button
							onClick={() => setMenuOpen(!menuOpen)}
							aria-expanded={menuOpen}
							aria-label="Toggle menu"
							className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--border)] transition-colors"
						>
							{menuOpen ? <CloseIcon /> : <MenuIcon />}
						</button>
					</div>
				</div>

				{/* Mobile menu */}
				{menuOpen && (
					<div className="md:hidden mt-4 pt-4 border-t border-[var(--border)]">
						<div className="flex flex-col gap-4">
							{navLinks.map((link) => (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setMenuOpen(false)}
									className="text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
								>
									{link.label}
								</Link>
							))}
							<div className="pt-4 border-t border-[var(--border)] flex flex-col gap-4">
								{isAuthenticated ? (
									<Link
										href="/account"
										onClick={() => setMenuOpen(false)}
										className="text-sm px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-heading)] hover:bg-[var(--border)] transition text-center"
									>
										Account
									</Link>
								) : (
									<>
										<Link
											href="/login"
											onClick={() => setMenuOpen(false)}
											className="text-sm text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors"
										>
											Login
										</Link>
										<Link
											href="/signup"
											onClick={() => setMenuOpen(false)}
											className="text-sm px-3 py-1.5 rounded-md border border-[var(--border)] text-[var(--text-heading)] hover:bg-[var(--border)] transition text-center"
										>
											Sign up
										</Link>
									</>
								)}
							</div>
						</div>
					</div>
				)}
			</nav>
		</header>
	)
}

function MenuIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<line x1="4" x2="20" y1="12" y2="12" />
			<line x1="4" x2="20" y1="6" y2="6" />
			<line x1="4" x2="20" y1="18" y2="18" />
		</svg>
	)
}

function CloseIcon() {
	return (
		<svg
			xmlns="http://www.w3.org/2000/svg"
			width="20"
			height="20"
			viewBox="0 0 24 24"
			fill="none"
			stroke="currentColor"
			strokeWidth="2"
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			<path d="M18 6 6 18" />
			<path d="m6 6 12 12" />
		</svg>
	)
}

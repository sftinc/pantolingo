'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

interface SidebarLayoutProps {
	currentWebsite: { publicCode: string; hostname: string; name: string; sourceLang: string }
	websites: { publicCode: string; hostname: string; name: string }[]
	userName: string
	signOutAction: () => Promise<void>
	children: React.ReactNode
}

const NAV_ITEMS = [
	{ label: 'Languages', path: 'languages', icon: LanguagesIcon },
	{ label: 'Segments', path: 'segments', icon: SegmentsIcon },
	{ label: 'Paths', path: 'paths', icon: PathsIcon },
	{ label: 'Stats', path: 'stats', icon: StatsIcon },
]

export function SidebarLayout({ currentWebsite, websites, userName, signOutAction, children }: SidebarLayoutProps) {
	const pathname = usePathname()
	const router = useRouter()
	const [mobileOpen, setMobileOpen] = useState(false)
	const [switcherDropdownOpen, setSwitcherDropdownOpen] = useState(false)
	const [switcherPanelOpen, setSwitcherPanelOpen] = useState(false)
	const switcherRef = useRef<HTMLDivElement>(null)
	const [theme, setTheme] = useState<'light' | 'dark'>('light')
	const [mounted, setMounted] = useState(false)

	// Theme initialization
	useEffect(() => {
		const stored = localStorage.getItem('theme')
		if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
			setTheme('dark')
		}
		setMounted(true)
	}, [])

	function toggleTheme() {
		const next = theme === 'light' ? 'dark' : 'light'
		setTheme(next)
		localStorage.setItem('theme', next)
		const root = document.documentElement
		root.classList.remove('light', 'dark')
		root.classList.add(next)
	}

	// Close mobile sidebar on navigation
	useEffect(() => {
		setMobileOpen(false)
		setSwitcherPanelOpen(false)
	}, [pathname])

	// Close desktop switcher on click outside
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
				setSwitcherDropdownOpen(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	const basePath = `/account/${currentWebsite.publicCode}`
	const otherWebsites = websites.filter((w) => w.publicCode !== currentWebsite.publicCode)
	const letterAvatar = currentWebsite.name[0].toUpperCase()

	function isActive(navPath: string) {
		return pathname.startsWith(`${basePath}/${navPath}`)
	}

	// Switcher button click: mobile opens panel, desktop toggles dropdown
	function handleSwitcherClick() {
		if (window.innerWidth < 768) {
			setSwitcherPanelOpen(true)
		} else {
			setSwitcherDropdownOpen(!switcherDropdownOpen)
		}
	}

	function closeMobile() {
		setMobileOpen(false)
		setSwitcherPanelOpen(false)
	}

	// Shared nav items renderer
	function renderNavItems(onItemClick?: () => void) {
		return NAV_ITEMS.map((item) => {
			const active = isActive(item.path)
			return (
				<Link
					key={item.path}
					href={`${basePath}/${item.path}`}
					onClick={onItemClick}
					className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
						active
							? 'bg-[var(--nav-active-bg)] text-[var(--text-heading)]'
							: 'text-[var(--text-muted)] hover:bg-[var(--nav-active-bg)] hover:text-[var(--text-heading)]'
					}`}
				>
					<item.icon className="w-5 h-5 shrink-0" />
					<span>{item.label}</span>
				</Link>
			)
		})
	}

	// Shared switcher items (used in both desktop dropdown and mobile switcher panel)
	function renderSwitcherItems(onNavigate: () => void) {
		return (
			<>
				{/* Settings */}
				<Link
					href={`${basePath}/settings`}
					onClick={onNavigate}
					className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-active-bg)] transition-colors"
				>
					<SettingsIcon className="w-5 h-5 text-[var(--text-subtle)]" />
					Settings
				</Link>

				{/* Divider + other websites */}
				<div className="border-t border-[var(--border)] my-1" />
				{otherWebsites.map((site) => (
					<button
						key={site.publicCode}
						onClick={() => {
							onNavigate()
							router.push(`/account/${site.publicCode}/languages`)
						}}
						className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-active-bg)] transition-colors cursor-pointer"
					>
						<span className="w-6 h-6 rounded bg-[var(--border)] text-[var(--text-muted)] flex items-center justify-center text-xs font-semibold">
							{site.name[0].toUpperCase()}
						</span>
						{site.name}
					</button>
				))}

				{/* Add website */}
				<button
					disabled
					className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] opacity-50 cursor-not-allowed"
				>
					<PlusIcon className="w-5 h-5 text-[var(--text-subtle)]" />
					Add website
				</button>

				{/* Divider + user section */}
				<div className="border-t border-[var(--border)] my-1" />

				{/* User */}
				<div className="flex items-center justify-between px-4 py-2.5 text-sm text-[var(--text-muted)]">
					<div className="flex items-center gap-3">
						<UserIcon className="w-5 h-5 text-[var(--text-subtle)]" />
						{userName}
					</div>
				</div>

				{/* Theme toggle */}
				<button
					onClick={toggleTheme}
					className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-active-bg)] transition-colors cursor-pointer"
				>
					{mounted && theme === 'dark' ? (
						<MoonIcon className="w-5 h-5 text-[var(--text-subtle)]" />
					) : (
						<SunIcon className="w-5 h-5 text-[var(--text-subtle)]" />
					)}
					{mounted && theme === 'dark' ? 'Light mode' : 'Dark mode'}
				</button>

				{/* Sign out */}
				<form action={signOutAction}>
					<button
						type="submit"
						className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-active-bg)] transition-colors cursor-pointer"
					>
						<SignOutIcon className="w-5 h-5 text-[var(--text-subtle)]" />
						Sign out
					</button>
				</form>
			</>
		)
	}

	return (
		<div className="min-h-screen bg-[var(--content-bg)]">
			{/* Mobile top bar */}
			<div className="md:hidden sticky top-0 z-30 flex items-center gap-3 bg-[var(--sidebar-bg)] border-b border-[var(--sidebar-border)] px-4 h-14">
				<button
					onClick={() => setMobileOpen(true)}
					className="p-1 text-[var(--text-muted)] cursor-pointer"
					aria-label="Open menu"
				>
					<HamburgerIcon className="w-6 h-6" />
				</button>
				<span className="text-sm font-semibold text-[var(--text-heading)]">{currentWebsite.name}</span>
			</div>

			{/* Mobile overlay */}
			{mobileOpen && (
				<div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={closeMobile} />
			)}

			{/* ONE sidebar — always in DOM, toggled via translate on mobile */}
			<aside
				className={`fixed top-0 left-0 z-50 h-full w-60 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col overflow-hidden md:overflow-visible transition-transform duration-200 ${
					mobileOpen ? 'translate-x-0' : '-translate-x-full'
				} md:translate-x-0`}
			>
				{/* Panel 1: Main nav (slides left when switcher panel opens on mobile) */}
				<div className={`h-full flex flex-col transition-transform duration-200 ${switcherPanelOpen ? '-translate-x-full' : 'translate-x-0'}`}>
					{/* Close button (mobile only) */}
					<button
						onClick={closeMobile}
						aria-label="Close menu"
						className="md:hidden absolute top-2 left-2 p-1 text-[var(--text-subtle)] cursor-pointer z-10"
					>
						<CloseIcon className="w-5 h-5" />
					</button>

					{/* Website switcher button */}
					<div className="px-3 pt-14 md:pt-6 pb-7">
						<div ref={switcherRef} className="relative">
							<button
								onClick={handleSwitcherClick}
								className="w-full flex items-center gap-3 px-3 py-3 min-h-[64px] rounded-md hover:bg-[var(--nav-active-bg)] transition-colors cursor-pointer"
							>
								<span className="shrink-0 w-8 h-8 rounded-md bg-[var(--border)] text-[var(--text-muted)] flex items-center justify-center text-sm font-bold">
									{letterAvatar}
								</span>
								<span className="flex-1 text-left text-sm font-semibold text-[var(--text-heading)] truncate">
									{currentWebsite.name}
								</span>
								<ChevronIcon className={`w-4 h-4 text-[var(--text-subtle)] shrink-0 transition-transform -rotate-90 md:rotate-0 ${switcherDropdownOpen ? 'md:rotate-180' : ''}`} />
							</button>

							{/* Desktop switcher dropdown */}
							{switcherDropdownOpen && (
								<div className="hidden md:block absolute left-0 top-full mt-1 w-64 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-50">
									{/* Header: name bold + hostname subtitle */}
									<div className="flex flex-col items-center py-4 my-2">
										<span className="text-sm font-semibold text-[var(--text-heading)]">{currentWebsite.name}</span>
										<span className="mt-0.5 text-xs text-[var(--text-muted)]">{currentWebsite.hostname}</span>
									</div>

									{renderSwitcherItems(() => setSwitcherDropdownOpen(false))}
								</div>
							)}
						</div>
					</div>

					{/* Navigation */}
					<nav className="px-2 space-y-1">{renderNavItems(() => { if (window.innerWidth < 768) closeMobile() })}</nav>
				</div>

				{/* Panel 2: Mobile switcher (slides in from right) */}
				<div className={`md:hidden absolute inset-0 bg-[var(--sidebar-bg)] flex flex-col transition-transform duration-200 ${switcherPanelOpen ? 'translate-x-0' : 'translate-x-full'}`}>
					{/* Back button */}
					<button
						onClick={() => setSwitcherPanelOpen(false)}
						aria-label="Back to navigation"
						className="absolute top-2 left-2 p-1 text-[var(--text-subtle)] hover:text-[var(--text-muted)] cursor-pointer"
					>
						<ChevronLeftIcon className="w-5 h-5" />
					</button>

					<div className="flex-1 overflow-y-auto">
						{/* Header: large avatar + name + hostname */}
						<div className="flex flex-col items-center pt-[4.5rem] pb-4 mb-2">
							<span className="w-10 h-10 rounded-md bg-[var(--border)] text-[var(--text-muted)] flex items-center justify-center text-base font-bold">
								{letterAvatar}
							</span>
							<span className="mt-2 text-sm font-semibold text-[var(--text-heading)]">{currentWebsite.name}</span>
							<span className="mt-0.5 text-xs text-[var(--text-muted)]">{currentWebsite.hostname}</span>
						</div>

						{renderSwitcherItems(closeMobile)}
					</div>
				</div>
			</aside>

			{/* Content area */}
			<main className="md:ml-60 min-h-screen">
				<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
			</main>
		</div>
	)
}

// =============================================================================
// Icons (stroke-width 1.5 to match mock)
// =============================================================================

function LanguagesIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 5h8M7 5V3m2.5 7.5L7 9m0 0L5 12m2-3l2 3m5-3h6m-3 0v8m-2-4h4" />
			<text x="14" y="9" fontSize="7" fill="currentColor" stroke="none" fontWeight="600">A</text>
		</svg>
	)
}

function SegmentsIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 6h16M4 10h12M4 14h16M4 18h8" />
		</svg>
	)
}

function PathsIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
		</svg>
	)
}

function StatsIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3v18h18M7 16v-3m4 3v-6m4 6v-4m4 4V7" />
		</svg>
	)
}

function SettingsIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
			<circle cx="12" cy="12" r="3" strokeWidth="1.5" />
		</svg>
	)
}

function UserIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<circle cx="12" cy="8" r="4" strokeWidth="1.5" />
			<path strokeWidth="1.5" d="M4 20c0-4 4-6 8-6s8 2 8 6" />
		</svg>
	)
}

function SunIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<circle cx="12" cy="12" r="5" strokeWidth="1.5" />
			<path strokeLinecap="round" strokeWidth="1.5" d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
		</svg>
	)
}

function MoonIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
		</svg>
	)
}

function SignOutIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h6a2 2 0 012 2v1" />
		</svg>
	)
}

function PlusIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" />
		</svg>
	)
}

function ChevronIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
		</svg>
	)
}

function ChevronLeftIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
		</svg>
	)
}

function CloseIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
		</svg>
	)
}

function HamburgerIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
		</svg>
	)
}

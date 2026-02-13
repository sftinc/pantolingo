'use client'

import { useState, useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useTheme } from '@/hooks/useTheme'
import { ProfileModal } from './ProfileModal'

interface AccountShellProps {
	currentWebsite: { publicCode: string; hostname: string; name: string; sourceLang: string; role: string }
	websites: { publicCode: string; hostname: string; name: string }[]
	userName: string
	signOutAction: () => Promise<void>
	children: React.ReactNode
}

const WEBSITE_COLORS = [
	'red', 'rose', 'pink', 'fuchsia', 'purple', 'violet',
	'indigo', 'blue', 'sky', 'cyan', 'teal', 'emerald',
	'green', 'lime', 'yellow', 'amber', 'orange', 'slate',
] as const

type WebsiteColor = (typeof WEBSITE_COLORS)[number]

const COLOR_CLASSES: Record<WebsiteColor, { btn: string; hover: string; avatar: string; chevron: string }> = {
	red:     { btn: 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',         hover: 'hover:bg-red-200 dark:hover:bg-red-800',         avatar: 'bg-red-700/20 dark:bg-red-300/20',         chevron: 'text-red-400' },
	rose:    { btn: 'bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300',      hover: 'hover:bg-rose-200 dark:hover:bg-rose-800',      avatar: 'bg-rose-700/20 dark:bg-rose-300/20',      chevron: 'text-rose-400' },
	pink:    { btn: 'bg-pink-100 dark:bg-pink-900 text-pink-700 dark:text-pink-300',      hover: 'hover:bg-pink-200 dark:hover:bg-pink-800',      avatar: 'bg-pink-700/20 dark:bg-pink-300/20',      chevron: 'text-pink-400' },
	fuchsia: { btn: 'bg-fuchsia-100 dark:bg-fuchsia-900 text-fuchsia-700 dark:text-fuchsia-300', hover: 'hover:bg-fuchsia-200 dark:hover:bg-fuchsia-800', avatar: 'bg-fuchsia-700/20 dark:bg-fuchsia-300/20', chevron: 'text-fuchsia-400' },
	purple:  { btn: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',  hover: 'hover:bg-purple-200 dark:hover:bg-purple-800',  avatar: 'bg-purple-700/20 dark:bg-purple-300/20',  chevron: 'text-purple-400' },
	violet:  { btn: 'bg-violet-100 dark:bg-violet-900 text-violet-700 dark:text-violet-300',  hover: 'hover:bg-violet-200 dark:hover:bg-violet-800',  avatar: 'bg-violet-700/20 dark:bg-violet-300/20',  chevron: 'text-violet-400' },
	indigo:  { btn: 'bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300',  hover: 'hover:bg-indigo-200 dark:hover:bg-indigo-800',  avatar: 'bg-indigo-700/20 dark:bg-indigo-300/20',  chevron: 'text-indigo-400' },
	blue:    { btn: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',      hover: 'hover:bg-blue-200 dark:hover:bg-blue-800',      avatar: 'bg-blue-700/20 dark:bg-blue-300/20',      chevron: 'text-blue-400' },
	sky:     { btn: 'bg-sky-100 dark:bg-sky-900 text-sky-700 dark:text-sky-300',         hover: 'hover:bg-sky-200 dark:hover:bg-sky-800',         avatar: 'bg-sky-700/20 dark:bg-sky-300/20',         chevron: 'text-sky-400' },
	cyan:    { btn: 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300',      hover: 'hover:bg-cyan-200 dark:hover:bg-cyan-800',      avatar: 'bg-cyan-700/20 dark:bg-cyan-300/20',      chevron: 'text-cyan-400' },
	teal:    { btn: 'bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300',      hover: 'hover:bg-teal-200 dark:hover:bg-teal-800',      avatar: 'bg-teal-700/20 dark:bg-teal-300/20',      chevron: 'text-teal-400' },
	emerald: { btn: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300', hover: 'hover:bg-emerald-200 dark:hover:bg-emerald-800', avatar: 'bg-emerald-700/20 dark:bg-emerald-300/20', chevron: 'text-emerald-400' },
	green:   { btn: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',    hover: 'hover:bg-green-200 dark:hover:bg-green-800',    avatar: 'bg-green-700/20 dark:bg-green-300/20',    chevron: 'text-green-400' },
	lime:    { btn: 'bg-lime-100 dark:bg-lime-900 text-lime-700 dark:text-lime-300',      hover: 'hover:bg-lime-200 dark:hover:bg-lime-800',      avatar: 'bg-lime-700/20 dark:bg-lime-300/20',      chevron: 'text-lime-400' },
	yellow:  { btn: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300',  hover: 'hover:bg-yellow-200 dark:hover:bg-yellow-800',  avatar: 'bg-yellow-700/20 dark:bg-yellow-300/20',  chevron: 'text-yellow-400' },
	amber:   { btn: 'bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300',    hover: 'hover:bg-amber-200 dark:hover:bg-amber-800',    avatar: 'bg-amber-700/20 dark:bg-amber-300/20',    chevron: 'text-amber-400' },
	orange:  { btn: 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300',  hover: 'hover:bg-orange-200 dark:hover:bg-orange-800',  avatar: 'bg-orange-700/20 dark:bg-orange-300/20',  chevron: 'text-orange-400' },
	slate:   { btn: 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300',    hover: 'hover:bg-slate-200 dark:hover:bg-slate-800',    avatar: 'bg-slate-700/20 dark:bg-slate-300/20',    chevron: 'text-slate-400' },
}

function getWebsiteColor(name: string): WebsiteColor {
	const code = name.charAt(0).toUpperCase().charCodeAt(0) - 65
	return WEBSITE_COLORS[((code % WEBSITE_COLORS.length) + WEBSITE_COLORS.length) % WEBSITE_COLORS.length]
}

const NAV_ITEMS = [
	{ label: 'Languages', path: 'languages', icon: LanguagesIcon },
	{ label: 'Segments', path: 'segments', icon: SegmentsIcon },
	{ label: 'Paths', path: 'paths', icon: PathsIcon },
	{ label: 'Stats', path: 'stats', icon: StatsIcon },
]

const SECONDARY_NAV = [
	{ label: 'Setup', path: 'setup', icon: ClipboardCheckIcon },
]

export function AccountShell({ currentWebsite, websites, userName, signOutAction, children }: AccountShellProps) {
	const pathname = usePathname()
	const router = useRouter()
	const { theme, cycleTheme, mounted } = useTheme()

	const [mobileOpen, setMobileOpen] = useState(false)
	const [switcherOpen, setSwitcherOpen] = useState(false)
	const [profileOpen, setProfileOpen] = useState(false)
	const [profileModalOpen, setProfileModalOpen] = useState(false)

	const switcherRef = useRef<HTMLDivElement>(null)
	const profileRef = useRef<HTMLDivElement>(null)

	const basePath = `/account/${currentWebsite.publicCode}`
	const otherWebsites = websites.filter((w) => w.publicCode !== currentWebsite.publicCode)
	const currentColor = COLOR_CLASSES[getWebsiteColor(currentWebsite.name)]

	function isActive(navPath: string) {
		return pathname.startsWith(`${basePath}/${navPath}`)
	}

	// Close mobile sidebar on navigation
	useEffect(() => {
		setMobileOpen(false)
	}, [pathname])

	// Click-outside handler for dropdowns
	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
				setSwitcherOpen(false)
			}
			if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
				setProfileOpen(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	const themeLabel = theme === 'light' ? 'Light mode' : theme === 'dark' ? 'Dark mode' : 'System'
	const ThemeIcon = theme === 'light' ? SunIcon : theme === 'dark' ? MoonIcon : MonitorIcon

	return (
		<div className="min-h-screen bg-[var(--content-bg)]">
			{/* Top header bar */}
			<header className="sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 md:ml-60 h-14 bg-white dark:bg-[var(--sidebar-bg)] border-b border-[var(--sidebar-border)] md:bg-[var(--content-bg)] md:border-b-0">
				{/* Left: hamburger (mobile) + website switcher */}
				<div className="flex items-center gap-3">
					<button
						onClick={() => setMobileOpen(true)}
						className="p-1 text-[var(--text-muted)] cursor-pointer md:hidden"
						aria-label="Open menu"
					>
						<HamburgerIcon className="w-6 h-6" />
					</button>
					{/* Website switcher */}
					<div ref={switcherRef} className="relative">
						<button
							onClick={() => {
								setSwitcherOpen(!switcherOpen)
								setProfileOpen(false)
							}}
							className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${currentColor.btn} ${currentColor.hover} transition-colors cursor-pointer`}
						>
							<span className={`w-4 h-4 rounded ${currentColor.avatar} flex items-center justify-center text-[10px] font-semibold shrink-0`}>
								{currentWebsite.name[0].toUpperCase()}
							</span>
							<span className="font-semibold truncate max-w-[60px] sm:max-w-none">{currentWebsite.name}</span>
							<ChevronIcon className={`w-4 h-4 ${currentColor.chevron} transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
						</button>

						{switcherOpen && (
							<div className="absolute left-0 top-full mt-1 w-64 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-50">
								{/* Add website */}
								<button
									disabled
									className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] opacity-50 cursor-not-allowed"
								>
									<PlusIcon className="w-5 h-5 text-[var(--text-subtle)]" />
									Add website
								</button>

								{otherWebsites.length > 0 && (
									<>
										<div className="border-t border-[var(--border)] my-1" />
										{otherWebsites.map((site) => {
											const siteColor = COLOR_CLASSES[getWebsiteColor(site.name)]
											return (
												<button
													key={site.publicCode}
													onClick={() => {
														setSwitcherOpen(false)
														router.push(`/account/${site.publicCode}/languages`)
													}}
													className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
												>
													<span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${siteColor.btn}`}>
														{site.name[0].toUpperCase()}
													</span>
													{site.name}
												</button>
											)
										})}
									</>
								)}
							</div>
						)}
					</div>
				</div>

				{/* Right: profile */}
				<div className="flex items-center">
					{/* Profile */}
					<div ref={profileRef} className="relative">
						<button
							onClick={() => {
								setProfileOpen(!profileOpen)
								setSwitcherOpen(false)
							}}
							className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
						>
							<UserIcon className="w-5 h-5" />
							<span className="hidden sm:inline">{userName}</span>
							<ChevronIcon className={`w-4 h-4 text-[var(--text-subtle)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
						</button>

						{profileOpen && (
							<div className="absolute right-0 top-full mt-1 w-48 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-lg py-1 z-50">
								{/* Profile link */}
								<button
									onClick={() => { setProfileOpen(false); setProfileModalOpen(true) }}
									className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
								>
									<UserIcon className="w-5 h-5 text-[var(--text-subtle)]" />
									Profile
								</button>

								<div className="border-t border-[var(--border)] my-1" />

								{/* Theme cycle */}
								<button
									onClick={(e) => {
										e.stopPropagation()
										cycleTheme()
									}}
									className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
								>
									{mounted && <ThemeIcon className="w-5 h-5 text-[var(--text-subtle)]" />}
									{!mounted && <span className="w-5 h-5" />}
									{mounted ? themeLabel : ''}
								</button>

								{/* Sign out */}
								<form action={signOutAction}>
									<button
										type="submit"
										className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
									>
										<SignOutIcon className="w-5 h-5 text-[var(--text-subtle)]" />
										Sign out
									</button>
								</form>
							</div>
						)}
					</div>
				</div>
			</header>

			{/* Mobile overlay */}
			{mobileOpen && (
				<div className="md:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setMobileOpen(false)} />
			)}

			{/* Sidebar */}
			<aside
				className={`fixed top-0 left-0 z-50 h-full w-60 bg-[var(--sidebar-bg)] border-r border-[var(--sidebar-border)] flex flex-col transition-transform duration-200 ${
					mobileOpen ? 'translate-x-0' : '-translate-x-full'
				} md:translate-x-0`}
			>
				{/* Logo row */}
				<div className="h-14 flex items-center px-5 shrink-0">
					<span className="text-base font-bold text-[var(--text-heading)]">Pantolingo</span>
				</div>

				{/* Primary nav */}
				<nav className="px-2 pt-9 space-y-1">
					{NAV_ITEMS.map((item) => {
						const active = isActive(item.path)
						return (
							<Link
								key={item.path}
								href={`${basePath}/${item.path}`}
								onClick={() => setMobileOpen(false)}
								className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
									active
										? 'bg-[var(--nav-active-bg)] text-[var(--text-heading)]'
										: 'text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-heading)]'
								}`}
							>
								<item.icon className="w-5 h-5 shrink-0" />
								<span>{item.label}</span>
							</Link>
						)
					})}

					{/* Secondary nav */}
					<div className="pt-6 space-y-1">
						<Link
							href={`${basePath}/settings`}
							onClick={() => setMobileOpen(false)}
							className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
								pathname.startsWith(`${basePath}/settings`)
									? 'bg-[var(--nav-active-bg)] text-[var(--text-heading)]'
									: 'text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-heading)]'
							}`}
						>
							<SettingsIcon className="w-5 h-5 shrink-0 text-[var(--text-subtle)]" />
							<span>Settings</span>
						</Link>
						{SECONDARY_NAV.map((item) => {
							const active = isActive(item.path)
							return (
								<Link
									key={item.path}
									href={`${basePath}/${item.path}`}
									onClick={() => setMobileOpen(false)}
									className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
										active
											? 'bg-[var(--nav-active-bg)] text-[var(--text-heading)]'
											: 'text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] hover:text-[var(--text-heading)]'
									}`}
								>
									<item.icon className="w-5 h-5 shrink-0 text-[var(--text-subtle)]" />
									<span>{item.label}</span>
								</Link>
							)
						})}
					</div>
				</nav>
			</aside>

			{/* Main content */}
			<main className="md:ml-60 min-h-screen">
				<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</div>
			</main>

			<ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} />
		</div>
	)
}

// =============================================================================
// Icons
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

function ClipboardCheckIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
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

function MonitorIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="1.5" />
			<path strokeLinecap="round" strokeWidth="1.5" d="M8 21h8m-4-4v4" />
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

function HamburgerIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
		</svg>
	)
}

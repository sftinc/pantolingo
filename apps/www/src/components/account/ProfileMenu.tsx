'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useTheme } from '@/hooks/useTheme'
import { ProfileModal } from './ProfileModal'

interface UserProfile {
	firstName: string
	lastName: string
	email: string
}

interface ProfileMenuProps {
	userName: string
	userProfile: UserProfile
	signOutAction: () => Promise<void>
}

export function ProfileMenu({ userName, userProfile, signOutAction }: ProfileMenuProps) {
	const { theme, cycleTheme, mounted } = useTheme()
	const [profileOpen, setProfileOpen] = useState(false)
	const [profileModalOpen, setProfileModalOpen] = useState(false)
	const profileRef = useRef<HTMLDivElement>(null)

	const ThemeIcon = theme === 'dark' ? MoonIcon : theme === 'light' ? SunIcon : MonitorIcon
	const themeLabel = theme === 'dark' ? 'Dark' : theme === 'light' ? 'Light' : 'System'

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
				setProfileOpen(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	return (
		<>
			<div ref={profileRef} className="relative">
				<button
					onClick={() => setProfileOpen(!profileOpen)}
					className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
				>
					<UserIcon className="w-5 h-5" />
					<span className="hidden sm:inline">{userName}</span>
					<ChevronIcon className={`w-4 h-4 text-[var(--text-subtle)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
				</button>

				{profileOpen && (
					<div className="absolute right-0 top-full mt-1 w-48 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-lg py-1 z-50">
						<button
							onClick={() => { setProfileOpen(false); setProfileModalOpen(true) }}
							className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
						>
							<UserIcon className="w-5 h-5 text-[var(--text-subtle)]" />
							Profile
						</button>

						<Link
							href="/account/billing"
							onClick={() => setProfileOpen(false)}
							className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
						>
							<BillingIcon className="w-5 h-5 text-[var(--text-subtle)]" />
							Billing
						</Link>

						<div className="border-t border-[var(--border)] my-1" />

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

						<form action={signOutAction}>
							<button
								type="submit"
								tabIndex={0}
								className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
							>
								<SignOutIcon className="w-5 h-5 text-[var(--text-subtle)]" />
								Sign out
							</button>
						</form>
					</div>
				)}
			</div>

			<ProfileModal isOpen={profileModalOpen} onClose={() => setProfileModalOpen(false)} userProfile={userProfile} />
		</>
	)
}

// Icons

function UserIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<circle cx="12" cy="8" r="4" strokeWidth="1.5" />
			<path strokeWidth="1.5" d="M4 20c0-4 4-6 8-6s8 2 8 6" />
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

function BillingIcon({ className }: { className?: string }) {
	return (
		<svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<rect x="2" y="5" width="20" height="14" rx="2" strokeWidth="1.5" />
			<path strokeLinecap="round" strokeWidth="1.5" d="M2 10h20" />
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

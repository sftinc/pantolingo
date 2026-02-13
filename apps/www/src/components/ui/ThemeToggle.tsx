'use client'

import { useTheme } from '@/hooks/useTheme'

export function ThemeToggle() {
	const { theme, cycleTheme, mounted } = useTheme()

	if (!mounted) {
		return (
			<button
				className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--border)] transition-colors"
				aria-label="Toggle theme"
			>
				<span className="w-5 h-5 block" />
			</button>
		)
	}

	const label = theme === 'light' ? 'Light mode' : theme === 'dark' ? 'Dark mode' : 'System'

	return (
		<button
			onClick={cycleTheme}
			className="p-2 rounded-md text-[var(--text-muted)] hover:text-[var(--text-heading)] hover:bg-[var(--border)] transition-colors"
			aria-label={`Current theme: ${label}. Click to cycle.`}
			title={`Theme: ${label}`}
		>
			{theme === 'light' && <SunIcon />}
			{theme === 'dark' && <MoonIcon />}
			{theme === 'system' && <MonitorIcon />}
		</button>
	)
}

function SunIcon() {
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
			<circle cx="12" cy="12" r="4" />
			<path d="M12 2v2" />
			<path d="M12 20v2" />
			<path d="m4.93 4.93 1.41 1.41" />
			<path d="m17.66 17.66 1.41 1.41" />
			<path d="M2 12h2" />
			<path d="M20 12h2" />
			<path d="m6.34 17.66-1.41 1.41" />
			<path d="m19.07 4.93-1.41 1.41" />
		</svg>
	)
}

function MoonIcon() {
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
			<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
		</svg>
	)
}

function MonitorIcon() {
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
			<rect x="2" y="3" width="20" height="14" rx="2" />
			<path d="M8 21h8" />
			<path d="M12 17v4" />
		</svg>
	)
}

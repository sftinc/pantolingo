'use client'

import { useState, useEffect, useCallback } from 'react'

export type ThemeMode = 'light' | 'dark' | 'system'

function getSystemTheme(): 'light' | 'dark' {
	if (typeof window === 'undefined') return 'light'
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeToDOM(theme: ThemeMode) {
	const root = document.documentElement
	root.classList.remove('light', 'dark')
	if (theme === 'system') {
		// Resolve OS preference to a class so Tailwind dark: utilities stay in sync
		root.classList.add(getSystemTheme())
	} else {
		root.classList.add(theme)
	}
}

export function useTheme() {
	const [theme, setTheme] = useState<ThemeMode>('system')
	const [mounted, setMounted] = useState(false)

	useEffect(() => {
		const stored = localStorage.getItem('theme') as ThemeMode | null
		const initial: ThemeMode = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system'
		setTheme(initial)
		applyThemeToDOM(initial)
		setMounted(true)
	}, [])

	// Listen for system preference changes when in system mode
	useEffect(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)')
		const handler = () => {
			if (theme === 'system') {
				applyThemeToDOM('system')
			}
		}
		mq.addEventListener('change', handler)
		return () => mq.removeEventListener('change', handler)
	}, [theme])

	const effectiveTheme: 'light' | 'dark' = theme === 'system' ? getSystemTheme() : theme

	const cycleTheme = useCallback(() => {
		const order: ThemeMode[] = ['light', 'dark', 'system']
		const next = order[(order.indexOf(theme) + 1) % order.length]
		setTheme(next)
		localStorage.setItem('theme', next)
		applyThemeToDOM(next)
	}, [theme])

	return { theme, effectiveTheme, cycleTheme, mounted }
}

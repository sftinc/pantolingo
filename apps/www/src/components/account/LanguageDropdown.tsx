'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getFlag, getLanguageName } from '@pantolingo/lang'

interface LanguageDropdownProps {
	langs: { langCd: string }[]
	currentLangCd: string
	publicCode: string
	basePath: 'segments' | 'paths'
}

export function LanguageDropdown({ langs, currentLangCd, publicCode, basePath }: LanguageDropdownProps) {
	const router = useRouter()
	const [isOpen, setIsOpen] = useState(false)
	const containerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	const handleSelect = (langCd: string) => {
		setIsOpen(false)
		router.push(`/account/${publicCode}/${basePath}?lang=${langCd}`)
	}

	return (
		<div ref={containerRef} className="relative inline-block">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[var(--card-bg)] border border-[var(--border)] text-sm font-medium text-[var(--text-heading)] hover:border-[var(--border-hover)] transition-colors cursor-pointer"
			>
				<span>{getFlag(currentLangCd)}</span>
				<span>{getLanguageName(currentLangCd).split(' (')[0]}</span>
				<svg className={`w-4 h-4 text-[var(--text-subtle)] transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>

			{isOpen && (
				<ul className="absolute right-0 top-full z-50 mt-1 w-56 max-h-64 overflow-y-auto rounded-lg bg-[var(--card-bg)] border border-[var(--border)] shadow-lg [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--border)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
					{langs.map((lang) => (
						<li key={lang.langCd}>
							<button
								type="button"
								onClick={() => handleSelect(lang.langCd)}
								className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-[var(--accent)] hover:text-white transition-colors cursor-pointer ${
									lang.langCd === currentLangCd
										? 'bg-[var(--accent)]/10 text-[var(--accent)] font-medium'
										: 'text-[var(--text-muted)]'
								}`}
							>
								<span>{getFlag(lang.langCd)}</span>
								<span>{getLanguageName(lang.langCd).split(' (')[0]}</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	)
}

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
				className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-600 transition-colors cursor-pointer"
			>
				<span>{getFlag(currentLangCd)}</span>
				<span>{getLanguageName(currentLangCd).split(' (')[0]}</span>
				<svg className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
					<path d="m6 9 6 6 6-6" />
				</svg>
			</button>

			{isOpen && (
				<ul className="absolute right-0 top-full z-50 mt-1 w-56 max-h-64 overflow-y-auto rounded-lg bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 shadow-lg [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
					{langs.map((lang) => (
						<li key={lang.langCd}>
							<button
								type="button"
								onClick={() => handleSelect(lang.langCd)}
								className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-colors cursor-pointer ${
									lang.langCd === currentLangCd
										? 'bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 font-medium'
										: 'text-gray-600 dark:text-gray-400'
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

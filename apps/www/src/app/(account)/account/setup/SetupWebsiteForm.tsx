'use client'

import { useState, useRef, useEffect, useActionState } from 'react'
import { createFirstWebsite, type AccountActionState } from '@/actions/account'

interface LanguageOption {
	code: string
	name: string
	flag: string
}

export default function SetupWebsiteForm({ languages }: { languages: LanguageOption[] }) {
	const [selectedLang, setSelectedLang] = useState<LanguageOption | null>(null)
	const [isOpen, setIsOpen] = useState(false)
	const [search, setSearch] = useState('')
	const dropdownRef = useRef<HTMLDivElement>(null)
	const searchRef = useRef<HTMLInputElement>(null)

	const [state, formAction, isPending] = useActionState<AccountActionState, FormData>(
		createFirstWebsite,
		null
	)

	useEffect(() => {
		const handler = (e: MouseEvent) => {
			if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handler)
		return () => document.removeEventListener('mousedown', handler)
	}, [])

	const handleSelect = (lang: LanguageOption) => {
		setSelectedLang(lang)
		setIsOpen(false)
		setSearch('')
	}

	const handleToggle = () => {
		const next = !isOpen
		setIsOpen(next)
		if (next) {
			setSearch('')
			setTimeout(() => searchRef.current?.focus(), 0)
		}
	}

	const filteredLanguages = search
		? languages.filter((l) => l.name.toLowerCase().includes(search.toLowerCase()))
		: languages

	return (
		<main className="flex flex-1 flex-col items-center px-4 py-12 sm:px-6">
			<div className="text-center mb-8">
				<h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
					Add your website
				</h1>
				<p className="text-base text-gray-600 dark:text-gray-400 max-w-md">
					Set up your first website to start translating. You can add more websites later from within your account.
				</p>
			</div>

			<div className="w-full max-w-md bg-white dark:bg-neutral-900 p-8 sm:p-10 rounded-lg shadow-md shadow-black/10 dark:shadow-black/30">
					{state?.error && (
						<div className="mb-4 p-3 bg-red-600/10 dark:bg-red-500/10 text-red-600 dark:text-red-500 rounded-md text-sm">
							{state.error}
						</div>
					)}

					<form action={formAction}>
						<label
							htmlFor="name"
							className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2"
						>
							Website name
						</label>
						<input
							id="name"
							name="name"
							type="text"
							required
							autoFocus
							maxLength={100}
							disabled={isPending}
							placeholder="My Blog"
							className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
						/>

						<label
							htmlFor="hostname"
							className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2"
						>
							Hostname
						</label>
						<input
							id="hostname"
							name="hostname"
							type="text"
							required
							maxLength={253}
							disabled={isPending}
							placeholder="example.com"
							className="w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 text-gray-800 dark:text-gray-200 mb-1 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
						/>
						<p className="text-xs text-gray-600 dark:text-gray-400 mb-4">
							Enter without https:// (e.g., www.example.com)
						</p>

						<label className="block text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
							Source language
						</label>
						<input type="hidden" name="sourceLang" value={selectedLang?.code ?? ''} />
						<div ref={dropdownRef} className="relative mb-6">
							<button
								type="button"
								tabIndex={0}
								onClick={handleToggle}
								disabled={isPending}
								className="w-full flex items-center gap-2 px-4 py-3 rounded-md bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 text-sm font-medium text-gray-900 dark:text-gray-100 hover:border-gray-400 dark:hover:border-gray-600 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
							>
								{selectedLang ? (
									<>
										<span>{selectedLang.flag}</span>
										<span className="flex-1 text-left">{selectedLang.name}</span>
									</>
								) : (
									<span className="flex-1 text-left text-gray-600 dark:text-gray-400 font-normal">Select a language</span>
								)}
								<svg className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
									<path d="m6 9 6 6 6-6" />
								</svg>
							</button>

							{isOpen && (
								<div className="absolute left-0 top-full z-50 mt-1 w-full rounded-lg bg-white dark:bg-neutral-900 border border-gray-300 dark:border-gray-700 shadow-lg">
									<div className="p-2 border-b border-gray-300 dark:border-gray-700">
										<input
											ref={searchRef}
											type="text"
											value={search}
											onChange={(e) => setSearch(e.target.value)}
											placeholder="Search languages..."
											className="w-full px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-neutral-900 text-sm text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-blue-500 focus:border-transparent"
										/>
									</div>
									<ul className="max-h-52 overflow-y-auto [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-300 dark:[&::-webkit-scrollbar-thumb]:bg-gray-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
										{filteredLanguages.length === 0 ? (
											<li className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">No languages found</li>
										) : (
											filteredLanguages.map((lang) => (
												<li key={lang.code}>
													<button
														type="button"
														onClick={() => handleSelect(lang)}
														className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white transition-colors cursor-pointer ${
															selectedLang?.code === lang.code
																? 'bg-blue-600/10 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 font-medium'
																: 'text-gray-600 dark:text-gray-400'
														}`}
													>
														<span>{lang.flag}</span>
														<span>{lang.name}</span>
													</button>
												</li>
											))
										)}
									</ul>
								</div>
							)}
						</div>

						<button
							type="submit"
							tabIndex={0}
							disabled={isPending}
							className="w-full py-3 bg-blue-600 dark:bg-blue-500 text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
						>
							{isPending ? 'Creating...' : 'Continue'}
						</button>
					</form>
			</div>
		</main>
	)
}

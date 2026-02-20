'use client'

import { useState } from 'react'
import { WebsiteWizardModal, type LanguageOption } from '@/components/account/WebsiteWizardModal'

const STEP_LABELS = [
	'Website name',
	'Hostname',
	'Source language',
	'Translation language',
	'Review & create',
]

export default function WebsiteWizard({ languages }: { languages: LanguageOption[] }) {
	const [modalOpen, setModalOpen] = useState(false)

	return (
		<>
			<main className="flex flex-1 flex-col items-center px-4 py-12 sm:px-6">
				<div className="text-center mb-8">
					<h1 className="text-3xl font-bold text-[var(--text-heading)] mb-3">
						Let's get started!
					</h1>
					<p className="text-base text-[var(--text-muted)] max-w-md">
						Connect your website to Pantolingo and start translating it into other languages in <strong className="text-[var(--text-heading)]">under 5 minutes</strong>.
					</p>
				</div>
				<div className="w-full max-w-md bg-[var(--card-bg)] p-8 sm:p-10 rounded-lg shadow-[0_2px_8px_var(--shadow-color)]">
					<div className="space-y-3 mb-8">
						{STEP_LABELS.map((label, i) => (
							<div key={i} className="flex items-center gap-3">
								<div className="w-8 h-8 shrink-0 rounded-full bg-[var(--border)] flex items-center justify-center text-sm font-medium text-[var(--text-muted)]">
									{i + 1}
								</div>
								<span className="text-base text-[var(--text-body)]">{label}</span>
							</div>
						))}
					</div>
					<button
						type="button"
						onClick={() => setModalOpen(true)}
						className="w-full py-3 bg-[var(--accent)] text-white rounded-md font-medium hover:opacity-90 transition cursor-pointer"
					>
						Get Started
					</button>
				</div>
			</main>

			<WebsiteWizardModal
				isOpen={modalOpen}
				onClose={() => setModalOpen(false)}
				languages={languages}
			/>
		</>
	)
}

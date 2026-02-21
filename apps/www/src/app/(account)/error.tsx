'use client'

export default function AccountError({ reset }: { error: Error; reset: () => void }) {
	return (
		<div className="min-h-screen bg-[var(--page-bg)] flex items-center justify-center p-6">
			<div className="max-w-md w-full text-center">
				<div className="text-5xl mb-4">⚠</div>
				<h1 className="text-xl font-semibold text-[var(--text-heading)] mb-2">
					Something Went Wrong
				</h1>
				<p className="text-sm text-[var(--text-muted)] mb-6">
					We&apos;re having trouble loading this page. This is usually temporary &mdash; please try again in a moment.
				</p>
				<button
					onClick={() => window.location.reload()}
					className="px-4 py-2 text-sm font-medium rounded-md bg-[var(--accent)] text-white hover:opacity-90 transition-opacity cursor-pointer"
				>
					Try Again
				</button>
			</div>
		</div>
	)
}

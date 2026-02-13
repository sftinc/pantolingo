'use client'

import {
	type StandaloneKind,
	type PairedKind,
	STANDALONE_LABELS,
	PAIRED_LABELS,
	STANDALONE_COLORS,
	PAIRED_COLORS,
	isStandaloneKind,
	isPairedKind,
} from './placeholder-shared'
import { parseToken } from './placeholder-utils'

// ============================================================================
// Types
// ============================================================================

interface MissingPlaceholderToolbarProps {
	missing: string[]
	onInsert: (token: string) => void
}

// ============================================================================
// Helper Components
// ============================================================================

interface PlaceholderButtonProps {
	token: string
	onClick: () => void
}

function PlaceholderButton({ token, onClick }: PlaceholderButtonProps) {
	const parsed = parseToken(token)
	if (!parsed) return null

	// Determine label and color based on type
	let label: string
	let color: string

	if (parsed.isClose) {
		// Closing tag - shouldn't normally appear in missing list
		// but handle it gracefully
		if (isPairedKind(parsed.kind)) {
			label = `/${PAIRED_LABELS[parsed.kind as PairedKind]}`
			color = PAIRED_COLORS[parsed.kind as PairedKind]
		} else {
			label = token
			color = '#6b7280'
		}
	} else if (isStandaloneKind(parsed.kind)) {
		label = STANDALONE_LABELS[parsed.kind as StandaloneKind]
		color = STANDALONE_COLORS[parsed.kind as StandaloneKind]
	} else if (isPairedKind(parsed.kind)) {
		label = PAIRED_LABELS[parsed.kind as PairedKind]
		color = PAIRED_COLORS[parsed.kind as PairedKind]
	} else {
		label = token
		color = '#6b7280'
	}

	return (
		<button
			type="button"
			onClick={onClick}
			className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap transition-all hover:scale-105 hover:shadow-sm cursor-pointer"
			style={{
				backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
				color: color,
				border: `1px dashed ${color}`,
			}}
			title={`Click to insert ${token}`}
		>
			+ {label}
		</button>
	)
}

// ============================================================================
// Main Component
// ============================================================================

export function MissingPlaceholderToolbar({ missing, onInsert }: MissingPlaceholderToolbarProps) {
	if (missing.length === 0) return null

	// Group missing items: show open tags only (skip closing tags as they'll be inserted with opens)
	const openTagsOnly = missing.filter((token) => {
		const parsed = parseToken(token)
		return parsed && !parsed.isClose
	})

	if (openTagsOnly.length === 0) return null

	return (
		<div className="mb-2 p-2 rounded-lg bg-yellow-600/10 dark:bg-yellow-500/10 border border-yellow-600/30 dark:border-yellow-500/30">
			<div className="flex items-center gap-2 flex-wrap">
				<span className="text-xs font-medium text-yellow-600 dark:text-yellow-500">
					Missing placeholders:
				</span>
				{openTagsOnly.map((token) => (
					<PlaceholderButton
						key={token}
						token={token}
						onClick={() => onInsert(token)}
					/>
				))}
			</div>
		</div>
	)
}

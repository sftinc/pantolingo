// Shared types, constants, and components for placeholder rendering
// Used by both PlaceholderText (read-only) and PlaceholderEditor (Lexical)

import React from 'react'

// ============================================================================
// Types
// ============================================================================

export type StandaloneKind = 'N' | 'P' | 'S' | 'HV'
export type PairedKind = 'HB' | 'HE' | 'HA' | 'HS' | 'HG'

export type ASTNode =
	| { type: 'text'; content: string }
	| { type: 'standalone'; kind: StandaloneKind; index: number }
	| { type: 'paired'; kind: PairedKind; index: number; children: ASTNode[] }

export interface Token {
	type: 'text' | 'open' | 'close' | 'standalone'
	content: string
	kind?: string
	index?: number
	start: number
	end: number
}

// ============================================================================
// Constants
// ============================================================================

export const PLACEHOLDER_REGEX = /\[(\/?[A-Z]+)(\d+)\]/g

export const STANDALONE_KINDS: StandaloneKind[] = ['N', 'P', 'S', 'HV']
export const PAIRED_KINDS: PairedKind[] = ['HB', 'HE', 'HA', 'HS', 'HG']

export const STANDALONE_LABELS: Record<StandaloneKind, string> = {
	N: 'number',
	P: 'email',
	S: 'skip',
	HV: 'element',
}

export const PAIRED_LABELS: Record<PairedKind, string> = {
	HB: 'bold',
	HE: 'emphasis',
	HA: 'anchor',
	HS: 'span',
	HG: 'element',
}

export const STANDALONE_COLORS: Record<StandaloneKind, string> = {
	N: 'var(--ph-number)',
	P: 'var(--ph-email)',
	S: 'var(--ph-skip)',
	HV: 'var(--ph-void)',
}

export const PAIRED_COLORS: Record<PairedKind, string> = {
	HB: 'var(--ph-bold)',
	HE: 'var(--ph-emphasis)',
	HA: 'var(--ph-anchor)',
	HS: 'var(--ph-span)',
	HG: 'var(--ph-generic)',
}

// ============================================================================
// Helper Functions
// ============================================================================

export function isStandaloneKind(kind: string): kind is StandaloneKind {
	return STANDALONE_KINDS.includes(kind as StandaloneKind)
}

export function isPairedKind(kind: string): kind is PairedKind {
	return PAIRED_KINDS.includes(kind as PairedKind)
}

// ============================================================================
// Shared Badge Component (for standalone placeholders)
// ============================================================================

interface PlaceholderBadgeProps {
	kind: StandaloneKind
	className?: string
}

export function PlaceholderBadge({ kind, className = '' }: PlaceholderBadgeProps) {
	const label = STANDALONE_LABELS[kind]
	const color = STANDALONE_COLORS[kind]

	return React.createElement('span', {
		className: `inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium whitespace-nowrap ${className}`,
		style: {
			backgroundColor: `color-mix(in srgb, ${color} 20%, transparent)`,
			color: color,
		},
	}, label)
}

// ============================================================================
// Tokenization
// ============================================================================

export function tokenize(text: string): Token[] {
	const tokens: Token[] = []
	let lastIndex = 0

	// Find all placeholders
	const matches: Array<{ match: RegExpExecArray; isClosing: boolean; kind: string; index: number }> = []
	let match: RegExpExecArray | null

	// Reset regex state
	const regex = new RegExp(PLACEHOLDER_REGEX.source, 'g')

	while ((match = regex.exec(text)) !== null) {
		const kindPart = match[1]
		const indexPart = parseInt(match[2], 10)
		const isClosing = kindPart.startsWith('/')
		const kind = isClosing ? kindPart.slice(1) : kindPart

		matches.push({
			match,
			isClosing,
			kind,
			index: indexPart,
		})
	}

	// Process matches
	for (const { match, isClosing, kind, index } of matches) {
		const start = match.index
		const end = start + match[0].length

		// Add text before this token
		if (start > lastIndex) {
			tokens.push({
				type: 'text',
				content: text.slice(lastIndex, start),
				start: lastIndex,
				end: start,
			})
		}

		// Determine token type
		if (isClosing) {
			tokens.push({
				type: 'close',
				content: match[0],
				kind,
				index,
				start,
				end,
			})
		} else if (STANDALONE_KINDS.includes(kind as StandaloneKind)) {
			// Standalone placeholders (no closing tag)
			tokens.push({
				type: 'standalone',
				content: match[0],
				kind,
				index,
				start,
				end,
			})
		} else if (PAIRED_KINDS.includes(kind as PairedKind)) {
			// Paired placeholders (opening tag)
			tokens.push({
				type: 'open',
				content: match[0],
				kind,
				index,
				start,
				end,
			})
		}

		lastIndex = end
	}

	// Add remaining text
	if (lastIndex < text.length) {
		tokens.push({
			type: 'text',
			content: text.slice(lastIndex),
			start: lastIndex,
			end: text.length,
		})
	}

	return tokens
}

// ============================================================================
// AST Parsing
// ============================================================================

export function parseToAST(tokens: Token[]): ASTNode[] {
	const result: ASTNode[] = []
	const stack: Array<{ kind: PairedKind; index: number; children: ASTNode[] }> = []

	for (const token of tokens) {
		const current = stack.length > 0 ? stack[stack.length - 1].children : result

		switch (token.type) {
			case 'text':
				current.push({ type: 'text', content: token.content })
				break

			case 'standalone':
				current.push({
					type: 'standalone',
					kind: token.kind as StandaloneKind,
					index: token.index!,
				})
				break

			case 'open':
				stack.push({
					kind: token.kind as PairedKind,
					index: token.index!,
					children: [],
				})
				break

			case 'close':
				// Find matching open tag
				for (let i = stack.length - 1; i >= 0; i--) {
					if (stack[i].kind === token.kind && stack[i].index === token.index) {
						// Pop all items from i to end
						const closed = stack.splice(i)
						const node = closed[0]

						// If there were unclosed tags between, add their children to this node
						for (let j = 1; j < closed.length; j++) {
							node.children.push(...closed[j].children)
						}

						const target = stack.length > 0 ? stack[stack.length - 1].children : result
						target.push({
							type: 'paired',
							kind: node.kind,
							index: node.index,
							children: node.children,
						})
						break
					}
				}
				break
		}
	}

	// Handle any unclosed tags - add their children to result
	for (const unclosed of stack) {
		result.push(...unclosed.children)
	}

	return result
}

// ============================================================================
// Shared Wrapper Component (for paired placeholders)
// ============================================================================

interface PlaceholderWrapperProps {
	kind: PairedKind
	children: React.ReactNode
	showTooltip?: boolean
	className?: string
}

export function PlaceholderWrapper({
	kind,
	children,
	showTooltip = true,
	className = '',
}: PlaceholderWrapperProps) {
	const label = PAIRED_LABELS[kind]
	const color = PAIRED_COLORS[kind]

	const tooltip = showTooltip
		? React.createElement('span', {
				key: 'tooltip',
				className:
					'absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 text-xs rounded opacity-0 group-hover/placeholder:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 text-white',
				style: { backgroundColor: color },
		  }, label)
		: null

	return React.createElement(
		'span',
		{
			className: `relative group/placeholder inline rounded-sm px-0.5 ${className}`,
			style: {
				backgroundColor: `color-mix(in srgb, ${color} 15%, transparent)`,
			},
		},
		React.createElement(React.Fragment, null, tooltip, children)
	)
}

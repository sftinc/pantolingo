/**
 * DOM extraction module for linkedom
 * Extracts translatable segments using recursive DOM traversal (TreeWalker replacement)
 * Supports grouped HTML extraction for inline elements
 */

import { TRANSLATE_ATTRS, BLOCK_TAGS, SKIP_TAGS } from '../config.js'
import type { Content } from '../types.js'
import { isGroupableElement, htmlToPlaceholders, containsText } from './placeholders.js'

/**
 * Check if a single element should be skipped (no ancestor walking)
 * Used within recursive traversals where ancestors are already handled by recursion.
 */
function isSkipElement(node: Node, skipSelectors: string[]): boolean {
	if (node.nodeType !== 1) return false
	const elem = node as Element
	if (SKIP_TAGS.has(elem.tagName.toLowerCase())) return true
	for (const selector of skipSelectors) {
		try {
			if (elem.matches(selector)) return true
		} catch (e) {
			// Invalid selector
		}
	}
	return false
}

/**
 * Pre-build a Set of all elements that should be skipped (including descendants).
 * Used by flat iterations (querySelectorAll) that can't rely on recursion for ancestor skipping.
 */
function buildSkipSet(document: Document, skipSelectors: string[]): Set<Element> {
	const skipSet = new Set<Element>()

	// Build a combined selector for skip tags + custom selectors
	const selectors: string[] = Array.from(SKIP_TAGS)
	for (const sel of skipSelectors) {
		selectors.push(sel)
	}

	if (selectors.length === 0) return skipSet

	try {
		const skipRoots = document.querySelectorAll(selectors.join(','))
		for (let i = 0; i < skipRoots.length; i++) {
			const root = skipRoots[i] as Element
			skipSet.add(root)
			// Also add all descendants
			const descendants = root.querySelectorAll('*')
			for (let j = 0; j < descendants.length; j++) {
				skipSet.add(descendants[j] as Element)
			}
		}
	} catch (e) {
		// Fallback: just use SKIP_TAGS if combined selector fails
		const skipRoots = document.querySelectorAll(Array.from(SKIP_TAGS).join(','))
		for (let i = 0; i < skipRoots.length; i++) {
			const root = skipRoots[i] as Element
			skipSet.add(root)
			const descendants = root.querySelectorAll('*')
			for (let j = 0; j < descendants.length; j++) {
				skipSet.add(descendants[j] as Element)
			}
		}
	}

	return skipSet
}

/**
 * Extract grouped block elements as single segments with HTML placeholders
 * @param node - Current node in traversal
 * @param segments - Accumulator array for segments
 * @param groupedElements - Set to track which elements were grouped
 * @param skipSelectors - CSS selectors for elements to skip
 */
function extractGroupedBlocks(node: Node, segments: Content[], groupedElements: Set<Element>, skipSelectors: string[]): void {
	if (isSkipElement(node, skipSelectors)) {
		return
	}

	if (node.nodeType === 1) {
		const elem = node as Element
		const tagName = elem.tagName.toLowerCase()

		// Check if this is a groupable block element
		if (BLOCK_TAGS.has(tagName) && isGroupableElement(elem)) {
			const innerHTML = elem.innerHTML
			const trimmed = innerHTML.trim()

			// Only process if there's actual text content
			if (trimmed.length > 0 && containsText(trimmed)) {
				const preserveWs = tagName === 'pre'
				const { text, replacements } = htmlToPlaceholders(innerHTML, preserveWs)

				// Only use grouped extraction if the result has content
				if (text.trim().length > 0) {
					const leading = innerHTML.match(/^(\s*)/)?.[1] || ''
					const trailing = innerHTML.match(/(\s*)$/)?.[1] || ''

					segments.push({
						kind: 'html',
						value: text.trim(),
						ws: { leading, trailing },
						htmlMeta: {
							originalInnerHTML: innerHTML,
							replacements,
							element: elem,
						},
					})

					// Mark this element as grouped so text node extraction skips it
					groupedElements.add(elem)
					return // Don't recurse into this element
				}
			}
		}
	}

	// Recurse into children
	const children = node.childNodes
	for (let i = 0; i < children.length; i++) {
		extractGroupedBlocks(children[i], segments, groupedElements, skipSelectors)
	}
}

/**
 * Recursively extract text nodes from DOM
 * Depth-first traversal maintains document order (same as TreeWalker)
 * @param node - Current node in traversal
 * @param segments - Accumulator array for segments
 * @param groupedElements - Set of elements that were grouped (to skip)
 * @param skipSelectors - CSS selectors for elements to skip
 */
function extractTextNodes(node: Node, segments: Content[], groupedElements: Set<Element>, skipSelectors: string[]): void {
	// Skip elements (recursion handles ancestors, so only check this node)
	if (isSkipElement(node, skipSelectors)) {
		return
	}

	// Skip if this element was grouped (already extracted as HTML segment)
	if (node.nodeType === 1 && groupedElements.has(node as Element)) {
		return
	}

	// If this is a text node with non-whitespace content
	if (node.nodeType === 3) {
		// Node.TEXT_NODE
		const text = (node as Text).data
		const trimmed = text.trim()
		if (trimmed.length > 0) {
			const leading = text.match(/^(\s*)/)?.[1] || ''
			const trailing = text.match(/(\s*)$/)?.[1] || ''

			segments.push({
				kind: 'text',
				value: trimmed,
				ws: { leading, trailing },
			})
		}
		return // Text nodes don't have children
	}

	// Recursively process child nodes in order (depth-first)
	const children = node.childNodes
	for (let i = 0; i < children.length; i++) {
		extractTextNodes(children[i], segments, groupedElements, skipSelectors)
	}
}

/**
 * Extract translatable attributes from all elements
 * Uses querySelectorAll which returns elements in document order
 * @param document - linkedom Document object
 * @param segments - Accumulator array for segments
 * @param skipSet - Pre-computed set of elements to skip
 */
function extractAttributes(document: Document, segments: Content[], skipSet: Set<Element>): void {
	const allElements = document.querySelectorAll('*')

	for (let i = 0; i < allElements.length; i++) {
		const elem = allElements[i] as Element

		// O(1) skip check using pre-computed set
		if (skipSet.has(elem)) {
			continue
		}

		// Check translatable attributes
		for (const attr of TRANSLATE_ATTRS) {
			const value = elem.getAttribute(attr)
			if (value && value.trim().length > 0) {
				const trimmed = value.trim()
				const leading = value.match(/^(\s*)/)?.[1] || ''
				const trailing = value.match(/(\s*)$/)?.[1] || ''

				segments.push({
					kind: 'attr',
					attr: attr,
					value: trimmed,
					ws: { leading, trailing },
				})
			}
		}
	}
}

/**
 * Extract title text from <title> element
 * @param document - linkedom Document object
 * @param segments - Accumulator array for segments
 * @param skipSet - Pre-computed set of elements to skip
 */
function extractHeadTitle(document: Document, segments: Content[], skipSet: Set<Element>): void {
	const titleElement = document.querySelector('title')
	if (!titleElement || skipSet.has(titleElement)) {
		return
	}
	if (titleElement.textContent && titleElement.textContent.trim().length > 0) {
		const text = titleElement.textContent
		const trimmed = text.trim()
		const leading = text.match(/^(\s*)/)?.[1] || ''
		const trailing = text.match(/(\s*)$/)?.[1] || ''

		segments.push({
			kind: 'text',
			value: trimmed,
			ws: { leading, trailing },
		})
	}
}

/**
 * Extract description from <meta name="description"> element
 * @param document - linkedom Document object
 * @param segments - Accumulator array for segments
 * @param skipSet - Pre-computed set of elements to skip
 */
function extractHeadDescription(document: Document, segments: Content[], skipSet: Set<Element>): void {
	const descElement = document.querySelector('meta[name="description"]')
	if (!descElement || skipSet.has(descElement as Element)) {
		return
	}
	const content = descElement.getAttribute('content')
	if (content && content.trim().length > 0) {
		const trimmed = content.trim()
		const leading = content.match(/^(\s*)/)?.[1] || ''
		const trailing = content.match(/(\s*)$/)?.[1] || ''

		segments.push({
			kind: 'attr',
			attr: 'content',
			value: trimmed,
			ws: { leading, trailing },
		})
	}
}

/**
 * Extract all translatable segments from linkedom DOM
 * Uses recursive traversal to replicate TreeWalker behavior
 * Supports grouped HTML extraction for block elements with inline content
 * @param document - linkedom Document object
 * @param skipSelectors - CSS selectors for elements to skip
 * @returns Array of Segment objects in stable traversal order
 */
export function extractSegments(document: Document, skipSelectors: string[]): Content[] {
	const segments: Content[] = []

	// Guard against invalid HTML (no documentElement means parsing failed)
	if (!document.documentElement) {
		return segments
	}

	// Pre-compute skip set once for O(1) lookups
	const skipSet = buildSkipSet(document, skipSelectors)

	// Track elements that were grouped (to skip during text node extraction)
	const groupedElements = new Set<Element>()

	// Extract head metadata first (title and description)
	extractHeadTitle(document, segments, skipSet)
	extractHeadDescription(document, segments, skipSet)

	// Extract grouped blocks first (p, h1-h6, li, etc. with inline content)
	// This produces 'html' kind segments with placeholders
	if (document.body) {
		extractGroupedBlocks(document.body, segments, groupedElements, skipSelectors)
	}

	// Extract remaining text nodes (skipping content inside grouped elements)
	// This handles non-groupable content that falls back to individual text nodes
	if (document.body) {
		extractTextNodes(document.body, segments, groupedElements, skipSelectors)
	}

	// Extract attributes from all elements (uses pre-computed skip set)
	extractAttributes(document, segments, skipSet)

	return segments
}

/**
 * Extract all unique pathnames from navigation links on the page
 * Used to translate all link destinations, not just the current page
 * @param document - linkedom Document object
 * @param originHost - Origin hostname to filter for
 * @returns Set of unique pathnames found in links
 */
export function extractLinkPathnames(document: Document, originHost: string): Set<string> {
	const pathnames = new Set<string>()

	// Guard against invalid HTML
	if (!document.documentElement) {
		return pathnames
	}

	// Extract pathnames from <a href> links
	const links = document.querySelectorAll('a[href]')
	for (let i = 0; i < links.length; i++) {
		const href = links[i].getAttribute('href')
		if (!href) continue

		try {
			if (href.includes('://')) {
				// Absolute URL - check if from origin domain
				const url = new URL(href)
				if (url.hostname === originHost) {
					pathnames.add(url.pathname)
				}
			} else if (href.startsWith('/')) {
				// Relative URL - extract pathname (before query/hash)
				const queryIndex = href.indexOf('?')
				const hashIndex = href.indexOf('#')

				// Find end of pathname
				let pathnameEnd = href.length
				if (queryIndex !== -1) pathnameEnd = Math.min(pathnameEnd, queryIndex)
				if (hashIndex !== -1) pathnameEnd = Math.min(pathnameEnd, hashIndex)

				const pathname = href.substring(0, pathnameEnd)
				if (pathname && pathname !== '/') {
					pathnames.add(pathname)
				}
			}
		} catch (e) {
			// Invalid URL, skip
		}
	}

	// Extract pathnames from <form action> elements
	const forms = document.querySelectorAll('form[action]')
	for (let i = 0; i < forms.length; i++) {
		const action = forms[i].getAttribute('action')
		if (!action) continue

		try {
			if (action.includes('://')) {
				// Absolute URL - check if from origin domain
				const url = new URL(action)
				if (url.hostname === originHost) {
					pathnames.add(url.pathname)
				}
			} else if (action.startsWith('/')) {
				// Relative URL - extract pathname (before query/hash)
				const queryIndex = action.indexOf('?')
				const hashIndex = action.indexOf('#')

				// Find end of pathname
				let pathnameEnd = action.length
				if (queryIndex !== -1) pathnameEnd = Math.min(pathnameEnd, queryIndex)
				if (hashIndex !== -1) pathnameEnd = Math.min(pathnameEnd, hashIndex)

				const pathname = action.substring(0, pathnameEnd)
				if (pathname && pathname !== '/') {
					pathnames.add(pathname)
				}
			}
		} catch (e) {
			// Invalid URL, skip
		}
	}

	return pathnames
}

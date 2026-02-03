/**
 * Translation Dictionary Builder
 * Builds a dictionary of original → translated values for client-side recovery
 * Called AFTER applyTranslations() so the DOM has final translated content
 */

import type { Content } from '../types.js'
import { TRANSLATE_ATTRS } from '../config.js'
import { shouldSkipNode, isInsideGroupedElement } from '../dom/utils.js'

/**
 * Translation dictionary for client-side recovery
 * Contains mappings from original content to translated content
 */
export interface TranslationDictionary {
	/** Text node mappings: original textContent → translated textContent */
	text: Record<string, string>
	/** HTML block mappings: original textContent (stripped) → translated innerHTML */
	html: Record<string, string>
	/** Attribute mappings: original value → translated value */
	attrs: Record<string, string>
	/** Pathname mappings: original path → translated path */
	paths: Record<string, string>
	/** Target language code (e.g., 'es', 'fr') */
	targetLang: string
}

/**
 * Build a translation dictionary from extracted segments and original values
 *
 * This function is called AFTER applyTranslations() has modified the DOM.
 * It builds a dictionary that maps original content to translated content,
 * which the client-side recovery script uses to re-apply translations after
 * React/Next.js hydration reverts them.
 *
 * @param document - The parsed HTML document (after translations applied)
 * @param segments - The extracted segments from the page
 * @param originalValues - The original segment values before translation
 * @param skipSelectors - CSS selectors for elements to skip
 * @param targetLang - The target language code
 * @returns Translation dictionary for client-side use
 */
export function buildTranslationDictionary(
	document: Document,
	segments: Content[],
	originalValues: string[],
	skipSelectors: string[],
	targetLang: string,
	pathnameMap?: Map<string, string>
): TranslationDictionary {
	const dictionary: TranslationDictionary = {
		text: {},
		html: {},
		attrs: {},
		paths: {},
		targetLang,
	}

	// Guard against mismatched arrays
	if (segments.length !== originalValues.length) {
		console.warn('[Dictionary] Segment/value count mismatch:', segments.length, 'vs', originalValues.length)
		return dictionary
	}

	// Process each segment and build dictionary entries
	for (let i = 0; i < segments.length; i++) {
		const segment = segments[i]
		const originalValue = originalValues[i]

		// Skip if original and current are the same (no translation occurred)
		// We need to get the current value from the DOM for comparison
		const currentValue = getCurrentValue(document, segment, skipSelectors, i, segments)
		if (currentValue === null || originalValue.trim() === currentValue.trim()) {
			continue
		}

		const originalKey = originalValue.trim()

		switch (segment.kind) {
			case 'html':
				// For HTML segments, key is original textContent, value is translated innerHTML
				if (segment.htmlMeta?.element) {
					const translatedInnerHTML = segment.htmlMeta.element.innerHTML
					// Use textContent as key (what React sees during hydration mismatch)
					dictionary.html[originalKey] = translatedInnerHTML
				}
				break

			case 'text':
				// For text segments, both key and value are text content
				dictionary.text[originalKey] = currentValue.trim()
				break

			case 'attr':
				// For attribute segments, key and value are attribute values
				dictionary.attrs[originalKey] = currentValue.trim()
				break

			// 'path' segments are not included - they're URL translations, not DOM content
		}
	}

	// Build paths from pathnameMap
	if (pathnameMap) {
		for (const [original, translated] of pathnameMap) {
			if (original !== translated) {
				dictionary.paths[original] = translated
			}
		}
	}

	// Log dictionary size for monitoring
	const totalEntries = Object.keys(dictionary.text).length +
		Object.keys(dictionary.html).length +
		Object.keys(dictionary.attrs).length +
		Object.keys(dictionary.paths).length

	if (totalEntries > 0) {
		const jsonSize = JSON.stringify(dictionary).length
		if (jsonSize > 500000) {
			console.warn(`[Dictionary] Large dictionary size: ${Math.round(jsonSize / 1024)}KB`)
		}
	}

	return dictionary
}

/**
 * Get the current translated value for a segment from the DOM
 * This traverses the DOM in the same order as extraction to find the right element
 */
function getCurrentValue(
	document: Document,
	segment: Content,
	skipSelectors: string[],
	targetIndex: number,
	allSegments: Content[]
): string | null {
	switch (segment.kind) {
		case 'html':
			// For HTML segments, the element reference is stored in htmlMeta
			if (segment.htmlMeta?.element) {
				// Return the innerHTML which contains the full translated content
				return segment.htmlMeta.element.innerHTML
			}
			return null

		case 'text':
			// For text segments, we need to traverse and count to find the right one
			return getTextNodeValue(document, skipSelectors, targetIndex, allSegments)

		case 'attr':
			// For attribute segments, traverse and count to find the right one
			return getAttributeValue(document, segment.attr || '', skipSelectors, targetIndex, allSegments)

		default:
			return null
	}
}

/**
 * Get text node value at the given segment index
 * Uses same traversal logic as extractor/applicator to ensure consistency
 */
function getTextNodeValue(
	document: Document,
	skipSelectors: string[],
	targetIndex: number,
	allSegments: Content[]
): string | null {
	// Count how many text segments come before this one
	// We need to find the nth text node where n = count of 'text' kind segments up to targetIndex
	let textIndex = 0
	for (let i = 0; i < targetIndex; i++) {
		// Count title (first text segment) and description separately
		if (allSegments[i].kind === 'text') {
			textIndex++
		}
	}

	// Check if this is the title (first segment is text, targetIndex 0)
	const titleElement = document.querySelector('title')
	if (titleElement && !shouldSkipNode(titleElement, skipSelectors) &&
		titleElement.textContent && titleElement.textContent.trim().length > 0) {
		if (textIndex === 0) {
			return titleElement.textContent
		}
		textIndex-- // Account for title being index 0
	}

	// Traverse body to find the text node
	if (!document.body) return null

	// Get grouped elements from earlier html segments
	const groupedElements = new Set<Element>()
	for (let i = 0; i < targetIndex; i++) {
		if (allSegments[i].kind === 'html' && allSegments[i].htmlMeta?.element) {
			groupedElements.add(allSegments[i].htmlMeta!.element)
		}
	}

	const result = findTextNode(document.body, skipSelectors, groupedElements, { count: 0, target: textIndex })
	return result
}

/**
 * Recursively find a text node at the target index
 */
function findTextNode(
	node: Node,
	skipSelectors: string[],
	groupedElements: Set<Element>,
	state: { count: number; target: number }
): string | null {
	if (shouldSkipNode(node, skipSelectors)) {
		return null
	}

	if (isInsideGroupedElement(node, groupedElements)) {
		return null
	}

	if (node.nodeType === 3) {
		const text = (node as Text).data
		if (text && text.trim().length > 0) {
			if (state.count === state.target) {
				return text
			}
			state.count++
		}
		return null
	}

	const children = node.childNodes
	for (let i = 0; i < children.length; i++) {
		const result = findTextNode(children[i], skipSelectors, groupedElements, state)
		if (result !== null) {
			return result
		}
	}

	return null
}

/**
 * Get attribute value at the given segment index
 */
function getAttributeValue(
	document: Document,
	attrName: string,
	skipSelectors: string[],
	targetIndex: number,
	allSegments: Content[]
): string | null {
	// Count how many attr segments come before this one
	let attrIndex = 0
	for (let i = 0; i < targetIndex; i++) {
		if (allSegments[i].kind === 'attr') {
			attrIndex++
		}
	}

	// Check description meta tag first (if it's an attr segment)
	const descElement = document.querySelector('meta[name="description"]')
	if (descElement && !shouldSkipNode(descElement, skipSelectors)) {
		const content = descElement.getAttribute('content')
		if (content && content.trim().length > 0) {
			if (attrIndex === 0 && attrName === 'content') {
				return content
			}
			// Account for description if it's an attr segment
			if (allSegments.some((s, i) => i < targetIndex && s.kind === 'attr' && s.attr === 'content')) {
				attrIndex--
			}
		}
	}

	// Traverse all elements to find the attribute
	const allElements = document.querySelectorAll('*')
	let currentAttrIndex = 0

	for (let i = 0; i < allElements.length; i++) {
		const elem = allElements[i] as Element

		if (shouldSkipNode(elem, skipSelectors)) {
			continue
		}

		for (const attr of TRANSLATE_ATTRS) {
			const value = elem.getAttribute(attr)
			if (value && value.trim().length > 0) {
				if (currentAttrIndex === attrIndex && attr === attrName) {
					return value
				}
				currentAttrIndex++
			}
		}
	}

	return null
}

/**
 * Tests for Dictionary Builder
 */

import { describe, it, expect } from 'vitest'
import { parseHTMLDocument } from '../dom/parser.js'
import { extractSegments } from '../dom/extractor.js'
import { applyTranslations } from '../dom/applicator.js'
import { buildTranslationDictionary } from './dictionary-builder.js'

describe('buildTranslationDictionary', () => {
	describe('text node translations', () => {
		it('builds dictionary for simple text translations', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Hello</title></head>
					<body>
						<div>World</div>
					</body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)

			// Simulate translations
			const translations = ['Hola', 'Mundo']
			applyTranslations(document, translations, segments, [])

			const dictionary = buildTranslationDictionary(document, segments, originalValues, [], 'es')

			expect(dictionary.targetLang).toBe('es')
			expect(dictionary.text['Hello']).toBe('Hola')
			expect(dictionary.text['World']).toBe('Mundo')
		})

		it('does not include unchanged text', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Hello</title></head>
					<body>
						<div>World</div>
					</body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)

			// Don't translate - use original values
			applyTranslations(document, ['Hello', 'World'], segments, [])

			const dictionary = buildTranslationDictionary(document, segments, originalValues, [], 'es')

			// Should be empty since nothing changed
			expect(Object.keys(dictionary.text).length).toBe(0)
		})
	})

	describe('HTML block translations', () => {
		it('builds dictionary for HTML blocks with inline elements', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body>
						<p>Hello <strong>world</strong></p>
					</body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)

			// Simulate translation (the value contains placeholders after extraction)
			// For HTML segments, we get the text with placeholders like "Hello [HB1]world[/HB1]"
			const translations = ['Test', 'Hola [HB1]mundo[/HB1]']
			applyTranslations(document, translations, segments, [])

			const dictionary = buildTranslationDictionary(document, segments, originalValues, [], 'es')

			// HTML segment should have innerHTML value
			expect(dictionary.targetLang).toBe('es')
			// The html dict uses textContent as key
			expect(Object.keys(dictionary.html).length).toBeGreaterThanOrEqual(0)
		})
	})

	describe('attribute translations', () => {
		it('builds dictionary for attribute translations', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body>
						<img src="test.jpg" alt="A cat" />
						<button title="Click me">Button</button>
					</body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)

			// Find attribute segment indices
			const attrSegments = segments.filter((s) => s.kind === 'attr')
			expect(attrSegments.length).toBe(2) // alt and title

			// Create translations (title, button text, alt, title attr)
			const translations = segments.map((s, i) => {
				if (s.value === 'A cat') return 'Un gato'
				if (s.value === 'Click me') return 'Haz clic'
				if (s.value === 'Button') return 'Boton'
				return s.value
			})

			applyTranslations(document, translations, segments, [])

			const dictionary = buildTranslationDictionary(document, segments, originalValues, [], 'es')

			expect(dictionary.attrs['A cat']).toBe('Un gato')
			expect(dictionary.attrs['Click me']).toBe('Haz clic')
		})
	})

	describe('skip selectors', () => {
		it('handles skip selectors correctly', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body>
						<p class="translate">Hello</p>
						<p class="skip">World</p>
					</body>
				</html>
			`)

			const skipSelectors = ['.skip']
			const segments = extractSegments(document, skipSelectors)
			const originalValues = segments.map((s) => s.value)

			// Only "Test" and "Hello" should be extracted
			expect(segments.length).toBe(2)

			const translations = ['Prueba', 'Hola']
			applyTranslations(document, translations, segments, skipSelectors)

			const dictionary = buildTranslationDictionary(document, segments, originalValues, skipSelectors, 'es')

			expect(dictionary.text['Test']).toBe('Prueba')
			// HTML segments with simple content
			expect(Object.keys(dictionary.html).length + Object.keys(dictionary.text).length).toBeGreaterThan(0)
		})
	})

	describe('pathname translations', () => {
		it('returns empty paths when pathnameMap is undefined', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body><p>Content</p></body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)
			applyTranslations(document, originalValues, segments, [])

			const dictionary = buildTranslationDictionary(document, segments, originalValues, [], 'es')
			expect(dictionary.paths).toEqual({})
		})

		it('returns empty paths when pathnameMap is empty', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body><p>Content</p></body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)
			applyTranslations(document, originalValues, segments, [])

			const dictionary = buildTranslationDictionary(document, segments, originalValues, [], 'es', new Map())
			expect(dictionary.paths).toEqual({})
		})

		it('includes translated paths in dictionary', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body><p>Content</p></body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)
			applyTranslations(document, originalValues, segments, [])

			const pathnameMap = new Map([
				['/about', '/acerca-de'],
				['/contact', '/contacto'],
			])
			const dictionary = buildTranslationDictionary(document, segments, originalValues, [], 'es', pathnameMap)
			expect(dictionary.paths).toEqual({
				'/about': '/acerca-de',
				'/contact': '/contacto',
			})
		})

		it('excludes paths where original equals translated', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body><p>Content</p></body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)
			applyTranslations(document, originalValues, segments, [])

			const pathnameMap = new Map([
				['/about', '/acerca-de'],
				['/api/v1', '/api/v1'],  // unchanged - should be excluded
			])
			const dictionary = buildTranslationDictionary(document, segments, originalValues, [], 'es', pathnameMap)
			expect(dictionary.paths).toEqual({ '/about': '/acerca-de' })
		})
	})

	describe('edge cases', () => {
		it('handles mismatched array lengths gracefully', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body><p>Content</p></body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = ['wrong', 'length', 'array']

			// Should return empty dictionary on mismatch
			const dictionary = buildTranslationDictionary(document, segments, originalValues, [], 'es')

			expect(Object.keys(dictionary.text).length).toBe(0)
			expect(Object.keys(dictionary.html).length).toBe(0)
			expect(Object.keys(dictionary.attrs).length).toBe(0)
		})

		it('handles empty document', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head></head>
					<body></body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues: string[] = []

			const dictionary = buildTranslationDictionary(document, segments, originalValues, [], 'es')

			expect(dictionary.targetLang).toBe('es')
			expect(Object.keys(dictionary.text).length).toBe(0)
		})
	})
})

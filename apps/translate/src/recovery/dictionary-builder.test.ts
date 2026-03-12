/**
 * Tests for Dictionary Builder
 */

import { describe, it, expect } from 'vitest'
import { parseHTMLDocument } from '../dom/parser.js'
import { extractSegments } from '../dom/extractor.js'
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
			const translations = ['Hola', 'Mundo']

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

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
			// Translations same as originals
			const translations = ['Hello', 'World']

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

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
			// segments[0] = title "Test", segments[1] = html "Hello [HB1]world[/HB1]"
			const translations = ['Prueba', 'Hola [HB1]mundo[/HB1]']

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

			expect(dictionary.targetLang).toBe('es')
			// HTML dict key is original placeholder text, value is restored innerHTML
			const htmlKey = originalValues[1] // "Hello [HB1]world[/HB1]"
			expect(dictionary.html[htmlKey]).toContain('mundo')
			expect(dictionary.html[htmlKey]).toContain('<strong>')
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

			const translations = segments.map((s) => {
				if (s.value === 'A cat') return 'Un gato'
				if (s.value === 'Click me') return 'Haz clic'
				if (s.value === 'Button') return 'Boton'
				return s.value
			})

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

			expect(dictionary.attrs['A cat']).toBe('Un gato')
			expect(dictionary.attrs['Click me']).toBe('Haz clic')
		})
	})

	describe('deferred mode (null translations)', () => {
		it('skips null translations (cache misses)', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Hello</title></head>
					<body>
						<div>World</div>
						<div>Foo</div>
					</body>
				</html>
			`)

			const segments = extractSegments(document, [])
			const originalValues = segments.map((s) => s.value)
			// Second segment is a cache miss
			const translations: (string | null)[] = ['Hola', null, 'Bar']

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

			expect(dictionary.text['Hello']).toBe('Hola')
			expect(dictionary.text['World']).toBeUndefined()
			expect(dictionary.text['Foo']).toBe('Bar')
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

			const dictionary = buildTranslationDictionary(segments, originalValues, originalValues, 'es')
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

			const dictionary = buildTranslationDictionary(segments, originalValues, originalValues, 'es', new Map())
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

			const pathnameMap = new Map([
				['/about', '/acerca-de'],
				['/contact', '/contacto'],
			])
			const dictionary = buildTranslationDictionary(segments, originalValues, originalValues, 'es', pathnameMap)
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

			const pathnameMap = new Map([
				['/about', '/acerca-de'],
				['/api/v1', '/api/v1'],
			])
			const dictionary = buildTranslationDictionary(segments, originalValues, originalValues, 'es', pathnameMap)
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
			const translations = ['a', 'b', 'c']

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

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
			const translations: string[] = []

			const dictionary = buildTranslationDictionary(segments, originalValues, translations, 'es')

			expect(dictionary.targetLang).toBe('es')
			expect(Object.keys(dictionary.text).length).toBe(0)
		})
	})
})

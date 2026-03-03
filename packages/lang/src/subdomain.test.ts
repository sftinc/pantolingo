import { describe, it, expect } from 'vitest'
import { deriveTranslationSubdomain } from './subdomain.js'

describe('deriveTranslationSubdomain', () => {
	it('extracts 2-char subtag from regional code', () => {
		expect(deriveTranslationSubdomain('es-mx')).toBe('es')
	})

	it('extracts subtag from another regional code', () => {
		expect(deriveTranslationSubdomain('fr-ca')).toBe('fr')
	})

	it('handles codes with script subtags (zh-hans)', () => {
		expect(deriveTranslationSubdomain('zh-hans')).toBe('zh')
	})

	it('handles 3-char subtags (fil-ph)', () => {
		expect(deriveTranslationSubdomain('fil-ph')).toBe('fil')
	})

	it('lowercases the result', () => {
		expect(deriveTranslationSubdomain('ES-MX')).toBe('es')
	})

	it('handles code with no region (bare subtag)', () => {
		expect(deriveTranslationSubdomain('en')).toBe('en')
	})
})

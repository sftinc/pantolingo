/**
 * Tests for Set-Cookie domain rewriting
 */

import { describe, it, expect } from 'vitest'
import { rewriteSetCookieDomain, rewriteSetCookieHeaders } from './cookies.js'

describe('rewriteSetCookieDomain', () => {
	describe('same apex — wildcard covers translated host', () => {
		it('skips .example.com when translated host is de.example.com', () => {
			const cookie = 'sid=abc; Domain=.example.com; Path=/'
			const result = rewriteSetCookieDomain(cookie, 'example.com', 'de.example.com', 'example.com')
			expect(result).toBe(cookie)
		})

		it('skips example.com (without dot) when translated host is de.example.com', () => {
			const cookie = 'sid=abc; Domain=example.com; Path=/'
			const result = rewriteSetCookieDomain(cookie, 'example.com', 'de.example.com', 'example.com')
			expect(result).toBe(cookie)
		})
	})

	describe('same apex — host-specific does not cover', () => {
		it('rewrites www.example.com to de.example.com', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; Domain=www.example.com; Path=/',
				'example.com',
				'de.example.com',
				'example.com'
			)
			expect(result).toBe('sid=abc; Domain=de.example.com; Path=/')
		})
	})

	describe('no Domain attribute', () => {
		it('returns cookie unchanged', () => {
			const cookie = 'sid=abc; Path=/; Secure; HttpOnly'
			const result = rewriteSetCookieDomain(cookie, 'example.com', 'de.example.com', 'example.com')
			expect(result).toBe(cookie)
		})
	})

	describe('different apex — apex cookie', () => {
		it('rewrites .example.com to .example.de', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; Domain=.example.com; Path=/',
				'example.com',
				'www.example.de',
				'example.de'
			)
			expect(result).toBe('sid=abc; Domain=.example.de; Path=/')
		})

		it('rewrites example.com (no dot) to example.de', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; Domain=example.com; Path=/',
				'example.com',
				'www.example.de',
				'example.de'
			)
			expect(result).toBe('sid=abc; Domain=example.de; Path=/')
		})
	})

	describe('different apex — host-specific cookie', () => {
		it('rewrites www.example.com to www.example.de', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; Domain=www.example.com; Path=/',
				'example.com',
				'www.example.de',
				'example.de'
			)
			expect(result).toBe('sid=abc; Domain=www.example.de; Path=/')
		})
	})

	describe('IP address / localhost', () => {
		it('skips rewriting when translated host is an IP', () => {
			const cookie = 'sid=abc; Domain=.example.com; Path=/'
			const result = rewriteSetCookieDomain(cookie, 'example.com', '127.0.0.1', null)
			expect(result).toBe(cookie)
		})

		it('skips rewriting when translated host is localhost', () => {
			const cookie = 'sid=abc; Domain=.example.com; Path=/'
			const result = rewriteSetCookieDomain(cookie, 'example.com', 'localhost', null)
			expect(result).toBe(cookie)
		})
	})

	describe('origin is apex itself', () => {
		it('skips when cookie domain equals translated apex and covers', () => {
			const cookie = 'sid=abc; Domain=example.com; Path=/'
			const result = rewriteSetCookieDomain(cookie, 'example.com', 'de.example.com', 'example.com')
			expect(result).toBe(cookie)
		})
	})

	describe('leading dot equivalence', () => {
		it('treats Domain=example.com and Domain=.example.com identically for coverage', () => {
			const withDot = rewriteSetCookieDomain(
				'sid=abc; Domain=.example.com; Path=/',
				'example.com', 'de.example.com', 'example.com'
			)
			const withoutDot = rewriteSetCookieDomain(
				'sid=abc; Domain=example.com; Path=/',
				'example.com', 'de.example.com', 'example.com'
			)
			// Both should skip (apex covers de.example.com)
			expect(withDot).toContain('Domain=.example.com')
			expect(withoutDot).toContain('Domain=example.com')
		})
	})

	describe('preserves other attributes', () => {
		it('only changes Domain, keeps Path, Secure, HttpOnly, SameSite', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; Domain=www.example.com; Path=/app; Secure; HttpOnly; SameSite=Lax',
				'example.com',
				'de.example.com',
				'example.com'
			)
			expect(result).toBe('sid=abc; Domain=de.example.com; Path=/app; Secure; HttpOnly; SameSite=Lax')
		})
	})

	describe('multiple Domain attributes', () => {
		it('uses the last Domain value per RFC 6265', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; Domain=ignored.com; Domain=www.example.com; Path=/',
				'example.com',
				'de.example.com',
				'example.com'
			)
			expect(result).toBe('sid=abc; Domain=ignored.com; Domain=de.example.com; Path=/')
		})
	})

	describe('case insensitivity', () => {
		it('handles DOMAIN attribute case-insensitively', () => {
			const result = rewriteSetCookieDomain(
				'sid=abc; DOMAIN=www.example.com; Path=/',
				'example.com',
				'de.example.com',
				'example.com'
			)
			expect(result).toBe('sid=abc; DOMAIN=de.example.com; Path=/')
		})
	})
})

describe('rewriteSetCookieHeaders', () => {
	it('rewrites an array of cookie strings', () => {
		const cookies = [
			'sid=abc; Domain=www.example.com; Path=/',
			'pref=dark; Path=/',
			'token=xyz; Domain=.example.com; Secure',
		]
		const result = rewriteSetCookieHeaders(cookies, {
			originApex: 'example.com',
			translatedHost: 'de.example.com',
			translatedApex: 'example.com',
		})
		expect(result).toEqual([
			'sid=abc; Domain=de.example.com; Path=/',
			'pref=dark; Path=/',
			'token=xyz; Domain=.example.com; Secure',
		])
	})

	it('returns empty array for empty input', () => {
		const result = rewriteSetCookieHeaders([], {
			originApex: 'example.com',
			translatedHost: 'de.example.com',
			translatedApex: 'example.com',
		})
		expect(result).toEqual([])
	})
})

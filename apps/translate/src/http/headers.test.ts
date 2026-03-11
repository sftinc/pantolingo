/**
 * Integration tests for prepareResponseHeaders with cookie rewriting
 */

import { describe, it, expect } from 'vitest'
import { prepareResponseHeaders } from './headers.js'

describe('prepareResponseHeaders', () => {
	function makeHeaders(entries: [string, string][]): Headers {
		const h = new Headers()
		for (const [k, v] of entries) {
			h.append(k, v)
		}
		return h
	}

	it('rewrites Set-Cookie domains when config is provided', () => {
		const origin = makeHeaders([
			['content-type', 'text/html'],
			['set-cookie', 'sid=abc; Domain=www.example.com; Path=/'],
			['set-cookie', 'pref=dark; Path=/'],
		])
		const result = prepareResponseHeaders(origin, {
			originApex: 'example.com',
			translatedHost: 'de.example.com',
			translatedApex: 'example.com',
		})
		expect(result['Set-Cookie']).toEqual([
			'sid=abc; Domain=de.example.com; Path=/',
			'pref=dark; Path=/',
		])
	})

	it('passes cookies through unchanged when no config provided', () => {
		const origin = makeHeaders([
			['set-cookie', 'sid=abc; Domain=www.example.com; Path=/'],
		])
		const result = prepareResponseHeaders(origin)
		expect(result['Set-Cookie']).toEqual([
			'sid=abc; Domain=www.example.com; Path=/',
		])
	})

	it('returns no Set-Cookie key when origin has no cookies', () => {
		const origin = makeHeaders([['content-type', 'text/html']])
		const result = prepareResponseHeaders(origin, {
			originApex: 'example.com',
			translatedHost: 'de.example.com',
			translatedApex: 'example.com',
		})
		expect(result['Set-Cookie']).toBeUndefined()
	})
})

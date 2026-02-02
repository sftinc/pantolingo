/**
 * Tests for Framework Detector
 */

import { describe, it, expect } from 'vitest'
import { parseHTMLDocument } from '../dom/parser.js'
import { detectSpaFramework } from './framework-detector.js'

describe('detectSpaFramework', () => {
	describe('Next.js detection', () => {
		it('detects Next.js by #__next container', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body>
						<div id="__next">Content</div>
					</body>
				</html>
			`)
			expect(detectSpaFramework(document)).toBe(true)
		})

		it('detects Next.js by __NEXT_DATA__ script', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head>
						<title>Test</title>
						<script id="__NEXT_DATA__" type="application/json">{"props":{}}</script>
					</head>
					<body>Content</body>
				</html>
			`)
			expect(detectSpaFramework(document)).toBe(true)
		})

		it('detects Next.js by /_next/ script sources', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head>
						<title>Test</title>
						<script src="/_next/static/chunks/main.js"></script>
					</head>
					<body>Content</body>
				</html>
			`)
			expect(detectSpaFramework(document)).toBe(true)
		})
	})

	describe('Nuxt/Vue detection', () => {
		it('detects Nuxt by #__nuxt container', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body>
						<div id="__nuxt">Content</div>
					</body>
				</html>
			`)
			expect(detectSpaFramework(document)).toBe(true)
		})

		it('detects Vue by data-v-* attributes', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body>
						<div data-v-abc123>Content</div>
					</body>
				</html>
			`)
			expect(detectSpaFramework(document)).toBe(true)
		})
	})

	describe('Gatsby detection', () => {
		it('detects Gatsby by #___gatsby container', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body>
						<div id="___gatsby">Content</div>
					</body>
				</html>
			`)
			expect(detectSpaFramework(document)).toBe(true)
		})
	})

	describe('React detection', () => {
		it('detects React by data-reactroot attribute', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body>
						<div data-reactroot>Content</div>
					</body>
				</html>
			`)
			expect(detectSpaFramework(document)).toBe(true)
		})
	})

	describe('Non-SPA pages', () => {
		it('returns false for static HTML', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head><title>Test</title></head>
					<body>
						<div>Just regular content</div>
					</body>
				</html>
			`)
			expect(detectSpaFramework(document)).toBe(false)
		})

		it('returns false for server-rendered pages without framework markers', () => {
			const { document } = parseHTMLDocument(`
				<!DOCTYPE html>
				<html>
					<head>
						<title>Test</title>
						<script src="/assets/main.js"></script>
					</head>
					<body>
						<div id="app">Content</div>
					</body>
				</html>
			`)
			expect(detectSpaFramework(document)).toBe(false)
		})

		it('returns false for invalid document', () => {
			// Create a document-like object without documentElement
			const fakeDoc = { documentElement: null } as unknown as Document
			expect(detectSpaFramework(fakeDoc)).toBe(false)
		})
	})
})

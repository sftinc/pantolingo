/**
 * Test: Pre tag whitespace preservation
 * Verifies that <pre> tags preserve line breaks while <p> tags normalize whitespace
 *
 * Run with: pnpm exec tsx test/pre-whitespace.ts
 */

import { parseHTML } from 'linkedom'
import { extractSegments } from '../apps/translate/src/fetch/dom-extractor.js'

interface TestCase {
	name: string
	html: string
	expected: {
		count: number
		values: string[]
	}
}

const testCases: TestCase[] = [
	{
		name: '1. Regular <p> tag - whitespace normalized',
		html: `<!DOCTYPE html><html><body><p>Hello
   world</p></body></html>`,
		expected: {
			count: 1,
			values: ['Hello world'],
		},
	},
	{
		name: '2. <pre> tag - whitespace preserved',
		html: `<!DOCTYPE html><html><body><pre>Line 1
Line 2
  Indented</pre></body></html>`,
		expected: {
			count: 1,
			values: ['Line 1\nLine 2\n  Indented'],
		},
	},
	{
		name: '3. <pre> with inline tags - placeholders + newlines',
		html: `<!DOCTYPE html><html><body><pre>Click <strong>here</strong>
for more</pre></body></html>`,
		expected: {
			count: 1,
			values: ['Click [HB1]here[/HB1]\nfor more'],
		},
	},
	{
		name: '4. <pre><code> - skipped (code in SKIP_TAGS)',
		html: `<!DOCTYPE html><html><body><pre><code>var x = 1;</code></pre></body></html>`,
		expected: {
			count: 0,
			values: [],
		},
	},
	{
		name: '5. Mixed <p> and <pre> in same doc',
		html: `<!DOCTYPE html><html><body><p>Normal
   text</p><pre>Preserved
  whitespace</pre></body></html>`,
		expected: {
			count: 2,
			values: ['Normal text', 'Preserved\n  whitespace'],
		},
	},
]

function runTests() {
	console.log('=== Pre Tag Whitespace Preservation Tests ===\n')

	let passed = 0
	let failed = 0

	for (const tc of testCases) {
		const { document } = parseHTML(tc.html)
		const segments = extractSegments(document)

		// Filter to just html and text kinds (ignore attrs)
		const contentSegments = segments.filter((s) => s.kind === 'html' || s.kind === 'text')

		const countMatch = contentSegments.length === tc.expected.count
		const valuesMatch =
			countMatch && contentSegments.every((s, i) => s.value === tc.expected.values[i])

		if (countMatch && valuesMatch) {
			console.log(`PASS: ${tc.name}`)
			passed++
		} else {
			console.log(`FAIL: ${tc.name}`)
			console.log(`  Expected count: ${tc.expected.count}, got: ${contentSegments.length}`)
			console.log(`  Expected values: ${JSON.stringify(tc.expected.values)}`)
			console.log(
				`  Got values: ${JSON.stringify(contentSegments.map((s) => s.value))}`
			)
			failed++
		}
	}

	console.log(`\n=== Results: ${passed} passed, ${failed} failed ===`)
	process.exit(failed > 0 ? 1 : 0)
}

runTests()

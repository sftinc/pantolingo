/**
 * Tests for pipeline helper functions
 */

import { describe, it, expect } from 'vitest'
import { matchSegmentsWithMap, type MatchResult } from './pipeline.js'
import type { Content } from './types.js'

// Helper to create a segment
function createSegment(value: string, kind: 'text' | 'html' | 'attr' = 'text'): Content {
	return { kind, value, ws: { leading: '', trailing: '' } }
}

describe('matchSegmentsWithMap', () => {
	describe('empty cache', () => {
		it('returns all segments as new when cache is empty', () => {
			const segments = [
				createSegment('Hello'),
				createSegment('World'),
				createSegment('Test'),
			]
			const cache = new Map<string, string>()

			const result = matchSegmentsWithMap(segments, cache)

			expect(result.cached.size).toBe(0)
			expect(result.newSegments.length).toBe(3)
			expect(result.newIndices).toEqual([0, 1, 2])
			expect(result.newSegments.map(s => s.value)).toEqual(['Hello', 'World', 'Test'])
		})

		it('handles empty segments array', () => {
			const segments: Content[] = []
			const cache = new Map<string, string>()

			const result = matchSegmentsWithMap(segments, cache)

			expect(result.cached.size).toBe(0)
			expect(result.newSegments.length).toBe(0)
			expect(result.newIndices).toEqual([])
		})
	})

	describe('full cache', () => {
		it('returns all segments as cached when all are in cache', () => {
			const segments = [
				createSegment('Hello'),
				createSegment('World'),
			]
			const cache = new Map<string, string>([
				['Hello', 'Hola'],
				['World', 'Mundo'],
			])

			const result = matchSegmentsWithMap(segments, cache)

			expect(result.cached.size).toBe(2)
			expect(result.cached.get(0)).toBe('Hola')
			expect(result.cached.get(1)).toBe('Mundo')
			expect(result.newSegments.length).toBe(0)
			expect(result.newIndices).toEqual([])
		})
	})

	describe('partial cache', () => {
		it('correctly separates cached and new segments', () => {
			const segments = [
				createSegment('Hello'),
				createSegment('New Text'),
				createSegment('World'),
				createSegment('Another New'),
			]
			const cache = new Map<string, string>([
				['Hello', 'Hola'],
				['World', 'Mundo'],
			])

			const result = matchSegmentsWithMap(segments, cache)

			// Cached: Hello (index 0), World (index 2)
			expect(result.cached.size).toBe(2)
			expect(result.cached.get(0)).toBe('Hola')
			expect(result.cached.get(2)).toBe('Mundo')

			// New: "New Text" (index 1), "Another New" (index 3)
			expect(result.newSegments.length).toBe(2)
			expect(result.newSegments.map(s => s.value)).toEqual(['New Text', 'Another New'])
			expect(result.newIndices).toEqual([1, 3])
		})

		it('preserves segment order in newIndices', () => {
			const segments = [
				createSegment('Cached1'),
				createSegment('New1'),
				createSegment('New2'),
				createSegment('Cached2'),
				createSegment('New3'),
			]
			const cache = new Map<string, string>([
				['Cached1', 'C1'],
				['Cached2', 'C2'],
			])

			const result = matchSegmentsWithMap(segments, cache)

			expect(result.newIndices).toEqual([1, 2, 4])
			expect(result.newSegments.map(s => s.value)).toEqual(['New1', 'New2', 'New3'])
		})
	})

	describe('different segment kinds', () => {
		it('matches segments regardless of kind', () => {
			const segments = [
				createSegment('Hello', 'text'),
				createSegment('World', 'html'),
				createSegment('Test', 'attr'),
			]
			const cache = new Map<string, string>([
				['Hello', 'Hola'],
				['Test', 'Prueba'],
			])

			const result = matchSegmentsWithMap(segments, cache)

			expect(result.cached.size).toBe(2)
			expect(result.cached.get(0)).toBe('Hola')
			expect(result.cached.get(2)).toBe('Prueba')
			expect(result.newSegments.length).toBe(1)
			expect(result.newSegments[0].value).toBe('World')
			expect(result.newSegments[0].kind).toBe('html')
		})
	})

	describe('edge cases', () => {
		it('handles segments with extra cache entries', () => {
			const segments = [
				createSegment('Hello'),
			]
			const cache = new Map<string, string>([
				['Hello', 'Hola'],
				['World', 'Mundo'],
				['Unused', 'No Usado'],
			])

			const result = matchSegmentsWithMap(segments, cache)

			expect(result.cached.size).toBe(1)
			expect(result.cached.get(0)).toBe('Hola')
			expect(result.newSegments.length).toBe(0)
		})

		it('handles duplicate segments', () => {
			const segments = [
				createSegment('Hello'),
				createSegment('Hello'),
				createSegment('World'),
			]
			const cache = new Map<string, string>([
				['Hello', 'Hola'],
			])

			const result = matchSegmentsWithMap(segments, cache)

			// Both "Hello" segments should be cached
			expect(result.cached.size).toBe(2)
			expect(result.cached.get(0)).toBe('Hola')
			expect(result.cached.get(1)).toBe('Hola')
			expect(result.newSegments.length).toBe(1)
			expect(result.newSegments[0].value).toBe('World')
		})
	})
})

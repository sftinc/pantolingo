import { describe, it, expect } from 'vitest'
import { applyPatterns, restorePatterns } from './skip-patterns.js'

describe('applyPatterns', () => {
	describe('Email [E]', () => {
		it('replaces simple email', () => {
			const result = applyPatterns('Contact user@example.com for help')
			expect(result.normalized).toBe('Contact [E1] for help')
			expect(result.replacements).toHaveLength(1)
			expect(result.replacements[0].pattern).toBe('email')
			expect(result.replacements[0].values).toEqual(['user@example.com'])
		})

		it('replaces email with subdomain', () => {
			const result = applyPatterns('Email admin@mail.company.co.uk')
			expect(result.normalized).toBe('Email [E1]')
			expect(result.replacements[0].values).toEqual(['admin@mail.company.co.uk'])
		})

		it('replaces email with plus sign', () => {
			const result = applyPatterns('Send to user+tag@example.com')
			expect(result.normalized).toBe('Send to [E1]')
			expect(result.replacements[0].values).toEqual(['user+tag@example.com'])
		})

		it('replaces multiple emails', () => {
			const result = applyPatterns('From a@b.com to c@d.org')
			expect(result.normalized).toBe('From [E1] to [E2]')
			expect(result.replacements[0].values).toEqual(['a@b.com', 'c@d.org'])
		})
	})

	describe('UUID [I]', () => {
		it('replaces lowercase UUID', () => {
			const result = applyPatterns('ID: 550e8400-e29b-41d4-a716-446655440000')
			expect(result.normalized).toBe('ID: [I1]')
			expect(result.replacements).toContainEqual({
				pattern: 'uuid',
				placeholder: '[I',
				values: ['550e8400-e29b-41d4-a716-446655440000'],
			})
		})

		it('replaces uppercase UUID', () => {
			const result = applyPatterns('ID: 550E8400-E29B-41D4-A716-446655440000')
			expect(result.normalized).toBe('ID: [I1]')
			expect(result.replacements).toContainEqual({
				pattern: 'uuid',
				placeholder: '[I',
				values: ['550E8400-E29B-41D4-A716-446655440000'],
			})
		})

		it('replaces UUID in parentheses', () => {
			const result = applyPatterns('Item (123e4567-e89b-12d3-a456-426614174000) found')
			expect(result.normalized).toBe('Item ([I1]) found')
		})

		it('replaces multiple UUIDs', () => {
			const result = applyPatterns('From 11111111-1111-1111-1111-111111111111 to 22222222-2222-2222-2222-222222222222')
			expect(result.normalized).toBe('From [I1] to [I2]')
		})
	})

	describe('URL [U]', () => {
		it('replaces http URL', () => {
			const result = applyPatterns('Visit http://example.com')
			expect(result.normalized).toBe('Visit [U1]')
			expect(result.replacements).toContainEqual({
				pattern: 'url',
				placeholder: '[U',
				values: ['http://example.com'],
			})
		})

		it('replaces https URL', () => {
			const result = applyPatterns('Visit https://example.com')
			expect(result.normalized).toBe('Visit [U1]')
			expect(result.replacements[0].values).toEqual(['https://example.com'])
		})

		it('replaces bare domain without protocol', () => {
			const result = applyPatterns('Visit example.com for more info')
			expect(result.normalized).toBe('Visit [U1] for more info')
			expect(result.replacements[0].values).toEqual(['example.com'])
		})

		it('replaces bare domain with path', () => {
			const result = applyPatterns('Check docs.example.com/guide')
			expect(result.normalized).toBe('Check [U1]')
			expect(result.replacements[0].values).toEqual(['docs.example.com/guide'])
		})

		it('does not extract domain from email address', () => {
			const result = applyPatterns('Contact user@example.com for help')
			// Should capture as email, not URL - the domain should NOT be extracted
			expect(result.normalized).toBe('Contact [E1] for help')
			expect(result.replacements).toHaveLength(1)
			expect(result.replacements[0].pattern).toBe('email')
		})

		it('handles email and bare domain in same text', () => {
			const result = applyPatterns('Email user@test.com or visit example.com')
			expect(result.normalized).toBe('Email [E1] or visit [U1]')
			expect(result.replacements.find(r => r.pattern === 'url')?.values).toEqual(['example.com'])
			expect(result.replacements.find(r => r.pattern === 'email')?.values).toEqual(['user@test.com'])
		})

		it('replaces URL with path and query', () => {
			const result = applyPatterns('See https://example.com/path?query=value')
			expect(result.normalized).toBe('See [U1]')
			expect(result.replacements[0].values).toEqual(['https://example.com/path?query=value'])
		})

		it('strips trailing period from URL', () => {
			const result = applyPatterns('Check https://example.com.')
			expect(result.normalized).toBe('Check [U1].')
			expect(result.replacements[0].values).toEqual(['https://example.com'])
		})

		it('strips trailing comma from URL', () => {
			const result = applyPatterns('See https://a.com, https://b.com.')
			expect(result.normalized).toBe('See [U1], [U2].')
			expect(result.replacements[0].values).toEqual(['https://a.com', 'https://b.com'])
		})

		it('strips trailing period from bare domain', () => {
			const result = applyPatterns('Visit example.com.')
			expect(result.normalized).toBe('Visit [U1].')
			expect(result.replacements[0].values).toEqual(['example.com'])
		})

		it('replaces localhost URL', () => {
			const result = applyPatterns('Dev at http://localhost:3000/api')
			expect(result.normalized).toBe('Dev at [U1]')
			expect(result.replacements[0].values).toEqual(['http://localhost:3000/api'])
		})

		it('replaces IP address URL', () => {
			const result = applyPatterns('Server at http://192.168.1.1:8080')
			expect(result.normalized).toBe('Server at [U1]')
			expect(result.replacements[0].values).toEqual(['http://192.168.1.1:8080'])
		})
	})

	describe('Numeric [N]', () => {
		it('replaces integers', () => {
			const result = applyPatterns('Total: 42 items')
			expect(result.normalized).toBe('Total: [N1] items')
			expect(result.replacements).toContainEqual({
				pattern: 'numeric',
				placeholder: '[N',
				values: ['42'],
			})
		})

		it('replaces decimals', () => {
			const result = applyPatterns('Price: $19.99')
			expect(result.normalized).toBe('Price: $[N1]')
			expect(result.replacements[0].values).toEqual(['19.99'])
		})

		it('replaces formatted numbers', () => {
			const result = applyPatterns('Population: 1,234,567')
			expect(result.normalized).toBe('Population: [N1]')
			expect(result.replacements[0].values).toEqual(['1,234,567'])
		})
	})

	describe('Context parameter', () => {
		it('segment context extracts URLs', () => {
			const result = applyPatterns('See https://example.com', 'segment')
			expect(result.normalized).toBe('See [U1]')
			expect(result.replacements.some(r => r.pattern === 'url')).toBe(true)
		})

		it('path context skips URL extraction', () => {
			const result = applyPatterns('/user/user@example.com/profile', 'path')
			// Should extract email but not try to extract URLs
			expect(result.normalized).toBe('/user/[E1]/profile')
			expect(result.replacements.some(r => r.pattern === 'url')).toBe(false)
		})

		it('path context extracts emails', () => {
			const result = applyPatterns('/contact/support@company.com', 'path')
			expect(result.normalized).toBe('/contact/[E1]')
			expect(result.replacements[0].pattern).toBe('email')
		})

		it('path context extracts UUIDs', () => {
			const result = applyPatterns('/item/550e8400-e29b-41d4-a716-446655440000', 'path')
			expect(result.normalized).toBe('/item/[I1]')
			expect(result.replacements[0].pattern).toBe('uuid')
		})

		it('path context extracts numbers', () => {
			const result = applyPatterns('/page/123/edit', 'path')
			expect(result.normalized).toBe('/page/[N1]/edit')
			expect(result.replacements[0].pattern).toBe('numeric')
		})
	})

	describe('Processing order', () => {
		it('URL with embedded email captures entire URL (segment context)', () => {
			const result = applyPatterns('Link: https://example.com/contact?email=user@test.com', 'segment')
			expect(result.normalized).toBe('Link: [U1]')
			// Email should NOT be separately extracted since it's part of the URL
			expect(result.replacements.some(r => r.pattern === 'email')).toBe(false)
			expect(result.replacements[0].values[0]).toContain('user@test.com')
		})

		it('URL with embedded UUID captures entire URL (segment context)', () => {
			const result = applyPatterns('View https://api.com/item/550e8400-e29b-41d4-a716-446655440000', 'segment')
			expect(result.normalized).toBe('View [U1]')
			// UUID should NOT be separately extracted since it's part of the URL
			expect(result.replacements.some(r => r.pattern === 'uuid')).toBe(false)
		})

		it('email before numeric prevents partial email extraction', () => {
			// user123 should not become user[N1] before email extraction
			const result = applyPatterns('Email user123@example.com')
			expect(result.normalized).toBe('Email [E1]')
			expect(result.replacements[0].values).toEqual(['user123@example.com'])
		})
	})

	describe('Mixed patterns', () => {
		it('handles email, UUID, and number together', () => {
			const result = applyPatterns(
				'Order 12345 by admin@shop.com: 550e8400-e29b-41d4-a716-446655440000'
			)
			expect(result.normalized).toBe('Order [N1] by [E1]: [I1]')
			expect(result.replacements).toHaveLength(3)
		})

		it('handles URL, email, UUID, and number in segment', () => {
			const result = applyPatterns(
				'Check https://example.com - contact@test.com - 550e8400-e29b-41d4-a716-446655440000 - ref 999',
				'segment'
			)
			expect(result.normalized).toBe('Check [U1] - [E1] - [I1] - ref [N1]')
		})
	})

	describe('Uppercase detection', () => {
		it('detects all uppercase text', () => {
			const result = applyPatterns('ORDER 12345 CONFIRMED')
			expect(result.isUpperCase).toBe(true)
		})

		it('detects mixed case text', () => {
			const result = applyPatterns('Order 12345 confirmed')
			expect(result.isUpperCase).toBe(false)
		})
	})
})

describe('restorePatterns', () => {
	it('restores email placeholder', () => {
		const replacements = [
			{ pattern: 'email' as const, placeholder: '[E', values: ['user@example.com'] },
		]
		const result = restorePatterns('Contact [E1] for help', replacements)
		expect(result).toBe('Contact user@example.com for help')
	})

	it('restores UUID placeholder', () => {
		const replacements = [
			{ pattern: 'uuid' as const, placeholder: '[I', values: ['550e8400-e29b-41d4-a716-446655440000'] },
		]
		const result = restorePatterns('ID: [I1]', replacements)
		expect(result).toBe('ID: 550e8400-e29b-41d4-a716-446655440000')
	})

	it('restores URL placeholder', () => {
		const replacements = [
			{ pattern: 'url' as const, placeholder: '[U', values: ['https://example.com'] },
		]
		const result = restorePatterns('Visit [U1]', replacements)
		expect(result).toBe('Visit https://example.com')
	})

	it('restores numeric placeholder', () => {
		const replacements = [
			{ pattern: 'numeric' as const, placeholder: '[N', values: ['42'] },
		]
		const result = restorePatterns('Total: [N1] items', replacements)
		expect(result).toBe('Total: 42 items')
	})

	it('restores multiple placeholder types', () => {
		const replacements = [
			{ pattern: 'url' as const, placeholder: '[U', values: ['https://example.com'] },
			{ pattern: 'email' as const, placeholder: '[E', values: ['user@test.com'] },
			{ pattern: 'uuid' as const, placeholder: '[I', values: ['12345678-1234-1234-1234-123456789012'] },
			{ pattern: 'numeric' as const, placeholder: '[N', values: ['100'] },
		]
		const result = restorePatterns(
			'See [U1], email [E1], id [I1], count [N1]',
			replacements
		)
		expect(result).toBe('See https://example.com, email user@test.com, id 12345678-1234-1234-1234-123456789012, count 100')
	})

	it('applies uppercase formatting when original was uppercase', () => {
		const replacements = [
			{ pattern: 'numeric' as const, placeholder: '[N', values: ['42'] },
		]
		const result = restorePatterns('total: [N1] items', replacements, true)
		expect(result).toBe('TOTAL: 42 ITEMS')
	})

	it('handles empty replacements array', () => {
		const result = restorePatterns('No placeholders here', [])
		expect(result).toBe('No placeholders here')
	})

	it('roundtrip: apply then restore', () => {
		const original = 'Contact admin@shop.com about order 12345 at https://shop.com/orders/550e8400-e29b-41d4-a716-446655440000'
		const { normalized, replacements, isUpperCase } = applyPatterns(original)

		// Simulate translation (just return normalized for this test)
		const translated = normalized

		const restored = restorePatterns(translated, replacements, isUpperCase)
		expect(restored).toBe(original)
	})
})

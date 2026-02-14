import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
	requireAccountId: vi.fn().mockResolvedValue(1),
}))

vi.mock('@pantolingo/db', () => ({
	canAccessWebsite: vi.fn().mockResolvedValue(true),
	updateSegmentTranslation: vi.fn().mockResolvedValue({ success: true }),
	updatePathTranslation: vi.fn().mockResolvedValue({ success: true }),
}))

import { saveSegmentTranslation, savePathTranslation } from './translations.js'
import { updateSegmentTranslation, updatePathTranslation } from '@pantolingo/db'

const mockUpdateSegment = updateSegmentTranslation as ReturnType<typeof vi.fn>
const mockUpdatePath = updatePathTranslation as ReturnType<typeof vi.fn>

beforeEach(() => {
	vi.clearAllMocks()
	mockUpdateSegment.mockResolvedValue({ success: true })
	mockUpdatePath.mockResolvedValue({ success: true })
})

describe('saveSegmentTranslation', () => {
	it('trims the translation text', async () => {
		await saveSegmentTranslation(1, 10, 'es', '  Hola mundo  ', true)

		expect(mockUpdateSegment).toHaveBeenCalledWith(1, 10, 'es', 'Hola mundo', true, 1)
	})

	it('rejects empty text after trimming', async () => {
		const result = await saveSegmentTranslation(1, 10, 'es', '   ', true)

		expect(result).toEqual({ success: false, error: 'Translation text is required' })
		expect(mockUpdateSegment).not.toHaveBeenCalled()
	})

	it('rejects empty string', async () => {
		const result = await saveSegmentTranslation(1, 10, 'es', '', true)

		expect(result).toEqual({ success: false, error: 'Translation text is required' })
		expect(mockUpdateSegment).not.toHaveBeenCalled()
	})
})

describe('savePathTranslation', () => {
	it('trims the translation text', async () => {
		await savePathTranslation(1, 20, 'es', '  /acerca-de  ', true)

		expect(mockUpdatePath).toHaveBeenCalledWith(1, 20, 'es', '/acerca-de', true, 1)
	})

	it('rejects empty text after trimming', async () => {
		const result = await savePathTranslation(1, 20, 'es', '   ', true)

		expect(result).toEqual({ success: false, error: 'Translation text is required' })
		expect(mockUpdatePath).not.toHaveBeenCalled()
	})

	it('rejects empty string', async () => {
		const result = await savePathTranslation(1, 20, 'es', '', true)

		expect(result).toEqual({ success: false, error: 'Translation text is required' })
		expect(mockUpdatePath).not.toHaveBeenCalled()
	})
})

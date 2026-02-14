import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
	requireAccountId: vi.fn().mockResolvedValue(1),
}))

vi.mock('@pantolingo/db', () => ({
	canAccessWebsite: vi.fn().mockResolvedValue(true),
	updateWebsiteSettings: vi.fn().mockResolvedValue({ success: true }),
	enableDevMode: vi.fn(),
}))

vi.mock('@pantolingo/lang', () => ({
	SUPPORTED_LANGUAGES: ['en', 'es', 'fr'],
}))

import { saveWebsiteSettings } from './website.js'
import { updateWebsiteSettings as dbUpdateWebsiteSettings } from '@pantolingo/db'

const mockDbUpdate = dbUpdateWebsiteSettings as ReturnType<typeof vi.fn>

beforeEach(() => {
	vi.clearAllMocks()
	mockDbUpdate.mockResolvedValue({ success: true })
})

describe('saveWebsiteSettings', () => {
	const baseSettings = {
		name: 'My Site',
		sourceLang: 'en',
		skipWords: [],
		skipPath: [],
		skipSelectors: [],
		translatePath: false,
	}

	it('trims the name before validation and DB call', async () => {
		await saveWebsiteSettings(1, { ...baseSettings, name: '  My Site  ' })

		expect(mockDbUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
			name: 'My Site',
		}))
	})

	it('rejects empty name after trimming', async () => {
		const result = await saveWebsiteSettings(1, { ...baseSettings, name: '   ' })

		expect(result).toEqual({ success: false, error: 'Name is required' })
		expect(mockDbUpdate).not.toHaveBeenCalled()
	})

	it('trims items in skipWords array', async () => {
		await saveWebsiteSettings(1, {
			...baseSettings,
			skipWords: ['  word1  ', ' word2 '],
		})

		expect(mockDbUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
			skipWords: ['word1', 'word2'],
		}))
	})

	it('filters empty strings from skipWords after trimming', async () => {
		await saveWebsiteSettings(1, {
			...baseSettings,
			skipWords: ['word1', '   ', '', 'word2'],
		})

		expect(mockDbUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
			skipWords: ['word1', 'word2'],
		}))
	})

	it('trims items in skipPath array', async () => {
		await saveWebsiteSettings(1, {
			...baseSettings,
			skipPath: ['  /admin  ', ' /api '],
		})

		expect(mockDbUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
			skipPath: ['/admin', '/api'],
		}))
	})

	it('filters empty strings from skipPath after trimming', async () => {
		await saveWebsiteSettings(1, {
			...baseSettings,
			skipPath: ['/admin', '  ', ''],
		})

		expect(mockDbUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
			skipPath: ['/admin'],
		}))
	})

	it('trims items in skipSelectors array', async () => {
		await saveWebsiteSettings(1, {
			...baseSettings,
			skipSelectors: ['  .nav  ', ' #footer '],
		})

		expect(mockDbUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
			skipSelectors: ['.nav', '#footer'],
		}))
	})

	it('filters empty strings from skipSelectors after trimming', async () => {
		await saveWebsiteSettings(1, {
			...baseSettings,
			skipSelectors: ['.nav', '   ', ''],
		})

		expect(mockDbUpdate).toHaveBeenCalledWith(1, expect.objectContaining({
			skipSelectors: ['.nav'],
		}))
	})
})

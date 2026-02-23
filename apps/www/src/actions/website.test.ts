import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies
vi.mock('@/lib/auth', () => ({
	requireAccountId: vi.fn().mockResolvedValue(1),
}))

vi.mock('@pantolingo/db', () => ({
	canAccessWebsite: vi.fn().mockResolvedValue(true),
	updateGeneralSettings: vi.fn().mockResolvedValue({ success: true }),
	updateTranslationSettings: vi.fn().mockResolvedValue({ success: true }),
	enableDevMode: vi.fn(),
}))

vi.mock('@pantolingo/lang', () => ({
	SUPPORTED_LANGUAGES: ['en', 'es', 'fr'],
}))

import { saveGeneralSettings, saveTranslationSettings } from './website.js'
import { updateGeneralSettings as dbUpdateGeneralSettings, updateTranslationSettings as dbUpdateTranslationSettings } from '@pantolingo/db'

const mockDbUpdateGeneral = dbUpdateGeneralSettings as ReturnType<typeof vi.fn>
const mockDbUpdateTranslation = dbUpdateTranslationSettings as ReturnType<typeof vi.fn>

beforeEach(() => {
	vi.clearAllMocks()
	mockDbUpdateGeneral.mockResolvedValue({ success: true })
	mockDbUpdateTranslation.mockResolvedValue({ success: true })
})

describe('saveGeneralSettings', () => {
	const baseSettings = {
		name: 'My Site',
		sourceLang: 'en',
		uiColor: null as string | null,
	}

	it('trims the name before validation and DB call', async () => {
		await saveGeneralSettings(1, { ...baseSettings, name: '  My Site  ' })

		expect(mockDbUpdateGeneral).toHaveBeenCalledWith(1, expect.objectContaining({
			name: 'My Site',
		}))
	})

	it('rejects empty name after trimming', async () => {
		const result = await saveGeneralSettings(1, { ...baseSettings, name: '   ' })

		expect(result).toEqual({ success: false, error: 'Name is required' })
		expect(mockDbUpdateGeneral).not.toHaveBeenCalled()
	})

	it('passes valid uiColor through to DB', async () => {
		await saveGeneralSettings(1, { ...baseSettings, uiColor: 'blue' })

		expect(mockDbUpdateGeneral).toHaveBeenCalledWith(1, expect.objectContaining({
			uiColor: 'blue',
		}))
	})

	it('passes null uiColor (auto) through to DB', async () => {
		await saveGeneralSettings(1, { ...baseSettings, uiColor: null })

		expect(mockDbUpdateGeneral).toHaveBeenCalledWith(1, expect.objectContaining({
			uiColor: null,
		}))
	})

	it('rejects invalid uiColor string', async () => {
		const result = await saveGeneralSettings(1, { ...baseSettings, uiColor: 'neon' })

		expect(result).toEqual({ success: false, error: 'Invalid accent color' })
		expect(mockDbUpdateGeneral).not.toHaveBeenCalled()
	})
})

describe('saveTranslationSettings', () => {
	const baseSettings = {
		skipWords: [] as string[],
		skipPath: [] as string[],
		skipSelectors: [] as string[],
		translatePath: false,
	}

	it('trims items in skipWords array', async () => {
		await saveTranslationSettings(1, {
			...baseSettings,
			skipWords: ['  word1  ', ' word2 '],
		})

		expect(mockDbUpdateTranslation).toHaveBeenCalledWith(1, expect.objectContaining({
			skipWords: ['word1', 'word2'],
		}))
	})

	it('filters empty strings from skipWords after trimming', async () => {
		await saveTranslationSettings(1, {
			...baseSettings,
			skipWords: ['word1', '   ', '', 'word2'],
		})

		expect(mockDbUpdateTranslation).toHaveBeenCalledWith(1, expect.objectContaining({
			skipWords: ['word1', 'word2'],
		}))
	})

	it('trims items in skipPath array', async () => {
		await saveTranslationSettings(1, {
			...baseSettings,
			skipPath: ['  /admin  ', ' /api '],
		})

		expect(mockDbUpdateTranslation).toHaveBeenCalledWith(1, expect.objectContaining({
			skipPath: ['/admin', '/api'],
		}))
	})

	it('filters empty strings from skipPath after trimming', async () => {
		await saveTranslationSettings(1, {
			...baseSettings,
			skipPath: ['/admin', '  ', ''],
		})

		expect(mockDbUpdateTranslation).toHaveBeenCalledWith(1, expect.objectContaining({
			skipPath: ['/admin'],
		}))
	})

	it('trims items in skipSelectors array', async () => {
		await saveTranslationSettings(1, {
			...baseSettings,
			skipSelectors: ['  .nav  ', ' #footer '],
		})

		expect(mockDbUpdateTranslation).toHaveBeenCalledWith(1, expect.objectContaining({
			skipSelectors: ['.nav', '#footer'],
		}))
	})

	it('filters empty strings from skipSelectors after trimming', async () => {
		await saveTranslationSettings(1, {
			...baseSettings,
			skipSelectors: ['.nav', '   ', ''],
		})

		expect(mockDbUpdateTranslation).toHaveBeenCalledWith(1, expect.objectContaining({
			skipSelectors: ['.nav'],
		}))
	})
})

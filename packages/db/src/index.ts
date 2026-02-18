/**
 * Database module re-exports
 */

export { pool, testConnection, closePool } from './pool.js'
export { hashText } from './utils/hash.js'
export { getWebsiteLanguageConfig, clearWebsiteLanguageCache, type WebsiteLanguageConfig } from './website-language.js'
export {
	batchGetTranslations,
	batchUpsertTranslations,
	batchGetTranslationIds,
	batchGetWebsiteSegmentIds,
	batchGetTranslationsByHash,
	type TranslationItem,
} from './segments.js'
export { linkPathSegments } from './junctions.js'
export {
	getWebsitePathId,
	lookupPathname,
	batchLookupPathnames,
	batchUpsertPathnames,
	type PathnameResult,
	type PathnameMapping,
	type PathIds,
} from './paths.js'
export { recordPageView, updateSegmentLastUsed, updatePathLastUsed } from './views.js'
export {
	canAccessWebsite,
	canAccessWebsiteByPublicCode,
	getWebsitesWithStats,
	getWebsiteByPublicCode,
	getLangsForWebsite,
	isValidLangForWebsite,
	getPathsForWebsite,
	getSegmentsForLang,
	getPathsForLang,
	updateWebsiteActivity,
	getLastLang,
	getMostRecentWebsite,
	updateSegmentTranslation,
	updatePathTranslation,
	updateWebsiteSettings,
	isHostnameTaken,
	createWebsiteWithLanguage,
	enableDevMode,
	getAccountProfile,
	updateAccountProfile,
	getAccountPasswordHash,
	changeAccountPassword,
	type AccountProfile,
	type WebsiteWithStats,
	type LangWithStats,
	type SegmentWithTranslation,
	type PathWithTranslation,
	type PaginatedResult,
	type Website,
	type WebsiteWithSettings,
	type PathOption,
	type ChangelogType,
	type ChangelogItem,
	type ChangelogChange,
} from './dashboard.js'
export { recordLlmUsage } from './usage.js'
export type { LlmFeature, TokenUsage, LlmUsageRecord } from './types.js'

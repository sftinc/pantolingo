/**
 * Database module re-exports
 */

export { pool, testConnection, closePool } from './pool.js'
export { hashText } from './utils/hash.js'
export { getHostConfig, clearHostCache, type HostConfig } from './host.js'
export {
	batchGetTranslations,
	batchUpsertTranslations,
	batchGetTranslationIds,
	batchGetWebsiteSegmentIds,
	type TranslationItem,
} from './segments.js'
export { linkPathnameTranslations, linkPathSegments } from './junctions.js'
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
	getWebsitesWithStats,
	getWebsiteById,
	getLangsForWebsite,
	isValidLangForWebsite,
	getPathsForWebsite,
	getSegmentsForLang,
	getPathsForLang,
	updateSegmentTranslation,
	updatePathTranslation,
	markSegmentReviewed,
	markPathReviewed,
	type WebsiteWithStats,
	type LangWithStats,
	type SegmentWithTranslation,
	type PathWithTranslation,
	type PaginatedResult,
	type Website,
	type PathOption,
} from './dashboard.js'

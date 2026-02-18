/**
 * @pantolingo/lang - Shared language utilities for Pantolingo apps.
 *
 * Provides language metadata using BCP 47 regional codes with Intl.DisplayNames
 * for localized display names.
 */

// Types
export type { LanguageData } from './data.js'
export type { LanguageInfo } from './info.js'
export type { CountryInfo } from './lookup.js'

// Static data
export { LANGUAGE_DATA } from './data.js'

// Info functions (Intl.DisplayNames)
export { getLanguageInfo, getLanguageOptions, getLanguageName, getLanguageLabel, getFlag, normalizeLangCode, countryCodeToFlag } from './info.js'

// Lookup functions
export { getLanguagesForRegion, getLanguagesForCountry, getCountriesForLanguage, isRtlLanguage } from './lookup.js'

// Subdomain utilities
export { deriveTranslationSubdomain } from './subdomain.js'

// Derived constants
import { LANGUAGE_DATA } from './data.js'

/** All supported BCP 47 language codes */
export const SUPPORTED_LANGUAGES: string[] = LANGUAGE_DATA.map((lang) => lang.code)

/** RTL language codes */
export const RTL_LANGUAGES: string[] = LANGUAGE_DATA.filter((lang) => lang.rtl).map((lang) => lang.code)

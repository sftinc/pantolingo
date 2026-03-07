# Add Language to Existing Website — Design

**Date:** 2026-03-06

## Summary

Enable users to add new translation languages to an existing website from the Settings > Setup tab. Currently the "Add Language" button is disabled with "Coming soon".

## Design

**Modal:** Opens from "Add Language" button. Uses `LanguageDropdown` + removable pills (same pattern as wizard Step 4). Filtered by subtag to exclude source lang, existing languages, and already-selected-in-modal languages. "Add" button submits all at once.

**Server action** `addLanguagesToWebsite(websiteId, targetLangs: string[])`:
1. Auth + access check
2. Fetch website's `apex` from DB
3. Generate hostnames: `deriveTranslationSubdomain(lang) + '.' + apex` per language
4. Insert `website_language` rows
5. Register hostnames with Perfprox (async, non-blocking)
6. Return new language data array

**After success:** Modal closes, new language cards appear in the Setup tab list with `pending` DNS status.

## Key Files

| File | Change |
|------|--------|
| `packages/db/src/dashboard.ts` | New `insertWebsiteLanguages()` function |
| `apps/www/src/actions/website.ts` | New `addLanguagesToWebsite()` server action |
| `apps/www/src/components/account/SettingsSetupTab.tsx` | Add Language modal with dropdown + pills |

Plan Name: 2026-03-06-add-language-design.md

# PAN-55 Phases C-H: public_code + hostname conflicts

**Date:** 2026-03-03
**Issue:** PAN-55 — Website wizard: fix DB constraint gaps
**Branch:** `wwilliams/pan-55-website-wizard-fix-db-constraint-gaps`

## Context

Phases A (name length) and B (2-char subtag hostnames) are complete. Six phases remain, covering two concerns:

1. **Phase C** — Remove redundant app-side `public_code` generation; rely on DB trigger
2. **Phases D-H** — Hostname conflict detection and resolution across creation, verification, and settings

## Phase C: Remove app-side public_code generation

**Goal:** Stop generating `publicCode` in app code; let the existing DB trigger `set_website_public_code` handle it.

### Changes

| File | Change |
|------|--------|
| `packages/db/src/dashboard.ts` | `createWebsiteWithLanguage()`: remove `publicCode` param, drop from INSERT, `RETURNING id, public_code`, return DB-generated value |
| `apps/www/src/actions/onboard.ts` | `createWebsite()`: remove `import crypto`, remove `crypto.randomBytes(8)` call, use DB return value |

### Why

The DB trigger `generate_website_public_code()` has collision retry (3 attempts) and a fallback using the row ID. The app-side `crypto.randomBytes(8)` bypasses this safety net.

## Phase D: Hostname conflicts — DB layer

**Goal:** Activate the existing partial unique index `website_language_hostname_active_unique` and add functions for conflict detection and hostname editing.

### Changes

| File | Change |
|------|--------|
| `packages/db/src/dashboard.ts` | `updateDnsStatus()`: when `status === 'active'`, also `SET verified_at = NOW()`. Catch PG `23505` → `{ success: false, error: 'hostname already claimed' }` |
| `packages/db/src/dashboard.ts` | New `isTranslationHostnameClaimed(hostnames: string[])`: query for rows where `verified_at IS NOT NULL AND removed_at IS NULL`. Returns claimed hostnames. |
| `packages/db/src/dashboard.ts` | New `updateWebsiteLanguageHostname(websiteLanguageId, newHostname)`: UPDATE hostname WHERE `verified_at IS NULL`. Returns success/error. |
| `packages/db/src/index.ts` | Export new functions |

### Strategy

Allow duplicate hostnames at creation (so bad actors can't block legitimate owners). Block at verification time via the partial unique index.

## Phase E: Hostname conflicts — DB type

**Goal:** Expose `verified_at` to frontend so components know whether a hostname is editable.

### Changes

| File | Change |
|------|--------|
| `packages/db/src/dashboard.ts` | Add `verifiedAt: Date | null` to `LanguageWithDnsStatus` |
| `packages/db/src/dashboard.ts` | Update `getLanguagesWithDnsStatus()` to SELECT and map `verified_at` |

## Phase F: Hostname conflicts — Server actions

**Goal:** Wire up conflict detection and hostname editing through authenticated server actions.

### Changes

| File | Change |
|------|--------|
| `apps/www/src/actions/website.ts` | `checkDnsStatus()`: handle `updateDnsStatus()` error return, surface "hostname already claimed" message |
| `apps/www/src/actions/website.ts` | New `updateLanguageHostname(websiteId, websiteLanguageId, newHostname)`: auth + access check, validate format, call DB function |
| `apps/www/src/actions/onboard.ts` | `createWebsite()`: after deriving hostnames, call `isTranslationHostnameClaimed()`. If claimed, return warning (still allow creation) |

## Phase G: Hostname conflicts — Wizard UI

**Goal:** Show derived translation hostnames in Step 5 review and flag conflicts.

### Changes

| File | Change |
|------|--------|
| `WebsiteWizardModal.tsx` | Step 5: show derived hostname next to each language (compute client-side via `deriveTranslationSubdomain(lang) + '.' + apex`) |
| `WebsiteWizardModal.tsx` | If `createWebsite()` returns hostname warnings, show warning badges on affected languages |

## Phase H: Hostname conflicts — Settings UI

**Goal:** Let users edit unverified hostnames to resolve conflicts.

### Changes

| File | Change |
|------|--------|
| `LanguageCard.tsx` | When `verifiedAt` is null: editable hostname input + save button calling `updateLanguageHostname()`. When set: read-only with verified badge. |
| `SettingsLanguagesTab.tsx` | Pass `verifiedAt` through to `LanguageCard` (automatic via type update from Phase E) |

## Files affected (all phases)

| File | Phases |
|------|--------|
| `packages/db/src/dashboard.ts` | C, D, E |
| `packages/db/src/index.ts` | D |
| `apps/www/src/actions/onboard.ts` | C, F |
| `apps/www/src/actions/website.ts` | F |
| `apps/www/src/components/account/WebsiteWizardModal.tsx` | G |
| `apps/www/src/components/account/LanguageCard.tsx` | H |
| `apps/www/src/components/account/SettingsLanguagesTab.tsx` | H |

Plan Name: 2026-03-03-pan-55-phases-c-h-design.md

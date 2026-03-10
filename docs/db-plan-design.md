# Pantolingo Subscription Plans

## Overview

Subscription plans are account-level, with a shared resource pool across all websites owned by the account. One plan per account, stored directly on the `account` table. Billing via Stripe — see [db-stripe-design.md](db-stripe-design.md).

## Design Decisions

- **Plan attaches to**: Account (not per-website) via `account.plan_code`
- **Resource distribution**: Shared pool — words, languages, and websites are shared across all account websites
- **Word quota basis**: Total translated words stored (cumulative sum of `translation_segment.word_count` + `translation_path.word_count`)
- **One plan per account**: No stacking multiple plans
- **Plans are dynamic**: Managed via admin UI, not hardcoded
- **Feature flags**: Explicit boolean columns on the plan table (not implicit by tier rank)
- **Currency**: USD
- **Pricing strategy**: Undercut Weglot by ~20-30%

## Feature/Limit Resolution Path

```
website → account_website (owner) → account.plan_code → plan
```

3 joins, cached at app level. Usage computed from existing tables at runtime.

## Plan Tiers

### Selected Names (Option C — Polyglot/Number Theme)

| Feature / Limit     | Free | Mono | Tri | Penta | Deca | Icosa |
| ------------------- | ---- | ---- | --- | ----- | ---- | ----- |
| **Price/mo**        | $0   | $12  | $24 | $59   | $249 | $599  |
| **Words**           | 2K   | 10K  | 50K | 200K  | 1M   | 5M    |
| **Languages**       | 1    | 1    | 3   | 5     | 10   | 20    |
| **Websites**        | 1    | 1    | 1   | 3     | 10   | 20    |
| **Team members**    | 1    | 1    | 6   | 10    | 25   | 50    |
| **Badge removal**   | No   | Yes  | Yes | Yes   | Yes  | Yes   |
| **Statistics**      | No   | No   | No  | Yes   | Yes  | Yes   |
| **Translated URLs** | No   | No   | No  | Yes   | Yes  | Yes   |
| **Premium support** | No   | No   | No  | Yes   | Yes  | Yes   |

See [plan-name-ideas.md](plan-name-ideas.md) for alternative naming options.

## Pricing Analysis

### vs Weglot (competitor)

| Plan  | Pantolingo | Weglot (~USD) | Savings |
| ----- | ---------- | ------------- | ------- |
| Free  | $0         | $0            | —       |
| Mono  | $12        | ~$16          | 25%     |
| Tri   | $24        | ~$31          | 23%     |
| Penta | $59        | ~$85          | 31%     |
| Deca  | $249       | ~$323         | 23%     |
| Icosa | $599       | ~$755         | 21%     |

### Cost per 1K Words / 1K Translations

| Plan  | Price | Words | Langs | $/1K words | $/1K translations |
| ----- | ----- | ----- | ----- | ---------- | ----------------- |
| Free  | $0    | 2K    | 1     | free       | free              |
| Mono  | $12   | 10K   | 1     | $1.20      | $1.20             |
| Tri   | $24   | 50K   | 3     | $0.48      | $0.16             |
| Penta | $59   | 200K  | 5     | $0.30      | $0.06             |
| Deca  | $249  | 1M    | 10    | $0.25      | $0.025            |
| Icosa | $599  | 5M    | 20    | $0.12      | $0.006            |

## Weglot Feature Comparison (from screenshots)

Weglot's tiers include these features/limits:

- Translated words (cumulative)
- Translated languages available
- Translation requests/month (mirrors word count — we are dropping this as redundant)
- AI Language Model (all tiers)
- Projects/websites (1 on lower tiers, scaling up)
- Badge removal (not on Free)
- Media translation (Starter+)
- Auto redirection (Starter+)
- Pro translators (Business+)
- Statistics (Pro+)
- Translated URLs (Pro+)
- Export & import (Advanced+)
- Custom languages (Advanced+)
- Top level domain (Extended+)
- Premium support (Extended+)
- Enterprise tier ("Contact us" — custom limits)

## Schema

### New table: `plan`

Defines subscription tiers. Managed dynamically via admin UI.

```sql
plan (
  code text PRIMARY KEY,           -- e.g., 'free', 'mono', 'tri', 'penta', 'deca', 'icosa'
  name text NOT NULL,              -- display name, e.g., 'Mono', 'Tri', 'Penta'
  rank integer NOT NULL DEFAULT 0, -- manual ordering override; ORDER BY rank, word_limit
  price_cents integer NOT NULL,    -- monthly price in USD cents (e.g., 1200 = $12)
  word_limit integer NOT NULL,     -- max translated words stored
  language_limit integer NOT NULL, -- max translated languages
  website_limit integer NOT NULL,  -- max websites per account
  team_member_limit integer NOT NULL, -- max team members per account
  has_badge_removal boolean DEFAULT false,
  has_statistics boolean DEFAULT false,
  has_translated_urls boolean DEFAULT false,
  has_premium_support boolean DEFAULT false,
  active boolean DEFAULT true,     -- soft-disable plans without deleting
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

### Modified table: `account`

Two new columns added to existing account table.

```sql
-- New columns on account:
plan_code text REFERENCES plan(code),       -- current plan, defaults to Free plan
plan_expires_at timestamptz                -- updated on each invoice.paid webhook
```

### Usage (computed at runtime)

Word usage is calculated from existing tables — no separate usage table needed:

- **Words**: `SUM(word_count)` from `translation_segment` + `translation_path` across all account websites
- **Languages**: `COUNT(DISTINCT)` active `website_language` rows across all account websites
- **Websites**: `COUNT` of `account_website` rows

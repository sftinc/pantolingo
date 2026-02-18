# Customer Website (`apps/www`)

Next.js 16 app with Tailwind CSS v4 and React 19.

## Routes

-   `/` - Marketing landing page
-   `/login`, `/signup` - Auth pages (email input)
-   `/auth/verify` - Turnstile verification page (shared by login/signup)
-   `/auth/check-email` - "Check your email" confirmation page
-   `/auth/enter-code` - Manual 8-character code entry page
-   `/auth/magic` - Magic link verification (redirects to `/api/auth/callback/smtp`)
-   `/account` - Smart router (no name → `/account/onboard`, has websites → last website, no websites → `/account/website`)
-   `/account/onboard` - Profile setup (name + password) for new users missing first/last name
-   `/account/website` - 4-step wizard for creating a website with DNS verification
-   `/account/setup` - Legacy redirect (no name → `/account/onboard`, else → `/account/website`)
-   `/account/[publicCode]/languages` - Languages list with pill links
-   `/account/[publicCode]/segments?lang=es` - Segments editor (language via query param)
-   `/account/[publicCode]/paths?lang=es` - Paths editor (language via query param)
-   `/account/[publicCode]/stats` - Stats dashboard (mock data)
-   `/account/[publicCode]/settings` - Website settings

## Auth Flow

The auth flow uses a shared cookie (`pantolingo-auth`) scoped to `/auth` paths that stores the email and flow type (`login` or `signup`).

**Flow:**
1. User enters email on `/login` or `/signup`
2. `prepareVerification(email, flow)` stores email+flow in cookie
3. Redirect to `/auth/verify` → Turnstile verification
4. On success, magic link email sent → redirect to `/auth/check-email`
5. User clicks email link OR enters code on `/auth/enter-code`
6. `/auth/magic` redirects to NextAuth callback → account

## Clean URLs

**Never expose `/api` routes to users.** User-facing URLs use clean paths:

| User-Facing URL | Internal Route | Method |
| --------------- | -------------- | ------ |
| `/auth/magic` | `/api/auth/callback/smtp` | Route redirect |
| `/auth/check-email` | N/A | Custom page (auth cookie) |
| `/auth/enter-code` | N/A | Custom page (auth cookie) |

## Directory Structure

```
src/
├── app/
│   ├── (marketing)/            # Public pages (/)
│   ├── (auth)/                 # Auth pages
│   │   ├── auth/               # Shared auth flow pages
│   │   │   ├── verify/         # /auth/verify - Turnstile verification
│   │   │   ├── check-email/    # /auth/check-email - "check your email"
│   │   │   ├── enter-code/     # /auth/enter-code - manual code entry
│   │   │   └── magic/          # /auth/magic - redirects to NextAuth callback
│   │   ├── login/              # /login - email input
│   │   │   └── error/          # /login/error - auth errors
│   │   └── signup/             # /signup - email input
│   ├── (account)/              # Customer account (sidebar layout)
│   │   └── account/
│   │       ├── page.tsx                        # /account - smart router
│   │       ├── onboard/                        # /account/onboard - profile setup
│   │       ├── website/                        # /account/website - 4-step wizard
│   │       ├── setup/                           # /account/setup - legacy redirect
│   │       └── [publicCode]/
│   │           ├── layout.tsx                  # Sidebar layout (auth gate + data)
│   │           ├── languages/page.tsx          # /account/:publicCode/languages
│   │           ├── segments/page.tsx           # /account/:publicCode/segments?lang=
│   │           ├── paths/page.tsx              # /account/:publicCode/paths?lang=
│   │           ├── stats/page.tsx              # /account/:publicCode/stats (mock)
│   │           └── settings/page.tsx           # /account/:publicCode/settings
│   ├── api/
│   │   └── auth/[...nextauth]/ # NextAuth API routes
│   └── healthz/                # Health check endpoint
├── actions/                    # Server actions
├── components/
│   ├── ui/                     # Reusable UI (Modal, Table, Badge, Lexical editor)
│   └── account/                # Account-specific (SegmentEditModal, PathEditModal, tables)
├── lib/                        # Utilities (auth, db queries)
├── proxy.ts                    # Auth middleware (route protection)
└── types/                      # TypeScript type extensions
```

## Key Components

-   `AccountShell` - Top bar + sidebar navigation layout (client component)
-   `LanguageDropdown` - Language selector dropdown for segments/paths pages
-   `SegmentEditModal`, `PathEditModal` - Modals for editing translations
-   `LangTable`, `SegmentTable`, `PathTable` - Data tables with pagination
-   `PlaceholderEditor` - ContentEditable editor with placeholder validation

## Language Dropdowns

Use the custom dropdown pattern (button + absolute `<ul>`) instead of native `<select>` for language pickers. This matches the `LanguageDropdown` component style: flag emoji + language name, click-outside-to-close, accent highlight on selected item, custom scrollbar. When used inside a form, pair with a hidden `<input>` to submit the selected value.

## Placeholder System

The `PlaceholderEditor` component renders and validates placeholders in translations. Placeholders must match between original and translated text.

### HTML Paired Placeholders (open/close tags)

| Code | Label | HTML Tags |
| ---- | ----- | --------- |
| `HB` | bold | `<b>`, `<strong>` |
| `HE` | emphasis | `<em>`, `<i>` |
| `HA` | anchor | `<a>` |
| `HS` | span | `<span>` |
| `HG` | element | `<u>`, `<sub>`, `<sup>`, `<mark>`, `<small>`, `<s>`, `<del>`, `<ins>`, `<abbr>`, `<q>`, `<cite>`, `<code>`, `<kbd>`, `<time>` |

### HTML Void Placeholders (self-closing, no close tag)

| Code | Label | HTML Tags |
| ---- | ----- | --------- |
| `HV` | element | `<br>`, `<hr>`, `<img>`, `<wbr>`, empty paired tags |

### Non-HTML Placeholders (standalone, no close tag)

| Code | Label | Purpose |
| ---- | ----- | ------- |
| `N` | number | Numbers (e.g., "1,234.56") |
| `E` | email | Email addresses (redacted for privacy) |
| `I` | id | Identifiers - UUIDs |
| `U` | url | URLs (with or without protocol) |
| `S` | skip | Brand names, proper nouns |

### Key Files

- `components/ui/PlaceholderEditor.tsx` - Main editor component
- `components/ui/PlaceholderIssuesBar.tsx` - Missing/extra placeholder warnings
- `components/ui/placeholder-shared.ts` - Labels, colors, tokenizer, AST parser
- `components/ui/placeholder-utils.ts` - Validation logic

## Changelog Tracking

Changes are tracked in the `changelog` table. `account_id` is always required; `website_id` is set for website-scoped changes, NULL for profile changes.

### Changelog Types

| Type | Description |
| ---- | ----------- |
| `segment` | Segment translation changed |
| `path` | Path translation changed |
| `setting` | Website setting changed (future) |
| `profile` | Account profile changed (future) |

### Change Schema

The `change` column is a JSONB array of `ChangelogItem` objects, supporting batch operations:

```typescript
interface ChangelogItem {
  table: string                                    // e.g., 'translation_segment'
  pk: Record<string, unknown>                      // e.g., { id: 123 }
  columns: Record<string, { old: unknown; new: unknown }>
}

// Example: segment edit
[{
  table: 'translation_segment',
  pk: { id: 456 },
  columns: {
    translated_text: { old: 'Hello', new: 'Hola' },
    reviewed: { old: false, new: true }
  }
}]

// Example: path edit
[{
  table: 'translation_path',
  pk: { id: 789 },
  columns: {
    translated_path: { old: '/about', new: '/acerca-de' }
  }
}]
```

Records are logged when text OR reviewed status changes (or both). Only changed columns are included.

### Key Files

- `actions/translations.ts` - Server actions that pass `accountId` to DB functions
- `packages/db/src/dashboard.ts` - `updateSegmentTranslation()`, `updatePathTranslation()` handle activity insertion

## Environment Variables

| Variable                | Default | Description                                       |
| ----------------------- | ------- | ------------------------------------------------- |
| `POSTGRES_DB_URL`       | -       | PostgreSQL connection string (required)           |
| `AUTH_SECRET`           | -       | NextAuth secret - generate with `openssl rand -base64 32` (required) |
| `SMTP_HOST`             | -       | SMTP server hostname (required)                   |
| `SMTP_USER`             | -       | SMTP username (required)                          |
| `SMTP_PASSWORD`         | -       | SMTP password (required)                          |
| `SMTP_FROM`             | -       | Email sender address, e.g. `noreply@pantolingo.com` (required) |
| `SMTP_PORT`             | 587     | SMTP port                                         |
| `SMTP_SECURE`           | false   | Use implicit TLS (true for port 465)              |
| `TURNSTILE_SITE_KEY` | - | Cloudflare Turnstile site key (required for auth forms) |
| `TURNSTILE_SECRET_KEY`  | -       | Cloudflare Turnstile secret key (required for auth forms) |

## Deployment (Render.com)

1. **Root Directory**: (leave empty - uses repo root)
2. **Build command**: `pnpm install && pnpm build:www`
3. **Start command**: `pnpm start:www`
4. **Build Filters**:
    - Include paths: `apps/www/**`, `packages/db/**`, `packages/lang/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`

## URL Message System

Use `?msg=` URL parameter for messages that result from redirects or navigation.

**When to use:**
- Server-side redirects (signOut, magic link errors)
- Navigation-based messages (session expired, access denied)

**When NOT to use:**
- Form action errors (use inline display with action state)
- Client-side validation errors

**Adding new messages:**
1. Add key to `lib/messages.ts` (lowercase alphanumeric only)
2. Set `page` property to restrict where message can appear
3. Redirect with `?msg=yourkey`

**Example:**
```typescript
// In server action or route handler
redirect('/login?msg=logout')

// In page with MessageDisplay
<MessageDisplay hidden={hasSubmitted} />
```

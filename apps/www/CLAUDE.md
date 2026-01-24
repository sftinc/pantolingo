# Customer Website (`apps/www`)

Next.js 16 app with Tailwind CSS v4 and React 19.

## Routes

-   `/` - Marketing landing page
-   `/login`, `/signup` - Auth pages (with Turnstile CAPTCHA)
-   `/login/magic` - Magic link verification (redirects to `/api/auth/callback/smtp`)
-   `/login/check-email` - "Check your email" confirmation page (reads JWT from HTTP-only cookie)
-   `/login/enter-code` - Manual 8-character code entry page
-   `/onboarding` - Name setup for new users
-   `/dashboard` - Websites overview with segment/path counts
-   `/dashboard/website/[id]` - Language list for a website
-   `/dashboard/website/[id]/lang/[langCd]` - Translation editor for segments and paths

## Clean URLs

**Never expose `/api` routes to users.** User-facing URLs use clean paths:

| User-Facing URL | Internal Route | Method |
| --------------- | -------------- | ------ |
| `/login/magic` | `/api/auth/callback/smtp` | Route redirect |
| `/login/check-email` | N/A | Custom page (JWT in HTTP-only cookie) |
| `/login/enter-code` | N/A | Custom page (JWT in HTTP-only cookie) |

## Directory Structure

```
src/
├── app/
│   ├── (marketing)/            # Public pages (/)
│   ├── (auth)/                 # Auth pages
│   │   ├── login/              # /login - email input
│   │   │   ├── check-email/    # /login/check-email - "check your email"
│   │   │   ├── enter-code/     # /login/enter-code - manual code entry
│   │   │   ├── error/          # /login/error - auth errors
│   │   │   └── magic/          # /login/magic - redirects to NextAuth callback
│   │   ├── signup/             # /signup
│   │   └── onboarding/         # /onboarding - name setup
│   ├── (dashboard)/            # Customer dashboard
│   │   └── dashboard/
│   │       ├── page.tsx                        # /dashboard - websites overview
│   │       └── website/[id]/
│   │           ├── page.tsx                    # /dashboard/website/:id - language list
│   │           └── lang/[langCd]/page.tsx      # /dashboard/website/:id/lang/:langCd - translations
│   ├── api/
│   │   └── auth/[...nextauth]/ # NextAuth API routes
│   └── healthz/                # Health check endpoint
├── actions/                    # Server actions
├── components/
│   ├── ui/                     # Reusable UI (Modal, Table, Badge, Lexical editor)
│   └── dashboard/              # Dashboard-specific (SegmentEditModal, PathEditModal, tables)
├── lib/                        # Utilities (auth, db queries)
├── proxy.ts                    # Auth middleware (route protection)
└── types/                      # TypeScript type extensions
```

## Key Components

-   `SegmentEditModal`, `PathEditModal` - Modals for editing translations
-   `LangTable`, `SegmentTable`, `PathTable` - Data tables with pagination
-   `PlaceholderEditor` - ContentEditable editor with placeholder validation

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
| `P` | email | Email addresses (PII) |
| `S` | skip | Brand names, proper nouns |

### Key Files

- `components/ui/PlaceholderEditor.tsx` - Main editor component
- `components/ui/PlaceholderIssuesBar.tsx` - Missing/extra placeholder warnings
- `components/ui/placeholder-shared.ts` - Labels, colors, tokenizer, AST parser
- `components/ui/placeholder-utils.ts` - Validation logic

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

# Customer Website (`apps/www`)

Next.js 16 app with Tailwind CSS v4 and React 19.

## Routes

-   `/` - Marketing landing page
-   `/login`, `/signup` - Auth pages
-   `/login/magic` - Magic link verification (redirects to `/api/auth/callback/smtp`)
-   `/login/check-email` - "Check your email" confirmation page
-   `/onboarding` - Name setup for new users
-   `/dashboard` - Websites overview with segment/path counts
-   `/dashboard/website/[id]` - Language list for a website
-   `/dashboard/website/[id]/lang/[langCd]` - Translation editor for segments and paths

## Clean URLs

**Never expose `/api` routes to users.** User-facing URLs use clean paths:

| User-Facing URL | Internal Route | Method |
| --------------- | -------------- | ------ |
| `/login/magic` | `/api/auth/callback/smtp` | Route redirect |
| `/login/check-email` | N/A | Custom page |

## Directory Structure

```
src/
├── app/
│   ├── (marketing)/            # Public pages (/)
│   ├── (auth)/                 # Auth pages
│   │   ├── login/              # /login - email input
│   │   │   ├── check-email/    # /login/check-email - "check your email"
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

-   `SegmentEditModal`, `PathEditModal` - Modals with Lexical editor for editing translations
-   `LangTable`, `SegmentTable`, `PathTable` - Data tables with pagination
-   `PlaceholderEditor` - Lexical editor with placeholder validation (preserves `[HB1]...[/HB1]` formatting)

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

## Deployment (Render.com)

1. **Root Directory**: (leave empty - uses repo root)
2. **Build command**: `pnpm install && pnpm build:www`
3. **Start command**: `pnpm start:www`
4. **Build Filters**:
    - Include paths: `apps/www/**`, `packages/db/**`, `packages/lang/**`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`

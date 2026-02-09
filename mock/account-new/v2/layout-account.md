This is the updated (v2) layout description for the new account pages with left navigation. These pages are for authenticated users only.

Changes from v1:
- Removed the separate top header bar — true two-column layout (sidebar + content)
- Replaced the "Pantolingo" logo and profile button with a **Website Switcher** at the top of the sidebar
- Removed Home and Websites nav items — navigation is now Languages, Segments, Paths, Stats only
- Website switching, settings, profile, theme, and sign out are all inside the website switcher dropdown
- Mobile top bar shows hamburger (left) + current website name (right) — no "Pantolingo" text
- Mobile sidebar uses a two-panel system: nav panel + switcher panel that slides in from the right
- Active nav item uses background highlight only (no left border accent) for aligned icons
- CSS and JS extracted into shared files for reuse across pages
- Languages table redesigned: Name (flag + name), Segments (pill), Paths (pill), action menu
- All/Unreviewed toggle added to Languages page
- Page titles are plain headings, not styled container bars

---

# Overall Layout

Two-column layout with no top header bar:
- **Left**: Fixed-width sidebar navigation (collapsible on mobile)
- **Right**: Main content area (scrollable, full height)

No separate header bar. Page titles appear as plain headings within the content area. The website switcher (including profile/settings) lives at the top of the sidebar (desktop) or in a slide-out panel (mobile).

---

# Left Sidebar Navigation

Fixed-height sidebar spanning the full viewport height. Light mode: white background with thin right border. Dark mode: dark charcoal background with darker border.

## Website Switcher (top)

At the top of the sidebar, replacing the old logo area. A clickable button showing:
- **Letter avatar** (rounded square, gray background) showing the first letter of the current website name
- **Website name** (e.g., "eSnipe") — bold, fills available width
- **Down chevron** (indicates dropdown)

Tall touch target (`min-h-[64px]`). Padding below before nav items.

### Website Switcher Dropdown (desktop)

Triggered by clicking the website switcher button. Dropdown opens **downward** from the button. Contains these sections separated by dividers:

1. **Current website header**
   - Website name (bold, larger)
   - Domain name below (smaller, gray — e.g., "www.esnipe.com")
2. **Settings** — Gear icon + "Settings" label
3. *(divider)*
4. **Other websites** — Each shows letter avatar + website name (e.g., "AuctionStealer", "Buy Me a Coffee")
5. **Add website** — Plus icon + "Add website" label
6. *(divider)*
7. **User name** — User icon + name (e.g., "W. Williams") + info icon on the right
8. **Dark mode** — Sun/moon icon + "Dark mode" label (toggles theme)
9. **Sign out** — Logout icon + "Sign out" label

Dropdown styling: White background (light mode) or dark charcoal (dark mode), rounded corners, subtle shadow, thin border. Width: `w-64`.

## Primary Nav Items

Stacked vertically below the website switcher, full-width clickable rows. Active item has highlighted background only (light blue/gray in light mode, darker shade in dark mode) — no left border accent, so icons stay aligned.

1. **Languages** — Languages for the current website
2. **Segments** — Segments for the current website/language
3. **Paths** — Paths for the current website/language
4. **Stats** — Translation statistics and charts

Each nav item shows:
- Icon (left)
- Label text (right of icon)

Icons:
- Languages: Translate/language icon (A文)
- Segments: Text lines / paragraph icon
- Paths: Route/path icon
- Stats: Bar chart icon

No items below the nav — the sidebar bottom is empty. All user/profile/settings actions live in the website switcher dropdown.

---

# Mobile Layout

- Sidebar collapses completely — hidden off-screen (`-translate-x-full`)
- **Sticky top bar** shows: Hamburger icon (left), current website name (right, e.g., "eSnipe")
- No "Pantolingo" text in the top bar
- Tapping hamburger opens sidebar as an overlay drawer with a dark backdrop
- Sidebar overlay includes an X close button (top-right)

## Two-Panel Mobile Sidebar

The mobile sidebar uses a two-panel sliding system:

1. **Nav Panel** (default) — Shows the website switcher button and primary nav items. Tapping the website switcher button slides to the Switcher Panel (instead of opening a dropdown).
2. **Switcher Panel** — Slides in from the right over the nav panel. Contains a back button (top-left) and the same items as the desktop dropdown (current site header, settings, other websites, add website, user, theme, sign out). Content is cloned from the desktop dropdown via JS.

The website switcher chevron points **right** on mobile (indicating slide panel) vs **down** on desktop (indicating dropdown).

---

# Page Content Areas

Content area has no header bar. Each page starts with a **page title** — a plain `<h1>` heading (`text-lg font-semibold`), with margin below before the main content card(s).

## /account/websites (Websites)

**Not directly accessible via sidebar nav.** The Websites page is the top-level view — it has no primary nav items in the sidebar (only the website switcher). Users reach it via the switcher or direct navigation.

**Page heading**: "Websites"

**Content:**

Table showing each website:
| Hostname | Languages | Segments | Paths |
|----------|-----------|----------|-------|

- **Hostname**: Domain name with source language flag emoji
- **Languages**: Count of target languages
- **Segments**: Total segment count
- **Paths**: Total path count

Rows are clickable with hover highlight. Clicking a website row sets it as the active website in the switcher and navigates to that website's Languages page.

---

## /account/languages (Languages)

Shows languages for the **currently selected website** (set via the website switcher).

**Page heading**: "Languages"

**Right of heading**: Add button (square, bordered, plus icon)

**Controls row** (inside the content card, above the table):
- **Status filter toggle**: "All" (default) | "Unreviewed" — tab-style toggle buttons

**Content:**

Table showing each language:
| Name | Segments | Paths | Actions |
|------|----------|-------|---------|

- **Name**: Country flag emoji + language name (e.g., "Spanish")
- **Segments**: Count in a rounded pill/badge (clickable, navigates to Segments filtered by this language)
- **Paths**: Count in a rounded pill/badge (clickable, navigates to Paths filtered by this language)
- **Actions**: Three-dot menu button (vertical ellipsis) with options like Edit, Delete

Clicking a language row sets it as the current language context and navigates to Segments.

---

## /account/segments (Segments)

Shows segments for the **currently selected website + language**.

**Page heading**: "Segments"

**Right of heading**: Language context dropdown — a button showing flag emoji + language name + chevron down. Dropdown lists available languages for the current website; active language is highlighted.

**Controls row** (inside the content card, above the table):
- **Status filter toggle**: "All" | "Unreviewed" — tab-style toggle buttons
- **Path filter dropdown**: "All paths" dropdown with search input to filter by specific path

**Content:**

Table showing segments:
| Original | Translation | Status |
|----------|-------------|--------|

- **Original**: Source text (may truncate)
- **Translation**: Translated text (may truncate)
- **Status**: "Pending" pill badge (visible on wider screens, hidden on mobile via `xs:` breakpoint)

Dynamic tokens (e.g., `{number}`) shown as purple inline pills.

Clicking a row opens the Edit Segment modal.

---

## /account/paths (Paths)

Shows paths for the **currently selected website + language**.

**Page heading**: "Paths"

**Right of heading**: Language context dropdown — same as Segments page (flag + language name + chevron).

**Controls row** (inside the content card, above the table):
- **Status filter toggle**: "All" | "Unreviewed" — tab-style toggle buttons

**Content:**

Table showing paths:
| Original Path | Translated Path | Status |
|---------------|-----------------|--------|

- **Original Path**: Source URL path (e.g., "/features")
- **Translated Path**: Translated URL path (e.g., "/caracteristicas")
- **Status**: "Pending" pill badge

Clicking a row opens the Edit Path modal.

---

## /account/stats (Stats)

Translation statistics and charts for the currently selected website.

**Page heading**: "Stats"

**Right of heading**: Period selector pills — "7D", "30D", "90D" as toggle buttons. Active pill is filled/highlighted.

**Content:**

Charts and stat cards using Chart.js. Layout uses a grid that stacks on mobile.

---

# Edit Segment Modal

- Modal overlay over current page
- Header: "Edit Segment" + status badge + X close
- Two-column content: Original (read-only, gray bg) | Translation (editable, white bg)
- Footer: "Reset" button + "Reviewed + Save" green button with dropdown

---

# Edit Path Modal

Similar to Edit Segment modal:

- Header: "Edit Path" + status badge + X close
- Two-column content: Original Path (read-only) | Translated Path (editable)
- Footer: "Reset" button + "Reviewed + Save" green button

---

# Context State

The current website is set explicitly via the **website switcher** in the sidebar. The current language is set by clicking into a language from the Languages page, or by using the **language context dropdown** on Segments/Paths pages.

- Website context: Persisted via the website switcher selection
- Language context: Persisted in session storage or URL state
- Both displayed in the UI for clarity (website in switcher button, language in context dropdown)

If no language is set (e.g., navigating directly to Segments), the page may:
- Default to the first available language
- Show a prompt to select a language

---

# Color Reference

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Sidebar background | White (#ffffff) | Dark charcoal (#1a1a1a) |
| Sidebar border | Light gray | Darker gray |
| Active nav item | Light blue/gray bg (#e8f0fe) | Darker shade (#2a2a3a) |
| Content background | Light gray (#f5f5f5) | Near-black (#111) |
| Cards/Tables | White (#ffffff) | Dark gray (#2a2a2a) |
| Switcher dropdown | White, shadow | Dark charcoal, shadow |

---

# Iconography

Consistent outline icon style throughout:

- Languages: Translate (A文)
- Segments: Text lines / paragraph
- Paths: Route / branch / path
- Stats: Bar chart
- Settings: Gear / cog
- Add website: Plus
- Profile: User circle
- Light mode: Sun
- Dark mode: Moon
- Sign out: Door with arrow / logout
- Actions menu: Vertical ellipsis (three dots)

---

# HTML Mock Files

Located in the `v2/` directory alongside this file. Built with Tailwind CSS (CDN) for easy porting to Next.js.

**Shared files:**
- `shared.css` — Nav active state styles (light/dark mode)
- `shared.js` — Website switcher dropdown/panel, mobile sidebar, theme toggle, saved theme

**Page files:**
- `websites.html` — Websites list page (no sidebar nav)
- `languages.html` — Languages list page
- `segments.html` — Segments list page (with language context dropdown and path filter)
- `paths.html` — Paths list page (with language context dropdown)
- `stats.html` — Stats/charts page (with period selector)

**Tailwind custom colors:**
```
sidebar-light: #ffffff / sidebar-dark: #1a1a1a
content-light: #f5f5f5 / content-dark: #111111
card-light: #ffffff / card-dark: #2a2a2a
```

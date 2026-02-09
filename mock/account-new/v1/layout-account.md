This is the layout description for the new account pages with left navigation. These pages are for authenticated users only.

---

# Overall Layout

Two-column layout:
- **Left**: Fixed-width sidebar navigation (collapsible on mobile)
- **Right**: Main content area (scrollable)

---

# Left Sidebar Navigation

Fixed-height sidebar spanning the full viewport height. Light mode: white background with thin right border. Dark mode: dark charcoal background with darker border.

## Logo Area (top)

- "Pantolingo" wordmark (bold) — links to /account (Home)
- Padding below before nav items

## Primary Nav Items

Stacked vertically, full-width clickable rows. Active item has highlighted background (light blue/gray in light mode, darker shade in dark mode) and possibly a left accent border.

1. **Home** — Dashboard with overview stats
2. **Websites** — List of all websites
3. **Languages** — Languages for most recent website
4. **Segments** — Segments for most recent website/language
5. **Paths** — Paths for most recent website/language

Each nav item shows:
- Icon (left)
- Label text (right of icon)

Icons (suggested):
- Home: House icon
- Websites: Globe icon
- Languages: Translate/language icon
- Segments: Text/paragraph icon
- Paths: Route/path icon

## Secondary Nav Items (bottom-aligned)

Separated from primary nav by flexible spacer (pushed to bottom of sidebar).

6. **Help** — Different color/style (muted, gray text or different accent color)
   - Icon: Question mark or help circle

---

# Top Header Bar

Spans the full width of the content area (right of sidebar). White background with thin bottom border. Dark mode: dark charcoal with darker border.

## Desktop Layout

- **Left**: Page title or breadcrumb (contextual to current page)
- **Right**: User profile area
    - Profile icon (circle with user avatar or initials)
    - User name (e.g., "W. Williams")
    - Down chevron (indicates dropdown)

## User Profile Dropdown

Triggered by clicking the profile area. Dropdown menu appears below with:

1. **Profile** — Link to user profile/settings page
2. **Light / Dark** — Theme toggle (may show current mode or toggle switch)
3. **Sign out** — Logs user out

Dropdown styling: White background (light mode) or dark charcoal (dark mode), rounded corners, subtle shadow, thin border.

---

# Mobile Layout

- Sidebar collapses to a hamburger menu icon in a top bar
- Top bar shows: Hamburger icon (left), "Pantolingo" wordmark (center or left), Profile icon (right)
- Tapping hamburger opens sidebar as an overlay or push-down drawer
- Profile dropdown accessible by tapping profile icon

---

# Page Content Areas

## /account (Home / Dashboard)

Overview page showing aggregated stats across all websites.

**Content sections:**

1. **Websites Summary** — Compact list/cards of user's websites with quick stats
2. **Translation Requests Chart** — Bar chart showing translation requests over time (all sites)
3. **Translated Words Chart** — Bar chart showing words translated over time (all sites)
4. **Recent Activity** — Feed/list of recent translation edits
    - Shows: Timestamp, website, language, segment preview, action (edited/reviewed)

Layout: Charts may be side-by-side on desktop, stacked on mobile. Activity feed below charts.

---

## /account/websites (Websites)

List of all user's websites.

**Content:**

Table or card grid showing each website:
| Website | Languages | Segments | Paths |
|---------|-----------|----------|-------|

- **Website**: Domain name with source language flag
- **Languages**: Count of target languages
- **Segments**: Total segment count
- **Paths**: Total path count

Clicking a website row navigates to that website's Languages page and sets it as the "most recent website" for sidebar context.

---

## /account/languages (Languages)

Shows languages for the **most recently viewed website** (stored in session/state).

**Header**: Shows which website is being viewed (e.g., "www.esnipe.com" with flag)

**Content:**

Table showing each language:
| Language | Segments | Paths | Unreviewed |
|----------|----------|-------|------------|

- **Language**: Language name with country flag
- **Segments**: Segment count for this language
- **Paths**: Path count for this language
- **Unreviewed**: Badge showing unreviewed count (yellow/orange pill)

Clicking a language row sets it as the current language context and navigates to Segments.

---

## /account/segments (Segments)

Shows segments for the **most recently viewed website + language**.

**Header**: Shows current website and language context (e.g., "www.esnipe.com / Spanish")

**Controls row:**
- **Status filter toggle**: "Unreviewed" (filled) | "All" (outlined)
- **Path filter dropdown**: "All paths" dropdown to filter by specific path

**Content:**

Table showing segments:
| Original Text | Translation | Status |
|---------------|-------------|--------|

- **Original Text**: Source text (may truncate)
- **Translation**: Translated text (may truncate)
- **Status**: "Pending" pill badge

Dynamic tokens (e.g., `number`) shown as purple inline pills.

Clicking a row opens the Edit Segment modal.

---

## /account/paths (Paths)

Shows paths for the **most recently viewed website + language**.

**Header**: Shows current website and language context

**Controls row:**
- **Status filter toggle**: "Unreviewed" (filled) | "All" (outlined)

**Content:**

Table showing paths:
| Original Path | Translated Path | Status |
|---------------|-----------------|--------|

- **Original Path**: Source URL path (e.g., "/features")
- **Translated Path**: Translated URL path (e.g., "/caracteristicas")
- **Status**: "Pending" pill badge

Clicking a row opens the Edit Path modal.

---

## /account/help (Help)

Help and documentation page.

**Content:**
- FAQ section
- Documentation links
- Contact/support information

---

# Edit Segment Modal

Same as current design (see account/layout-account.md):

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

The sidebar nav items for Languages, Segments, and Paths are contextual to the **most recently viewed website/language**. This context is:

- Set when user clicks into a specific website from Websites page
- Set when user clicks into a specific language from Languages page
- Persisted in session storage or URL state
- Displayed in the content area header for clarity

If no context is set (e.g., fresh login), these nav items may:
- Show a prompt to select a website first
- Default to the user's first/primary website
- Be visually disabled until context is set

---

# Color Reference

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Sidebar background | White | Dark charcoal (#1a1a1a) |
| Sidebar border | Light gray | Darker gray |
| Active nav item | Light blue/gray bg | Darker shade |
| Content background | Light gray (#f5f5f5) | Near-black (#111) |
| Cards/Tables | White | Dark gray (#2a2a2a) |
| Help nav item | Muted gray text | Muted light gray |
| Profile dropdown | White, shadow | Dark charcoal, shadow |

---

# Iconography

Consistent icon style throughout (outline or filled, pick one):

- Home: House
- Websites: Globe
- Languages: Translate (A文)
- Segments: Text lines / paragraph
- Paths: Route / branch / path
- Help: Question mark circle
- Profile: User circle
- Light mode: Sun
- Dark mode: Moon
- Sign out: Door with arrow / logout

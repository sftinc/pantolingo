This is the layout description for all account pages (authenticated users only). These pages share a consistent nav but have different content layouts depending on the route.

---

# Navigation (Account)

Top nav bar across the full viewport width. White background with a thin light gray bottom border (1px). Dark mode: dark charcoal background with darker border.

## Desktop Layout

- **Left**: "Pantolingo" wordmark (bold, large text — serves as logo/home link)
- **Right** (pushed to far right):
    - User's display name (e.g., "W. Williams")
    - "Sign out" (outlined/bordered button)
    - Light/dark mode toggle icon (sun/moon)

## Mobile Layout

- **Left**: "Pantolingo" wordmark (bold)
- **Right**: Light/dark mode toggle icon + hamburger menu icon

Hamburger menu contains: User name, Sign out button.

---

# Page Background

Same as public layout:
- **Light mode**: White nav, light gray/off-white content area
- **Dark mode**: Dark charcoal nav, near-black content area

---

# Routes & Content

## /account — Your Websites

**Breadcrumb**: None (this is the root account page)

**Page heading**: "Your Websites" (bold, large)

**Content**: Grid/list of website cards. Each card contains:
- **Header row**: Domain name (bold, e.g., "www.esnipe.com") + settings gear icon on right
- **Subheader**: "Source: {language}" (e.g., "Source: English (United States)")
- **Stats row**: Three metrics displayed horizontally
    - Number + "Languages"
    - Number + "Segments"
    - Number + "Paths"

Card styling: White background with rounded corners and subtle border/shadow. Clickable — navigates to the website detail page.

---

## /account/website/{websiteCode} — Website Languages

**Breadcrumb**: "Account / {domain} {flag}"
- "Account" is a link back to /account
- Domain shown with country flag emoji for source language

**Page heading**: "Languages" (bold, large)

**Content**: Table with columns:
| Language | Segments | Paths | Unreviewed |
|----------|----------|-------|------------|

- **Language**: Language name + country flag emoji (e.g., "Spanish" + Mexican flag)
- **Segments**: Count of text segments
- **Paths**: Count of URL paths
- **Unreviewed**: Count displayed in a pill/badge (yellow/orange background) — sum of unreviewed segments + paths

Table rows are clickable — navigate to the language detail page.

Table styling: White background, rounded corners, subtle border. Header row has gray text. Data rows separated by thin horizontal lines.

---

## /account/website/{websiteCode}/lang/{langCd} — Segments & Paths

**Breadcrumb**: "Account / {domain} {sourceFlag} / {language} {targetFlag} ({count})"
- "Account" links to /account
- Domain links to /account/website/{websiteCode}
- Language name with target flag and total count in parentheses

**Toggle buttons** (two groups):

1. **Content type toggle** (left):
    - "Segments" (filled/active button)
    - "Paths" (outline/inactive button)

2. **Status filter toggle** (adjacent):
    - "Unreviewed" (filled/active button, darker color)
    - "All" (outline/inactive button)

**Path filter dropdown** (right side):
- Dropdown labeled "All paths" or "Filter paths..."
- Opens a scrollable list:
    - "All paths" (highlighted when selected)
    - "No path"
    - List of actual paths (e.g., "/", "/features", "/help", "/help/article/[N1]-add-a-snipe")
- Only visible when viewing Segments (not applicable for Paths view)

**Content**: Table with columns:
| Original Text | Translation | Status |

- **Original Text**: Source language text (may be truncated with "...")
- **Translation**: Target language text (may be truncated with "...")
- **Status**: Pill/badge showing status:
    - "Pending" — yellow/cream background, orange text

Table rows are clickable — open the Edit modal.

**Special tokens**: Dynamic values shown as inline pills with purple background (e.g., `number` for numeric placeholders)

---

# Edit Segment/Path Modal

Modal overlay that appears over the current page (page content visible but dimmed behind).

**Header row**:
- **Left**: "Edit Segment" or "Edit Path" (bold)
- **Right**: Status badge (e.g., "Pending Review" in orange) + X close button

**Content** (two-column layout on desktop):

- **Left column**: "Original" label, then a read-only text area with light gray background showing the source text
- **Right column**: "{Language} Translation" label (e.g., "Spanish (Mexico) Translation"), then an editable text area with white background showing the translation

Dynamic tokens (e.g., `number`) displayed as purple pills in both text areas.

**Footer row** (right-aligned buttons):
- "Reset" — gray outlined button (resets changes)
- "Reviewed + Save" — green filled button with dropdown caret (primary action)

The "Reviewed + Save" button has a dropdown (indicated by up-caret) for additional save options.

---

# Mobile Considerations

- Tables may become horizontally scrollable or stack into card layouts
- Edit modal becomes full-screen or near-full-screen
- Toggle button groups may stack vertically
- Breadcrumbs may truncate or wrap

---

# Color Reference

| Element | Light Mode | Dark Mode |
|---------|------------|-----------|
| Nav background | White | Dark charcoal |
| Content background | Light gray (#f5f5f5) | Near-black |
| Cards/Tables | White | Dark gray |
| Status: Pending | Yellow/cream bg, orange text | Same |
| Status: Pending Review | Orange outline, orange text | Same |
| Dynamic tokens | Purple bg (#e9d5ff), purple text | Same |
| Primary action button | Green (#22c55e) | Same |
| Unreviewed toggle (active) | Dark gray/black | Light gray/white |

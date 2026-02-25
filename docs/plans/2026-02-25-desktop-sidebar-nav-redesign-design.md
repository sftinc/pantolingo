# Desktop Sidebar Nav Redesign

## Summary

Move the website picker and profile/account menu from the top header bar into the sidebar on desktop. Remove the desktop header bar entirely. Mobile layout stays unchanged.

## Current State

- Top header bar (`sticky top-0`, offset by `md:ml-60`): website picker (left) + profile menu (right)
- Sidebar (`w-60`, fixed): Pantolingo logo, primary nav (Languages, Segments, Paths, Stats), secondary nav (Settings)
- Mobile: hamburger-triggered overlay sidebar + top header bar

## Target State (Desktop Only)

Sidebar layout top to bottom:

1. **Pantolingo logo** — existing, unchanged
2. **Website picker** — pill-style button using the website's `uiColor` theme color (background tint + accent text). Dropdown opens downward, same content as current (other websites + "Add website"), keeps current width (~256px, wider than the 240px sidebar)
3. **Primary nav** — Languages, Segments, Paths, Stats (unchanged)
4. **Secondary nav** — Settings (unchanged, with spacing gap above)
5. **Flex spacer** — pushes profile to bottom
6. **Profile menu** — avatar circle (user initials) + name + chevron, pinned to sidebar bottom. Dropdown opens **upward, horizontally centered** relative to the button. Same content: Profile, Billing, Theme toggle, Sign out

**Desktop header bar:** Removed entirely. Main content area gets `min-h-screen` without a sticky header offset.

**Mobile:** No changes. Header bar, hamburger menu, and overlay sidebar remain as-is.

## Key Implementation Details

### Website Picker in Sidebar
- Rendered inside sidebar, hidden on mobile (`hidden md:block`) — mobile keeps the header version
- Uses `currentColor.btn` / `currentColor.hover` classes for the pill styling (already available)
- Dropdown positioned `absolute left-0 top-full mt-1` within sidebar, but since it's wider than the sidebar it will overflow to the right

### Profile Menu at Sidebar Bottom
- Rendered inside sidebar at the bottom via `mt-auto` or `flex-grow` spacer
- Hidden on mobile (`hidden md:block`) — mobile keeps the header version
- Dropdown opens upward: `absolute bottom-full mb-1` instead of `top-full mt-1`
- Horizontally centered: `left-1/2 -translate-x-1/2`
- Same dropdown content (Profile, Billing, Theme, Sign out)

### Header Bar Changes
- Header bar hidden on desktop: add `md:hidden` class
- Remains visible on mobile (hamburger + website switcher + profile)
- No changes to mobile header content or behavior

### Main Content Offset
- Remove `md:ml-60` from header (hidden on desktop anyway)
- Main content keeps `md:ml-60` (sidebar still exists on desktop)

## Files to Modify

- `apps/www/src/components/account/AccountShell.tsx` — all changes are in this single file

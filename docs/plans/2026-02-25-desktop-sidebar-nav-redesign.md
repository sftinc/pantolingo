# Desktop Sidebar Nav Redesign — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move the website picker and profile menu from the top header bar into the sidebar on desktop, then remove the desktop header bar.

**Architecture:** All changes are in `AccountShell.tsx`. The header bar gets `md:hidden` so it only shows on mobile. The sidebar gains two new sections (desktop-only): a website picker below the logo and a profile menu pinned to the bottom. The existing mobile layout is untouched.

**Tech Stack:** React 19, Next.js, Tailwind CSS v4

---

### Task 1: Hide the desktop header bar

**Files:**
- Modify: `apps/www/src/components/account/AccountShell.tsx:82`

**Step 1: Add `md:hidden` to the header element**

Change line 82 from:
```tsx
<header className="sticky top-0 z-30 md:ml-60 h-14 bg-white dark:bg-[var(--sidebar-bg)] md:bg-[var(--content-bg)] md:dark:bg-[var(--content-bg)]">
```
to:
```tsx
<header className="sticky top-0 z-30 h-14 bg-white dark:bg-[var(--sidebar-bg)] md:hidden">
```

The `md:ml-60`, `md:bg-*`, and `md:dark:bg-*` classes are no longer needed since the header is hidden on desktop.

**Step 2: Verify visually**

Run: `pnpm dev:www`

Check on desktop: header bar should be gone, sidebar and content remain. Check on mobile: header bar with hamburger, website switcher, and profile should still work.

**Step 3: Commit**

```bash
git add apps/www/src/components/account/AccountShell.tsx
git commit -m "Hide desktop header bar"
```

---

### Task 2: Add website picker to the sidebar (desktop only)

**Files:**
- Modify: `apps/www/src/components/account/AccountShell.tsx:237-240`

**Step 1: Add the website picker between the logo row and primary nav**

After the logo `</div>` (line 237) and before `{/* Primary nav */}` (line 239), insert the desktop-only website picker:

```tsx
{/* Website picker (desktop only) */}
<div ref={switcherRef} className="relative px-2 pt-3 hidden md:block">
	<button
		onClick={() => {
			setSwitcherOpen(!switcherOpen)
			setProfileOpen(false)
		}}
		className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${currentColor.btn} ${currentColor.hover} transition-colors cursor-pointer`}
	>
		<span className={`w-5 h-5 rounded ${currentColor.avatar} flex items-center justify-center text-[11px] font-semibold shrink-0`}>
			{currentWebsite.name[0].toUpperCase()}
		</span>
		<span className="font-semibold truncate">{currentWebsite.name}</span>
		<ChevronIcon className={`w-4 h-4 ml-auto ${currentColor.chevron} transition-transform ${switcherOpen ? 'rotate-180' : ''}`} />
	</button>

	{switcherOpen && (
		<div className="absolute left-0 top-full mt-1 w-64 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-lg overflow-hidden z-50">
			{/* Add website */}
			<button
				onClick={() => {
					setSwitcherOpen(false)
					setWizardOpen(true)
				}}
				className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
			>
				<PlusIcon className="w-5 h-5 text-[var(--text-subtle)]" />
				Add website
			</button>

			{otherWebsites.length > 0 && (
				<>
					<div className="border-t border-[var(--border)] my-1" />
					{otherWebsites.map((site) => {
						const siteColorKey = (site.uiColor as UiColor) || getWebsiteColor(site.name)
						const siteColor = COLOR_CLASSES[siteColorKey] || COLOR_CLASSES[getWebsiteColor(site.name)]
						return (
							<button
								key={site.publicCode}
								onClick={() => {
									setSwitcherOpen(false)
									const subPath = pathname.replace(`${basePath}/`, '').split('?')[0]
									router.push(`/account/${site.publicCode}/${subPath}`)
								}}
								className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
							>
								<span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-semibold ${siteColor.btn}`}>
									{site.name[0].toUpperCase()}
								</span>
								{site.name}
							</button>
						)
					})}
				</>
			)}
		</div>
	)}
</div>
```

Key differences from the header version:
- `hidden md:block` — only visible on desktop
- `w-full` on the button so it stretches across the sidebar width
- `ml-auto` on the chevron to push it to the right
- Avatar is `w-5 h-5` (slightly larger than header's `w-4 h-4`) to match sidebar scale
- Wrapped in `px-2 pt-3` for sidebar padding alignment
- Dropdown stays `w-64` (wider than the 240px sidebar, overflows right)

**Step 2: Handle the `switcherRef` conflict**

The `switcherRef` is currently attached to the header's website picker `<div>`. Since both the header (mobile) and sidebar (desktop) versions exist in the DOM simultaneously, the ref can only be on one. The click-outside handler needs to work for both.

Replace the single `switcherRef` approach: wrap each picker's container div with its own ref is complex. Simpler: since only one is visible at a time (`md:hidden` on header, `hidden md:block` on sidebar), keep `switcherRef` on the **sidebar** version (desktop) and add a separate ref for the mobile header version.

Add a new ref:
```tsx
const mobileSwitcherRef = useRef<HTMLDivElement>(null)
```

Update the click-outside handler to check both:
```tsx
if (switcherRef.current && !switcherRef.current.contains(e.target as Node) &&
    mobileSwitcherRef.current && !mobileSwitcherRef.current.contains(e.target as Node)) {
    setSwitcherOpen(false)
}
```

Wait — actually since only one is visible at a time and both share the same `switcherOpen` state, the simpler approach: the ref that's **not** in the DOM effectively won't be rendered, but both refs exist. The click-outside check should use OR logic: close if the click is outside **all** switcher refs. But only one will contain the target at any time.

**Simplest correct approach:** Use one ref on both isn't possible. Instead, since mobile and desktop are never visible simultaneously, just use a **callback ref** approach or — even simpler — just put the ref on the sidebar version and change the header version to use `mobileSwitcherRef`. Then update the click-outside handler:

```tsx
const handler = (e: MouseEvent) => {
    if (switcherRef.current && !switcherRef.current.contains(e.target as Node) &&
        (!mobileSwitcherRef.current || !mobileSwitcherRef.current.contains(e.target as Node))) {
        setSwitcherOpen(false)
    }
    if (mobileSwitcherRef.current && !mobileSwitcherRef.current.contains(e.target as Node) &&
        (!switcherRef.current || !switcherRef.current.contains(e.target as Node))) {
        setSwitcherOpen(false)
    }
    if (profileRef.current && !profileRef.current.contains(e.target as Node) &&
        (!mobileProfileRef.current || !mobileProfileRef.current.contains(e.target as Node))) {
        setProfileOpen(false)
    }
    if (mobileProfileRef.current && !mobileProfileRef.current.contains(e.target as Node) &&
        (!profileRef.current || !profileRef.current.contains(e.target as Node))) {
        setProfileOpen(false)
    }
}
```

Actually, simplify. Both the mobile and desktop versions share `switcherOpen` state. The click-outside should close the dropdown if the click is outside **both** elements. Consolidate:

```tsx
const handler = (e: MouseEvent) => {
    const target = e.target as Node
    const inSwitcher = (switcherRef.current?.contains(target)) || (mobileSwitcherRef.current?.contains(target))
    const inProfile = (profileRef.current?.contains(target)) || (mobileProfileRef.current?.contains(target))
    if (!inSwitcher) setSwitcherOpen(false)
    if (!inProfile) setProfileOpen(false)
}
```

**Step 3: Update the mobile header's website switcher to use `mobileSwitcherRef`**

In the header (line 94), change `ref={switcherRef}` to `ref={mobileSwitcherRef}`.

**Step 4: Verify visually**

Run: `pnpm dev:www`

Desktop: website picker should appear in sidebar below logo, dropdown opens downward and overflows sidebar width. Mobile: website picker still works in header.

**Step 5: Commit**

```bash
git add apps/www/src/components/account/AccountShell.tsx
git commit -m "Add website picker to desktop sidebar"
```

---

### Task 3: Add profile menu to the sidebar bottom (desktop only)

**Files:**
- Modify: `apps/www/src/components/account/AccountShell.tsx`

**Step 1: Add `flex-grow` spacer and profile section to the sidebar**

After the `</nav>` closing tag (line 275) and before the sidebar's `</aside>` (line 276), insert:

```tsx
{/* Spacer to push profile to bottom */}
<div className="flex-grow hidden md:block" />

{/* Profile menu (desktop only) */}
<div ref={profileRef} className="relative px-2 pb-4 hidden md:block border-t border-[var(--sidebar-border)] pt-3">
	<button
		onClick={() => {
			setProfileOpen(!profileOpen)
			setSwitcherOpen(false)
		}}
		className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
	>
		<span className="w-8 h-8 rounded-full bg-[var(--nav-hover-bg)] flex items-center justify-center text-xs font-semibold text-[var(--text-heading)] shrink-0">
			{userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
		</span>
		<span className="truncate">{userName}</span>
		<ChevronIcon className={`w-4 h-4 ml-auto text-[var(--text-subtle)] transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
	</button>

	{profileOpen && (
		<div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 w-48 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-lg py-1 z-50">
			{/* Profile link */}
			<button
				onClick={() => { setProfileOpen(false); setProfileModalOpen(true) }}
				className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
			>
				<UserIcon className="w-5 h-5 text-[var(--text-subtle)]" />
				Profile
			</button>

			{/* Billing link */}
			<Link
				href="/account/billing"
				onClick={() => setProfileOpen(false)}
				className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
			>
				<BillingIcon className="w-5 h-5 text-[var(--text-subtle)]" />
				Billing
			</Link>

			<div className="border-t border-[var(--border)] my-1" />

			{/* Theme cycle */}
			<button
				onClick={(e) => {
					e.stopPropagation()
					cycleTheme()
				}}
				className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
			>
				{mounted && <ThemeIcon className="w-5 h-5 text-[var(--text-subtle)]" />}
				{!mounted && <span className="w-5 h-5" />}
				{mounted ? themeLabel : ''}
			</button>

			{/* Sign out */}
			<form action={signOutAction}>
				<button
					type="submit"
					tabIndex={0}
					className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--text-muted)] hover:bg-[var(--nav-hover-bg)] transition-colors cursor-pointer"
				>
					<SignOutIcon className="w-5 h-5 text-[var(--text-subtle)]" />
					Sign out
				</button>
			</form>
		</div>
	)}
</div>
```

Key details:
- `hidden md:block` — desktop only
- `flex-grow` spacer pushes profile to the bottom of the `flex-col` sidebar
- Avatar shows user initials (first letter of each word in `userName`), circular (`rounded-full`), `w-8 h-8`
- Dropdown opens **upward**: `absolute bottom-full mb-1`
- Dropdown **centered**: `left-1/2 -translate-x-1/2`
- Border-top separator between nav and profile section
- Same dropdown content as current header version

**Step 2: Handle the `profileRef` conflict (same as switcherRef)**

Add a new ref for the mobile header's profile:
```tsx
const mobileProfileRef = useRef<HTMLDivElement>(null)
```

Update the header's profile `<div>` (line 156) from `ref={profileRef}` to `ref={mobileProfileRef}`.

The click-outside handler was already updated in Task 2 to handle both refs.

**Step 3: Verify visually**

Run: `pnpm dev:www`

Desktop: profile menu should be pinned to sidebar bottom with border-top separator, avatar with initials, name, chevron. Clicking opens dropdown **upward, centered**. Mobile: profile still works in header.

**Step 4: Commit**

```bash
git add apps/www/src/components/account/AccountShell.tsx
git commit -m "Add profile menu to desktop sidebar bottom"
```

---

### Task 4: Final cleanup and verification

**Files:**
- Modify: `apps/www/src/components/account/AccountShell.tsx`

**Step 1: Adjust main content top padding**

The main content currently has `pt-4` which was fine with the header above it. Without the header on desktop, the content may need slightly more top padding. Check visually — if it looks good, leave it. If the content feels too close to the top edge, increase to `pt-6` or `md:pt-6`.

**Step 2: Full visual QA checklist**

Run: `pnpm dev:www`

Desktop checks:
- [ ] No header bar visible
- [ ] Website picker in sidebar below logo, uses website's `uiColor` theme
- [ ] Website picker dropdown opens downward, ~256px wide (overflows sidebar)
- [ ] Clicking "Add website" opens wizard modal
- [ ] Clicking another website navigates and preserves current sub-path
- [ ] Nav links (Languages, Segments, Paths, Stats) work correctly
- [ ] Settings link works correctly
- [ ] Profile menu pinned to sidebar bottom with border separator
- [ ] Profile avatar shows user initials in a circle
- [ ] Profile dropdown opens upward and is horizontally centered
- [ ] Profile/Billing/Theme/Sign out all work from the sidebar dropdown
- [ ] Click-outside closes both dropdowns
- [ ] Dark mode: all elements render correctly

Mobile checks:
- [ ] Header bar still visible with hamburger + website switcher + profile
- [ ] Hamburger opens sidebar overlay
- [ ] Website switcher in header still works
- [ ] Profile in header still works
- [ ] No duplicate website picker or profile visible in mobile sidebar

**Step 3: Commit**

```bash
git add apps/www/src/components/account/AccountShell.tsx
git commit -m "Desktop sidebar nav redesign: move website picker and profile into sidebar"
```

Plan Name: 2026-02-25-desktop-sidebar-nav-redesign.md

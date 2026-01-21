# Completed: Remove closing tags from Missing chips

## Issue

Remove closing tags (like `/bold`) from the "Missing" chips in PlaceholderIssuesBar, since clicking the opening tag adds both open and close.

## Solution (commit f214ef0)

Filter out closing tags before rendering the missing chips.

**Change in `PlaceholderIssuesBar.tsx`:**

```typescript
// Filter out closing tags for paired placeholders (clicking open tag inserts both)
const missingToShow = missing.filter((token) => {
    const parsed = parseToken(token)
    return parsed && !parsed.isClose
})
```

Then render `missingToShow` instead of `missing`, returning `null` if no chips remain after filtering.

## Why

When a paired placeholder is missing (e.g., `[HB1]...[/HB1]`), both the open and close tags show as missing. But clicking the `+ bold` chip inserts both tags together (`[HB1]Text[/HB1]`), so showing the closing tag separately is redundant and confusing.

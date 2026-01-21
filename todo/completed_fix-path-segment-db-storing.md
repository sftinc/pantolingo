# Completed: Fix path-segment linking to include cached segments

## Summary

Pages visited after their segments were already cached had zero linked segments in the `website_path_segment` junction table, breaking cache invalidation and analytics.

## The Problem

When a page was visited:
1. Segments were extracted from the page
2. New segments (not in cache) were stored in `website_segment`
3. Only **new** segment hashes were used to link to `website_path_segment`

This meant if a segment was already cached from a previous page visit, it wouldn't be linked to the current path - even though that segment appeared on the page.

### Example Scenario

1. User visits `/about` - segments A, B, C are new → all linked to `/about`
2. User visits `/contact` which shares segment B → only new segments linked
3. Result: `/contact` shows 0 linked segments because B was already cached

## Solution (commit 75b48c7)

Include both new and cached segment hashes when linking to paths.

**Before** (`apps/translate/src/index.ts`):
```typescript
if (pathIds?.websitePathId && newSegmentHashes.length > 0) {
    const websiteSegmentIds = await batchGetWebsiteSegmentIds(websiteId, newSegmentHashes)
    // ...
}
```

**After**:
```typescript
const allSegmentHashes = [...newSegmentHashes, ...cachedSegmentHashes]
if (pathIds?.websitePathId && allSegmentHashes.length > 0) {
    const websiteSegmentIds = await batchGetWebsiteSegmentIds(websiteId, allSegmentHashes)
    // ...
}
```

## Why This Matters

- **Cache invalidation**: When a segment is edited, all paths using it need to be invalidated
- **Analytics**: Accurate segment-per-page counts for translation progress tracking
- **Data integrity**: Junction table now correctly reflects which segments appear on which paths

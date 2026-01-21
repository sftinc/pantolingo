# Completed: Fix cursor positioning in empty paired placeholders

## Summary

When a user re-adds a paired placeholder (like `[HB1][/HB1]`) via the `+ bold` button in the PlaceholderIssuesBar, typed text is inserted BEFORE the placeholder tags instead of between them.

## Goal

Users should be able to:

1. Delete content inside a paired placeholder (which removes the placeholder entirely)
2. Click the `+ bold` chip to re-add the placeholder
3. Immediately type new content inside the re-added placeholder

## Current Behavior vs Expected

| Current                                             | Expected                                |
| --------------------------------------------------- | --------------------------------------- |
| Click `+ bold` to re-add placeholder                | Same                                    |
| Type "hello"                                        | Same                                    |
| Text appears BEFORE `[HB1]` tag: `hello[HB1][/HB1]` | Text appears INSIDE: `[HB1]hello[/HB1]` |

## Key Files

- `apps/www/src/components/ui/PlaceholderEditor.tsx` - Main editor component with contentEditable
- `apps/www/src/components/ui/PlaceholderIssuesBar.tsx` - Shows missing/extra placeholder chips, calls `onInsertMissing`
- `apps/www/src/components/ui/placeholder-utils.ts` - Validation logic

## How the Editor Works

1. `PlaceholderEditor` is a `contentEditable` div
2. Text with placeholders like `[HB1]content[/HB1]` is parsed to AST via `tokenize()` and `parseToAST()`
3. AST is rendered to HTML via `renderASTToHTML()`:
    - Standalone placeholders (`[N1]`) become `<span data-standalone="N" data-index="1">number</span>`
    - Paired placeholders become `<span data-paired="HB" data-index="1">content</span>`
4. On user input, `serializeDOMToValue()` walks the DOM and converts back to text with tokens
5. Cursor position is tracked via `getCursorOffset()` / `setCursorOffset()` which use `getTextLength()` / `findNodeAtOffset()`

## The Insert Flow

When user clicks `+ bold` in PlaceholderIssuesBar:

1. `onInsertMissing(token)` is called with the opening tag (e.g., `[HB1]`)
2. `PlaceholderEditor.insertPlaceholder(token)` runs:
    - Gets current cursor offset
    - Inserts `[HB1][/HB1]` via `document.execCommand('insertText')`
    - Tries to position cursor at `cursorOffset + openTag.length` (between the tags)
3. `handleInput` fires, serializes DOM, calls `onChange`, re-renders
4. Both `handleInput` and `insertPlaceholder` queue `requestAnimationFrame` to restore cursor

## The Core Problem

After inserting `[HB1][/HB1]` and re-rendering:

- The paired element is empty, so `renderASTToHTML` produces `<span data-paired="HB" data-index="1"></span>`
- An empty span gives the cursor nowhere to land inside it
- When the user types, text goes outside the span instead of inside

## Solution (commit f214ef0)

Instead of inserting empty paired tags and fighting browser cursor positioning, insert default placeholder text between the tags.

**Before:**
```typescript
document.execCommand('insertText', false, openTag + closeTag)
// + 13 lines of cursor positioning logic with requestAnimationFrame
```

**After:**
```typescript
document.execCommand('insertText', false, openTag + 'Text' + closeTag)
```

### Why This Works

1. The span now has content ("Text"), so cursor positioning works naturally
2. Users see "Text" which they can select and replace with their content
3. Removed complex cursor positioning code that was fighting the browser bug

### Additional Changes

- Hid closing tags from the missing placeholders list in `PlaceholderIssuesBar.tsx` since clicking the open tag now inserts both tags with content automatically

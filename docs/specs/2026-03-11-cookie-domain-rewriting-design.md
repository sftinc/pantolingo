# Cookie Domain Rewriting — Phase 1 Design

**Linear issue**: PAN-18 (Phase 1 only)
**Scope**: Rewrite `Domain` attribute in `Set-Cookie` response headers so cookies work correctly on translated domains.

## Problem

When the translation proxy forwards origin responses, `Set-Cookie` headers retain the origin's `Domain` attribute. Browsers reject cookies whose domain doesn't match the current host, causing lost sessions, shopping carts, and preferences on translated sites.

Only `Set-Cookie` response headers need rewriting. Browsers send `Cookie` request headers as plain `name=value` pairs (no Domain/Path), so no reverse rewriting is needed.

## Approach

New module `apps/translate/src/http/cookies.ts` with a pure `rewriteSetCookieDomain()` function. Called from the existing `prepareResponseHeaders()` in `headers.ts`. Origin apex comes from the DB; translated apex is computed once per request via `tldts`.

## Module Structure

```
Origin Response
    |
    v
prepareResponseHeaders()          <- headers.ts (existing)
    | collects Set-Cookie[]
    | passes each through rewriteSetCookieDomain()
    v
rewriteSetCookieDomain()          <- cookies.ts (new)
    | inputs: cookie string, originApex, translatedHost, translatedApex
    | parses Domain attribute
    | checks: does cookie domain cover translatedHost?
    |   yes -> return cookie unchanged
    |   no  -> rewrite Domain, mirroring relationship
    |   no Domain attr -> return unchanged
    |   IP/localhost -> return unchanged
    v
Rewritten Set-Cookie[]
```

## Core Algorithm

### Function Signature

```typescript
rewriteSetCookieDomain(
  cookie: string,
  originApex: string,
  translatedHost: string,
  translatedApex: string
): string
```

### Steps

1. **Parse** the `Domain` attribute from the cookie string (case-insensitive match, strip leading `.`).
2. **No Domain attribute** -> return unchanged. Host-only cookie; the browser scopes it to the translated host automatically since the proxy response comes from the translated host.
3. **IP/localhost check** -> if `translatedHost` is an IP or localhost (detected via `tldts.parse()` returning `null` for `domain`), return unchanged.
4. **Coverage check** -> does the cookie domain cover `translatedHost`?
   - Cookie domain equals translated apex -> covers all subdomains -> **skip**.
   - Cookie domain equals translated host -> exact match -> **skip**.
   - `translatedHost` ends with `.` + cookie domain -> covers -> **skip**.
5. **Rewrite** (cookie doesn't cover translated host):
   - Cookie domain equals origin apex -> rewrite to `translatedApex` (apex -> translated apex).
   - Otherwise -> rewrite to `translatedHost` (host-specific -> translated host).
6. **Reconstruct** the cookie string with the new Domain value, preserving all other attributes.

### Rewrite Rules — Same Apex

Example: `www.example.com` -> `de.example.com` (both under `example.com`)

| Cookie Domain | Covers `de.example.com`? | Action | Reason |
|---|---|---|---|
| `.example.com` | Yes | Skip | Wildcard covers all subdomains |
| `example.com` | Yes | Skip | Equivalent to above per RFC 6265 |
| `www.example.com` | No | Rewrite to `de.example.com` | Only covers `www` and its subdomains |
| *(no Domain)* | N/A | Skip | Host-only; browser scopes automatically |

### Rewrite Rules — Different Apex

Example: `www.example.com` -> `www.example.de`

| Cookie Domain | Covers `www.example.de`? | Action | Reason |
|---|---|---|---|
| `.example.com` | No | Rewrite to `.example.de` | Apex -> translated apex |
| `example.com` | No | Rewrite to `example.de` | Apex -> translated apex |
| `www.example.com` | No | Rewrite to `www.example.de` | Host -> translated host |
| *(no Domain)* | N/A | Skip | Host-only; browser scopes automatically |

### Edge Cases

- **IP addresses / localhost**: `tldts` returns `null` for `domain` -> skip rewriting entirely.
- **Origin host is the apex itself** (e.g., `example.com` not `www.example.com`): same logic applies; apex cookies cover, host-specific cookies get rewritten.
- **RFC 6265**: `Domain=example.com` and `Domain=.example.com` are equivalent in modern browsers. Strip leading dot before comparison.

## Integration Points

### DB: `getWebsiteLanguageConfig()`

**File**: `packages/db/src/website-language.ts`

Add `apex` to the SELECT clause. The query already joins the `website` table; it just doesn't select this column. Add `apex` to the `WebsiteLanguageConfig` interface.

### Headers: `prepareResponseHeaders()`

**File**: `apps/translate/src/http/headers.ts`

Extend the signature with an optional config:

```typescript
prepareResponseHeaders(originHeaders: Headers, cookieRewriteConfig?: {
  originApex: string
  translatedHost: string
  translatedApex: string
})
```

When config is provided, each collected `Set-Cookie` string is passed through `rewriteSetCookieDomain()` before being added to the response headers. Optional config keeps the function backward-compatible.

### Pipeline: `handleRequest()`

**File**: `apps/translate/src/pipeline.ts`

- `originApex`: from `langConfig.apex` (newly added to query)
- `translatedHost`: already available as the request hostname
- `translatedApex`: computed once per request via `parse(translatedHost).domain` from `tldts`
- Bundle these three and pass to `prepareResponseHeaders()`
- If `langConfig.apex` is null, skip cookie rewriting (defensive; shouldn't happen in production)

### Dependency

Add `tldts` to `apps/translate/package.json`. Already used in the www app.

## Testing

Unit tests in `apps/translate/src/http/cookies.test.ts`:

| Test case | Input Domain | Origin Apex | Translated Host | Expected |
|---|---|---|---|---|
| Same apex, wildcard covers | `.example.com` | `example.com` | `de.example.com` | Skip |
| Same apex, host-specific doesn't cover | `www.example.com` | `example.com` | `de.example.com` | Rewrite to `de.example.com` |
| No Domain attribute | *(none)* | `example.com` | `de.example.com` | Skip |
| Different apex, apex cookie | `.example.com` | `example.com` | `www.example.de` | Rewrite to `.example.de` |
| Different apex, host-specific | `www.example.com` | `example.com` | `www.example.de` | Rewrite to `www.example.de` |
| IP address translated host | `.example.com` | `example.com` | `127.0.0.1` | Skip |
| Localhost | `.example.com` | `example.com` | `localhost` | Skip |
| Origin is apex itself | `example.com` | `example.com` | `de.example.com` | Skip (covers) |
| Leading dot equivalence | `example.com` vs `.example.com` | — | — | Treated identically |
| Preserves other attributes | Full cookie with Path, Secure, HttpOnly | — | — | Only Domain changed |

Integration test: Verify `prepareResponseHeaders()` rewrites cookies when config is provided and passes through unchanged when it's not.

## Out of Scope (Phase 2)

- Path attribute rewriting (cookie `Path` values)
- SameSite handling (not needed per analysis in PAN-18)

## Design Decisions

- **Response-only**: Only `Set-Cookie` response headers need rewriting. No reverse rewriting on request path.
- **No third-party filtering**: Origin can only set cookies for its own domain/apex per browser rules.
- **Pattern mirroring**: Apex cookies -> translated apex. Host-specific cookies -> translated host. Preserves original scoping intent.
- **Separate module**: `cookies.ts` provides clean testability and a natural home for Phase 2.
- **Optional config**: `prepareResponseHeaders()` stays backward-compatible; cookie rewriting activates only when config is provided.

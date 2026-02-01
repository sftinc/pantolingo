/**
 * Response header filtering and security headers
 */

/**
 * Headers to remove from origin responses
 * These can cause issues with translated domains or expose origin infrastructure
 */
const REMOVE_HEADERS = new Set([
  // Encoding headers - Node's fetch auto-decompresses
  'content-encoding',
  'transfer-encoding',
  'content-length',
  // Security headers that reference origin domain
  'content-security-policy',
  'content-security-policy-report-only',
  'x-frame-options',
  // Reporting headers that point to origin infrastructure
  'report-to',
  'reporting-endpoints',
  'nel',
  // Feature policies that may reference origin
  'permissions-policy',
  'feature-policy',
])

/**
 * Security headers to add to all responses
 */
const SECURITY_HEADERS: Record<string, string> = {
  'x-content-type-options': 'nosniff',
}

/**
 * Prepare response headers from origin response
 * - Filters problematic headers
 * - Accumulates Set-Cookie as array (multiple cookies supported)
 * - Adds security headers
 *
 * @param originHeaders - Headers from origin response
 * @returns Prepared headers ready for response
 */
export function prepareResponseHeaders(
  originHeaders: Headers
): Record<string, string | string[]> {
  const headers: Record<string, string | string[]> = {}
  const cookies: string[] = []

  originHeaders.forEach((value, key) => {
    const lowerKey = key.toLowerCase()

    if (REMOVE_HEADERS.has(lowerKey)) {
      return // Skip removed headers
    }

    if (lowerKey === 'set-cookie') {
      cookies.push(value) // Accumulate cookies
    } else {
      headers[key] = value
    }
  })

  // Add accumulated cookies if any
  if (cookies.length > 0) {
    headers['Set-Cookie'] = cookies
  }

  // Add security headers
  Object.assign(headers, SECURITY_HEADERS)

  return headers
}

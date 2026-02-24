const PERFPROX_BASE_URL = 'https://api.perfprox.com'
const TRANSLATE_ORIGIN = 'https://translate.pantolingo.com'

/**
 * Register a custom hostname with the Perfprox CNAME proxy service.
 * This creates a Cloudflare custom hostname so the translation subdomain
 * routes traffic through the translation proxy.
 */
async function createHostname(hostname: string): Promise<void> {
	const token = process.env.PERFPROX_API_TOKEN
	if (!token) {
		console.error('[perfprox] PERFPROX_API_TOKEN is not set, skipping hostname registration:', hostname)
		return
	}

	const res = await fetch(`${PERFPROX_BASE_URL}/hostnames`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${token}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			hostname,
			origin: TRANSLATE_ORIGIN,
		}),
	})

	if (res.status === 409) return // already exists, nothing to do

	if (!res.ok) {
		const body = await res.text()
		throw new Error(`[perfprox] Failed to create hostname "${hostname}" (${res.status}): ${body}`)
	}
}

/**
 * Register translation hostnames with Perfprox (fire-and-forget).
 * Logs failures but does not throw.
 */
export function registerTranslationHostnames(hostnames: string[]): void {
	for (const hostname of hostnames) {
		createHostname(hostname).catch((err) => {
			console.error(err)
		})
	}
}

/**
 * Map Perfprox hostname status to our local dns_status values.
 */
function mapPerfproxStatus(perfproxStatus: string): string {
	switch (perfproxStatus) {
		case 'active':
			return 'active'
		case 'failed':
		case 'disabled':
			return 'failed'
		case 'pending_dns':
		case 'validating':
		default:
			return 'pending'
	}
}

/**
 * Check a hostname's status via Perfprox (triggers Cloudflare sync).
 * @returns mapped local dns_status, or null on error
 */
export async function checkHostnameStatus(hostname: string): Promise<string | null> {
	const token = process.env.PERFPROX_API_TOKEN
	if (!token) {
		console.error('[perfprox] PERFPROX_API_TOKEN is not set, skipping status check:', hostname)
		return null
	}

	try {
		const res = await fetch(`${PERFPROX_BASE_URL}/hostnames/${encodeURIComponent(hostname)}/status`, {
			method: 'POST',
			headers: {
				'Authorization': `Bearer ${token}`,
			},
		})

		if (!res.ok) {
			const body = await res.text()
			console.error(`[perfprox] Status check failed for "${hostname}" (${res.status}): ${body}`)
			return null
		}

		const json = await res.json() as { data: { status: string } }
		return mapPerfproxStatus(json.data.status)
	} catch (error) {
		console.error(`[perfprox] Status check error for "${hostname}":`, error)
		return null
	}
}

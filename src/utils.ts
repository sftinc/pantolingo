/**
 * Utility functions for path detection
 */

/**
 * Check if a pathname is for a static asset that doesn't need translation
 * Static assets bypass pathname translation lookups and are proxied directly
 *
 * @param pathname - URL pathname to check (e.g., "/images/logo.png" or "/api/data")
 * @returns true if pathname is for a static asset file
 */
export function isStaticAsset(pathname: string): boolean {
	const staticExtensions = [
		'.css',
		'.js',
		'.json',
		'.png',
		'.jpg',
		'.jpeg',
		'.gif',
		'.svg',
		'.webp',
		'.ico',
		'.mp4',
		'.webm',
		'.ogg',
		'.mp3',
		'.wav',
		'.woff',
		'.woff2',
		'.ttf',
		'.eot',
		'.pdf',
		'.zip',
		'.xml',
	]
	const lowerPath = pathname.toLowerCase()
	return staticExtensions.some((ext) => lowerPath.endsWith(ext) || lowerPath.includes(ext + '?'))
}

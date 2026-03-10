export const CNAME_DOMAIN = 'cname.pantolingo.com'

export function getCnameTarget(publicCode: string): string {
	return publicCode.slice(-8) + '.' + CNAME_DOMAIN
}

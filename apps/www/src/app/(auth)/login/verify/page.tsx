import { redirect } from 'next/navigation'
import { getEmailJwtFromCookie, verifyEmailJwt } from '@/lib/auth-jwt'
import { getTurnstileSiteKey } from '@/lib/turnstile'
import { VerifyHumanForm } from '@/components/ui/VerifyHumanForm'

export default async function LoginVerifyPage() {
	// Read JWT from cookie and extract email
	const emailJwt = await getEmailJwtFromCookie()
	if (!emailJwt) {
		redirect('/login')
	}

	const email = await verifyEmailJwt(emailJwt)
	if (!email) {
		redirect('/login')
	}

	const turnstileSiteKey = getTurnstileSiteKey()

	return (
		<VerifyHumanForm
			email={email}
			turnstileSiteKey={turnstileSiteKey}
			backHref="/login"
			backText="Back to login"
		/>
	)
}

import { redirect } from 'next/navigation'
import { getEmailJwtFromCookie, verifyEmailJwt } from '@/lib/auth-jwt'
import { getTurnstileSiteKey } from '@/lib/turnstile'
import { VerifyHumanForm } from '@/components/ui/VerifyHumanForm'

export default async function SignupVerifyPage() {
	// Read JWT from cookie and extract email
	const emailJwt = await getEmailJwtFromCookie()
	if (!emailJwt) {
		redirect('/signup')
	}

	const email = await verifyEmailJwt(emailJwt)
	if (!email) {
		redirect('/signup')
	}

	const turnstileSiteKey = getTurnstileSiteKey()

	return (
		<VerifyHumanForm
			email={email}
			turnstileSiteKey={turnstileSiteKey}
			backHref="/signup"
			backText="Back to signup"
		/>
	)
}

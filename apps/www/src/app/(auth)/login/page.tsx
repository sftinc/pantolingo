import { Suspense } from 'react'
import { LoginForm } from './LoginForm'

export default function LoginPage() {
	return (
		<Suspense fallback={<LoginSkeleton />}>
			<LoginForm />
		</Suspense>
	)
}

function LoginSkeleton() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center p-6">
			<div className="w-full max-w-md bg-white dark:bg-neutral-900 p-10 rounded-lg shadow-md shadow-black/10 dark:shadow-black/30">
				<div className="animate-pulse">
					<div className="h-8 bg-gray-300 dark:bg-gray-700 rounded mb-4 mx-auto w-3/4" />
					<div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-8 mx-auto w-2/3" />
					<div className="h-10 bg-gray-300 dark:bg-gray-700 rounded mb-6" />
					<div className="h-4 bg-gray-300 dark:bg-gray-700 rounded mb-2 w-24" />
					<div className="h-12 bg-gray-300 dark:bg-gray-700 rounded mb-4" />
					<div className="h-12 bg-gray-300 dark:bg-gray-700 rounded" />
				</div>
			</div>
		</main>
	)
}

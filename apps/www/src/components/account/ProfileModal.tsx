'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Modal, Button } from '@/components/ui/Modal'
import { getPasswordRules } from '@/lib/password'
import { PasswordRulesList } from '@/components/ui/PasswordRulesList'
import { updateProfile, changePassword } from '@/actions/account'

interface UserProfile {
	firstName: string
	lastName: string
	email: string
}

interface ProfileModalProps {
	isOpen: boolean
	onClose: () => void
	userProfile: UserProfile
}

const tabs = [
	{ key: 'info', label: 'Personal Info' },
	{ key: 'password', label: 'Change Password' },
] as const

type Tab = (typeof tabs)[number]['key']

const inputClass = 'w-full px-3 py-2 text-sm rounded-md bg-[var(--page-bg)] border border-[var(--border)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50'
const cardClass = 'bg-[var(--card-bg)] rounded-lg border border-[var(--border)]'

export function ProfileModal({ isOpen, onClose, userProfile }: ProfileModalProps) {
	const router = useRouter()
	const [activeTab, setActiveTab] = useState<Tab>('info')

	const [firstName, setFirstName] = useState(userProfile.firstName)
	const [lastName, setLastName] = useState(userProfile.lastName)
	const [email, setEmail] = useState(userProfile.email)
	const [infoError, setInfoError] = useState('')
	const [infoSuccess, setInfoSuccess] = useState('')
	const [infoSaving, setInfoSaving] = useState(false)

	const [oldPassword, setOldPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [pwError, setPwError] = useState('')
	const [pwSuccess, setPwSuccess] = useState('')
	const [pwSaving, setPwSaving] = useState(false)

	const rules = getPasswordRules(newPassword)

	// Sync state when userProfile changes (e.g. after router.refresh())
	useEffect(() => {
		setFirstName(userProfile.firstName)
		setLastName(userProfile.lastName)
		setEmail(userProfile.email)
	}, [userProfile.firstName, userProfile.lastName, userProfile.email])

	function resetState() {
		setInfoError('')
		setInfoSuccess('')
		setPwError('')
		setPwSuccess('')
		setOldPassword('')
		setNewPassword('')
		setConfirmPassword('')
	}

	function handleTabSwitch(tab: Tab) {
		resetState()
		setActiveTab(tab)
	}

	function handleClose() {
		resetState()
		onClose()
	}

	async function handleSaveProfile() {
		setInfoError('')
		setInfoSuccess('')
		setInfoSaving(true)
		try {
			const result = await updateProfile(firstName, lastName, email)
			if (!result.success) {
				setInfoError(result.error || 'Failed to update profile')
			} else {
				setInfoSuccess('Profile updated')
				router.refresh()
			}
		} catch {
			setInfoError('Failed to update profile')
		} finally {
			setInfoSaving(false)
		}
	}

	async function handleChangePassword() {
		setPwError('')
		setPwSuccess('')

		if (newPassword !== confirmPassword) {
			setPwError('Passwords do not match')
			return
		}

		setPwSaving(true)
		try {
			const result = await changePassword(oldPassword, newPassword)
			if (!result.success) {
				setPwError(result.error || 'Failed to change password')
			} else {
				setPwSuccess('Password updated')
				setOldPassword('')
				setNewPassword('')
				setConfirmPassword('')
			}
		} catch {
			setPwError('Failed to change password')
		} finally {
			setPwSaving(false)
		}
	}

	return (
		<Modal isOpen={isOpen} onClose={handleClose} title="Profile" className="max-w-lg" contentClassName="bg-[var(--page-bg)]">
			<div className="space-y-5">
				{/* Tabs */}
				<div className="flex gap-1 mb-[-1px] relative z-10">
					{tabs.map((tab) => (
						<button
							key={tab.key}
							onClick={() => handleTabSwitch(tab.key)}
							className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border transition-colors cursor-pointer ${
								activeTab === tab.key
									? 'bg-[var(--card-bg)] text-[var(--text-heading)] border-[var(--border)] border-b-transparent'
									: 'text-[var(--text-muted)] hover:text-[var(--text-heading)] border-transparent'
							}`}
						>
							{tab.label}
						</button>
					))}
				</div>

				<div className={`${cardClass} !mt-0 !rounded-tl-none`}>
					{/* Tab Content */}
					<div className="p-6">
						{/* Personal Info Tab */}
						{activeTab === 'info' && (
							<div className="space-y-5">
								{infoError && (
									<div className="p-3 bg-[var(--error)]/10 text-[var(--error)] rounded-md text-sm">{infoError}</div>
								)}
								{infoSuccess && (
									<div className="p-3 bg-green-500/10 text-green-600 rounded-md text-sm">{infoSuccess}</div>
								)}
								<div>
									<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
										First Name
									</label>
									<input
										type="text"
										value={firstName}
										onChange={(e) => setFirstName(e.target.value)}
										maxLength={25}
										disabled={infoSaving}
										className={inputClass}
									/>
								</div>
								<div>
									<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
										Last Name
									</label>
									<input
										type="text"
										value={lastName}
										onChange={(e) => setLastName(e.target.value)}
										maxLength={25}
										disabled={infoSaving}
										className={inputClass}
									/>
								</div>
								<div>
									<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
										Email Address
									</label>
									<input
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										disabled={infoSaving}
										className={inputClass}
									/>
								</div>
							</div>
						)}

						{/* Change Password Tab */}
						{activeTab === 'password' && (
							<div className="space-y-5">
								{pwError && (
									<div className="p-3 bg-[var(--error)]/10 text-[var(--error)] rounded-md text-sm">{pwError}</div>
								)}
								{pwSuccess && (
									<div className="p-3 bg-green-500/10 text-green-600 rounded-md text-sm">{pwSuccess}</div>
								)}
								<div>
									<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
										Old Password
									</label>
									<input
										type="password"
										value={oldPassword}
										onChange={(e) => setOldPassword(e.target.value)}
										disabled={pwSaving}
										className={inputClass}
									/>
								</div>
								<div>
									<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
										New Password
									</label>
									<input
										type="password"
										value={newPassword}
										onChange={(e) => setNewPassword(e.target.value)}
										disabled={pwSaving}
										className={inputClass}
									/>
									<div className="mt-2">
										<PasswordRulesList rules={rules} password={newPassword} />
									</div>
								</div>
								<div>
									<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
										Confirm Password
									</label>
									<input
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										disabled={pwSaving}
										className={inputClass}
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Save Button */}
				<div className="flex justify-end">
					{activeTab === 'info' ? (
						<Button variant="primary" onClick={handleSaveProfile} disabled={infoSaving}>
							{infoSaving ? 'Saving...' : 'Save Profile'}
						</Button>
					) : (
						<Button variant="primary" onClick={handleChangePassword} disabled={pwSaving}>
							{pwSaving ? 'Updating...' : 'Update Password'}
						</Button>
					)}
				</div>
			</div>
		</Modal>
	)
}

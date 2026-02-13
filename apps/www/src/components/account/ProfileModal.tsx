'use client'

import { useState } from 'react'
import { Modal, Button } from '@/components/ui/Modal'

interface ProfileModalProps {
	isOpen: boolean
	onClose: () => void
}

const tabs = [
	{ key: 'info', label: 'Personal Info' },
	{ key: 'password', label: 'Change Password' },
] as const

type Tab = (typeof tabs)[number]['key']

const inputClass = 'w-full px-3 py-2 text-sm rounded-md bg-[var(--page-bg)] border border-[var(--border)] text-[var(--text-heading)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] disabled:opacity-50'
const cardClass = 'bg-[var(--card-bg)] rounded-lg border border-[var(--border)]'

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
	const [activeTab, setActiveTab] = useState<Tab>('info')

	const [firstName, setFirstName] = useState('')
	const [lastName, setLastName] = useState('')
	const [email, setEmail] = useState('')

	const [oldPassword, setOldPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Profile" className="max-w-lg" contentClassName="bg-[var(--page-bg)]">
			<div className="space-y-5">
				{/* Tabs */}
				<div className="flex gap-1 mb-[-1px] relative z-10">
					{tabs.map((tab) => (
						<button
							key={tab.key}
							onClick={() => setActiveTab(tab.key)}
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
								<div>
									<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
										First Name
									</label>
									<input
										type="text"
										value={firstName}
										onChange={(e) => setFirstName(e.target.value)}
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
										className={inputClass}
									/>
								</div>
							</div>
						)}

						{/* Change Password Tab */}
						{activeTab === 'password' && (
							<div className="space-y-5">
								<div>
									<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
										Old Password
									</label>
									<input
										type="password"
										value={oldPassword}
										onChange={(e) => setOldPassword(e.target.value)}
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
										className={inputClass}
									/>
								</div>
								<div>
									<label className="block mb-1.5 text-sm font-medium text-[var(--text-muted)]">
										Confirm Password
									</label>
									<input
										type="password"
										value={confirmPassword}
										onChange={(e) => setConfirmPassword(e.target.value)}
										className={inputClass}
									/>
								</div>
							</div>
						)}
					</div>
				</div>

				{/* Save Button */}
				<div className="flex justify-end">
					<Button variant="primary">
						{activeTab === 'info' ? 'Save Profile' : 'Update Password'}
					</Button>
				</div>
			</div>
		</Modal>
	)
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { Chart, registerables } from 'chart.js'

Chart.register(...registerables)

const PERIOD_DATA = {
	'7d': { views: '4,218', viewsDelta: '+12.3%', words: '18,742', wordsDelta: '+8.7%' },
	'30d': { views: '16,934', viewsDelta: '+5.1%', words: '72,518', wordsDelta: '+11.2%' },
	'90d': { views: '48,217', viewsDelta: '+18.6%', words: '198,340', wordsDelta: '+15.4%' },
} as const

type Period = keyof typeof PERIOD_DATA

// Mock data for page views chart
const CHART_LABELS_7D = (() => {
	const labels: string[] = []
	const today = new Date()
	for (let i = 6; i >= 0; i--) {
		const d = new Date(today)
		d.setDate(d.getDate() - i)
		labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }))
	}
	return labels
})()

const MOCK_PAGEVIEWS = {
	spanish: [410, 385, 520, 478, 612, 590, 648],
	french: [180, 210, 165, 230, 195, 245, 275],
}

const MOCK_WORDS_BY_LANG = {
	labels: ['Spanish', 'French'],
	data: [12480, 6262],
}

const TOP_PAGES = [
	{ path: '/', views: 1247 },
	{ path: '/features', views: 892 },
	{ path: '/pricing', views: 641 },
	{ path: '/about', views: 528 },
	{ path: '/blog/sniping-tips', views: 387 },
	{ path: '/faq', views: 256 },
]

const COVERAGE = [
	{ flag: '\u{1F1EA}\u{1F1F8}', name: 'Spanish', translated: 221, total: 235, unreviewed: 14 },
	{ flag: '\u{1F1EB}\u{1F1F7}', name: 'French', translated: 198, total: 235, unreviewed: 32 },
]

const ACTIVITY_DATA = [
	[3, 8, 0, 12, 5, 1, 0],
	[6, 14, 22, 9, 0, 3, 0],
	[11, 7, 18, 25, 15, 0, 2],
	[19, 32, 14, 28, 21, 8, 0],
]

export default function StatsPage() {
	const [period, setPeriod] = useState<Period>('7d')
	const pageviewsRef = useRef<HTMLCanvasElement>(null)
	const wordsLangRef = useRef<HTMLCanvasElement>(null)
	const pageviewsChart = useRef<Chart | null>(null)
	const wordsLangChart = useRef<Chart | null>(null)

	const data = PERIOD_DATA[period]

	// Page views line chart
	useEffect(() => {
		if (!pageviewsRef.current) return
		pageviewsChart.current?.destroy()
		pageviewsChart.current = new Chart(pageviewsRef.current, {
			type: 'line',
			data: {
				labels: CHART_LABELS_7D,
				datasets: [
					{
						label: 'Spanish',
						data: MOCK_PAGEVIEWS.spanish,
						borderColor: '#3b82f6',
						backgroundColor: 'rgba(59,130,246,0.12)',
						fill: true,
						tension: 0.35,
						borderWidth: 2,
						pointRadius: 3,
						pointBackgroundColor: '#3b82f6',
					},
					{
						label: 'French',
						data: MOCK_PAGEVIEWS.french,
						borderColor: '#10b981',
						backgroundColor: 'rgba(16,185,129,0.10)',
						fill: true,
						tension: 0.35,
						borderWidth: 2,
						pointRadius: 3,
						pointBackgroundColor: '#10b981',
					},
				],
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				interaction: { intersect: false, mode: 'index' },
				plugins: { legend: { display: false } },
				scales: {
					x: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 11 } } },
					y: { grid: { color: 'rgba(0,0,0,0.06)' }, ticks: { color: '#6b7280', font: { size: 11 } }, beginAtZero: true },
				},
			},
		})
		return () => { pageviewsChart.current?.destroy() }
	}, [])

	// Words by language bar chart
	useEffect(() => {
		if (!wordsLangRef.current) return
		wordsLangChart.current?.destroy()
		wordsLangChart.current = new Chart(wordsLangRef.current, {
			type: 'bar',
			data: {
				labels: MOCK_WORDS_BY_LANG.labels,
				datasets: [
					{
						label: 'Segments',
						data: MOCK_WORDS_BY_LANG.data,
						backgroundColor: ['rgba(59,130,246,0.75)', 'rgba(16,185,129,0.75)'],
						borderRadius: 4,
						barThickness: 28,
					},
				],
			},
			options: {
				indexAxis: 'y',
				responsive: true,
				maintainAspectRatio: false,
				plugins: { legend: { display: false } },
				scales: {
					x: {
						grid: { color: 'rgba(0,0,0,0.06)' },
						ticks: {
							color: '#6b7280',
							font: { size: 11 },
							callback: (v) => (typeof v === 'number' && v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)),
						},
					},
					y: { grid: { display: false }, ticks: { color: '#6b7280', font: { size: 12 } } },
				},
			},
		})
		return () => { wordsLangChart.current?.destroy() }
	}, [])

	const maxViews = TOP_PAGES[0].views

	return (
		<div>
			{/* Header + Period Selector */}
			<div className="mb-6 flex items-center justify-between flex-wrap gap-3">
				<h1 className="text-2xl font-semibold text-[var(--text-heading)]">Stats</h1>
				<div className="flex items-center gap-1 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg p-1">
					{(['7d', '30d', '90d'] as Period[]).map((p) => (
						<button
							key={p}
							onClick={() => setPeriod(p)}
							className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
								period === p
									? 'bg-[var(--accent)] text-white'
									: 'text-[var(--text-muted)] hover:bg-[var(--border)]'
							}`}
						>
							{p.toUpperCase()}
						</button>
					))}
				</div>
			</div>

			{/* Summary Cards */}
			<div className="grid grid-cols-2 gap-4 mb-6">
				<div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-4">
					<div className="flex items-center gap-2 mb-1">
						<EyeIcon />
						<span className="text-xs font-medium text-[var(--text-subtle)]">Page Views</span>
					</div>
					<div className="text-2xl font-bold text-[var(--text-heading)]">{data.views}</div>
					<div className="flex items-center gap-1 mt-1">
						<ArrowUpIcon />
						<span className="text-xs text-[var(--success)] font-medium">{data.viewsDelta}</span>
						<span className="text-xs text-[var(--text-subtle)]">vs prior</span>
					</div>
				</div>
				<div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-4">
					<div className="flex items-center gap-2 mb-1">
						<TranslateIcon />
						<span className="text-xs font-medium text-[var(--text-subtle)]">Words Translated</span>
					</div>
					<div className="text-2xl font-bold text-[var(--text-heading)]">{data.words}</div>
					<div className="flex items-center gap-1 mt-1">
						<ArrowUpIcon />
						<span className="text-xs text-[var(--success)] font-medium">{data.wordsDelta}</span>
						<span className="text-xs text-[var(--text-subtle)]">vs prior</span>
					</div>
				</div>
			</div>

			{/* Charts: Page Views + Words by Language */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
				<div className="lg:col-span-2 bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-5">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-sm font-semibold text-[var(--text-heading)]">Page Views</h2>
						<div className="flex items-center gap-4 text-xs text-[var(--text-subtle)]">
							<span className="flex items-center gap-1.5">
								<span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
								Spanish
							</span>
							<span className="flex items-center gap-1.5">
								<span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
								French
							</span>
						</div>
					</div>
					<div className="h-56">
						<canvas ref={pageviewsRef} />
					</div>
				</div>
				<div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-5">
					<h2 className="text-sm font-semibold text-[var(--text-heading)] mb-4">Words by Language</h2>
					<div className="h-56">
						<canvas ref={wordsLangRef} />
					</div>
				</div>
			</div>

			{/* Top Pages + Translation Coverage */}
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
				{/* Top Pages */}
				<div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-5">
					<h2 className="text-sm font-semibold text-[var(--text-heading)] mb-4">Top Pages</h2>
					<div className="space-y-3">
						{TOP_PAGES.map((page) => (
							<div key={page.path}>
								<div className="flex items-center justify-between mb-1">
									<span className="text-xs text-[var(--text-muted)] font-mono truncate max-w-[70%]">{page.path}</span>
									<span className="text-xs font-semibold text-[var(--text-heading)]">{page.views.toLocaleString()}</span>
								</div>
								<div className="w-full h-1.5 bg-[var(--border)] rounded-full overflow-hidden">
									<div
										className="h-full bg-blue-500 rounded-full"
										style={{ width: `${(page.views / maxViews) * 100}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Translation Coverage */}
				<div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-5">
					<h2 className="text-sm font-semibold text-[var(--text-heading)] mb-4">Translation Coverage</h2>
					<div className="space-y-4">
						{COVERAGE.map((lang) => {
							const pct = Math.round((lang.translated / lang.total) * 100)
							return (
								<div key={lang.name}>
									<div className="flex items-center justify-between mb-1.5">
										<span className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
											<span className="text-base">{lang.flag}</span> {lang.name}
										</span>
										<span className="text-xs font-semibold text-[var(--text-heading)]">
											{lang.translated} / {lang.total} segments
										</span>
									</div>
									<div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
										<div
											className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-500"
											style={{ width: `${pct}%` }}
										/>
									</div>
									<div className="flex items-center justify-between mt-1">
										<span className="text-xs text-[var(--text-subtle)]">{pct}% translated</span>
										<span className="text-xs text-[var(--warning)] font-medium">{lang.unreviewed} unreviewed</span>
									</div>
								</div>
							)
						})}

						{/* Path coverage */}
						<div className="pt-3 border-t border-[var(--border)]">
							<div className="flex items-center justify-between mb-1.5">
								<span className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
									<PathMiniIcon />
									Path Translation
								</span>
								<span className="text-xs font-semibold text-[var(--text-heading)]">8 / 9 paths</span>
							</div>
							<div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
								<div
									className="h-full rounded-full bg-gradient-to-r from-violet-400 to-purple-500"
									style={{ width: '89%' }}
								/>
							</div>
							<span className="text-xs text-[var(--text-subtle)] mt-1 inline-block">89% paths translated (both languages)</span>
						</div>
					</div>
				</div>
			</div>

			{/* Activity Heatmap */}
			<div className="bg-[var(--card-bg)] rounded-lg border border-[var(--border)] p-5">
				<h2 className="text-sm font-semibold text-[var(--text-heading)] mb-4">Translation Activity</h2>
				<div className="overflow-x-auto">
					<div className="flex items-end gap-1 min-w-[400px]">
						{/* Day labels */}
						<div className="flex flex-col gap-1 mr-2">
							{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
								<span key={i} className="text-[10px] text-[var(--text-subtle)] h-3 leading-3">{d}</span>
							))}
						</div>
						{/* Weeks */}
						{ACTIVITY_DATA.map((week, wi) => (
							<div key={wi} className="flex flex-col gap-1 flex-1">
								{week.map((val, di) => (
									<div
										key={di}
										className={`h-3 rounded-sm ${heatColor(val)}`}
										title={`${val} translations`}
									/>
								))}
							</div>
						))}
					</div>
					<div className="flex items-center justify-between mt-3 text-xs text-[var(--text-subtle)]">
						<span>4 weeks ago</span>
						<div className="flex items-center gap-1.5">
							<span>Less</span>
							<span className="w-3 h-3 rounded-sm bg-[var(--border)]" />
							<span className="w-3 h-3 rounded-sm bg-blue-200" />
							<span className="w-3 h-3 rounded-sm bg-blue-400" />
							<span className="w-3 h-3 rounded-sm bg-blue-600" />
							<span>More</span>
						</div>
						<span>Today</span>
					</div>
				</div>
			</div>
		</div>
	)
}

function heatColor(val: number): string {
	if (val === 0) return 'bg-[var(--border)]'
	if (val <= 5) return 'bg-blue-200'
	if (val <= 15) return 'bg-blue-400'
	return 'bg-blue-600'
}

function EyeIcon() {
	return (
		<svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
		</svg>
	)
}

function TranslateIcon() {
	return (
		<svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="m5 8 6 6M4 14l6-6 2-3M2 5h12M7 2h1m7 20-5-10-5 10M14 18h6" />
		</svg>
	)
}

function ArrowUpIcon() {
	return (
		<svg className="w-3 h-3 text-[var(--success)]" fill="currentColor" viewBox="0 0 20 20">
			<path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
		</svg>
	)
}

function PathMiniIcon() {
	return (
		<svg className="w-4 h-4 text-[var(--text-subtle)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M22 2 11 13m11-11-7 20-4-9-9-4Z" />
		</svg>
	)
}

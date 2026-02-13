'use client'

import { useState } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { PlaceholderText } from '@/components/ui/PlaceholderText'
import { PathEditModal } from './PathEditModal'
import type { PathWithTranslation } from '@pantolingo/db'

interface PathTableProps {
	paths: PathWithTranslation[]
	targetLang: string
	websiteId: number
	onUpdate?: () => void
}

export function PathTable({ paths, targetLang, websiteId, onUpdate }: PathTableProps) {
	const [editingPath, setEditingPath] = useState<PathWithTranslation | null>(null)

	if (paths.length === 0) {
		return <EmptyState message="No paths found" />
	}

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-1/2">Original Path</TableHead>
						<TableHead className="w-1/2">Translated Path</TableHead>
						<TableHead className="w-28">Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{paths.map((path) => (
						<TableRow
							key={path.websitePathId}
							clickable
							onClick={() => setEditingPath(path)}
						>
							<TableCell className="max-w-0">
								<code
									className="block truncate text-sm text-gray-600 dark:text-gray-400"
									title={path.path}
								>
									<PlaceholderText text={path.path} />
								</code>
							</TableCell>
							<TableCell className="max-w-0">
								{path.translatedPath ? (
									<code
										className="block truncate text-sm"
										title={path.translatedPath}
									>
										<PlaceholderText text={path.translatedPath} />
									</code>
								) : (
									<span className="text-gray-400 dark:text-gray-500 italic">Not translated</span>
								)}
							</TableCell>
							<TableCell>
								{path.translatedPath ? (
									path.reviewedAt ? (
										<Badge variant="success">Reviewed</Badge>
									) : (
										<Badge variant="warning">Pending</Badge>
									)
								) : (
									<Badge variant="neutral">-</Badge>
								)}
							</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>

			{editingPath && (
				<PathEditModal
					isOpen={!!editingPath}
					onClose={() => setEditingPath(null)}
					websiteId={websiteId}
					websitePathId={editingPath.websitePathId}
					originalPath={editingPath.path}
					translatedPath={editingPath.translatedPath}
					isReviewed={!!editingPath.reviewedAt}
					targetLang={targetLang}
					onUpdate={onUpdate}
				/>
			)}
		</>
	)
}

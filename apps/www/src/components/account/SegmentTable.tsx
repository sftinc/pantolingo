'use client'

import { useState } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, EmptyState } from '@/components/ui/Table'
import { Badge } from '@/components/ui/Badge'
import { PlaceholderText } from '@/components/ui/PlaceholderText'
import { SegmentEditModal } from './SegmentEditModal'
import type { SegmentWithTranslation } from '@pantolingo/db'

interface SegmentTableProps {
	segments: SegmentWithTranslation[]
	targetLang: string
	websiteId: number
	onUpdate?: () => void
}

export function SegmentTable({ segments, targetLang, websiteId, onUpdate }: SegmentTableProps) {
	const [editingSegment, setEditingSegment] = useState<SegmentWithTranslation | null>(null)

	if (segments.length === 0) {
		return <EmptyState message="No segments found" />
	}

	return (
		<>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead className="w-1/2">Original Text</TableHead>
						<TableHead className="w-1/2">Translation</TableHead>
						<TableHead className="w-28">Status</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{segments.map((segment) => (
						<TableRow
							key={segment.websiteSegmentId}
							clickable
							onClick={() => setEditingSegment(segment)}
						>
							<TableCell className="max-w-0">
								<span
									className="block truncate text-gray-600 dark:text-gray-400"
									title={segment.text}
								>
									<PlaceholderText text={segment.text} />
								</span>
							</TableCell>
							<TableCell className="max-w-0">
								{segment.translatedText ? (
									<span
										className="block truncate"
										title={segment.translatedText}
									>
										<PlaceholderText text={segment.translatedText} />
									</span>
								) : (
									<span className="text-gray-400 dark:text-gray-500 italic">Not translated</span>
								)}
							</TableCell>
							<TableCell>
								{segment.translatedText ? (
									segment.reviewedAt ? (
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

			{editingSegment && (
				<SegmentEditModal
					isOpen={!!editingSegment}
					onClose={() => setEditingSegment(null)}
					websiteId={websiteId}
					websiteSegmentId={editingSegment.websiteSegmentId}
					originalText={editingSegment.text}
					translatedText={editingSegment.translatedText}
					isReviewed={!!editingSegment.reviewedAt}
					targetLang={targetLang}
					onUpdate={onUpdate}
				/>
			)}
		</>
	)
}

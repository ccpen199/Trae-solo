import { cn } from '@/lib/utils'
import { getStatusLabel } from '@/utils/helpers'

const greenStatuses = new Set(['approved', 'signed', 'filed', 'accepted', 'completed', 'verified'])
const redStatuses = new Set(['rejected', 'failed', 'expired', 'terminated', 'cancelled'])
const yellowStatuses = new Set(['pending', 'draft', 'pending_sign', 'pending_ocr', 'pending_review', 'not_filed'])
const blueStatuses = new Set(['interviewing', 'filing', 'viewed', 'ocr_done', 'scanning', 'mediating'])

const typeColorMap: Record<string, string> = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  blue: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-700',
}

function getStatusColor(status: string): string {
  if (greenStatuses.has(status)) return 'green'
  if (redStatuses.has(status)) return 'red'
  if (yellowStatuses.has(status)) return 'yellow'
  if (blueStatuses.has(status)) return 'blue'
  return 'gray'
}

interface StatusBadgeProps {
  status: string
  type: 'application' | 'interview' | 'contract' | 'filing' | 'verification' | 'dispute' | 'review'
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const color = getStatusColor(status)
  const label = getStatusLabel(status)

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        typeColorMap[color] || typeColorMap.gray
      )}
    >
      {label}
    </span>
  )
}

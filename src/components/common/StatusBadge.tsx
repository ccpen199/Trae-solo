import { cn } from '@/lib/utils'

const STATUS_MAP: Record<string, { label: string; colorClass: string }> = {
  open: { label: '开放接单', colorClass: 'bg-emerald-100 text-emerald-700' },
  in_progress: { label: '进行中', colorClass: 'bg-sky-100 text-sky-700' },
  pending_review: { label: '待验收', colorClass: 'bg-amber-100 text-amber-700' },
  completed: { label: '已完成', colorClass: 'bg-primary-100 text-primary-700' },
  rejected: { label: '已驳回', colorClass: 'bg-danger-100 text-danger-700' },
  cancelled: { label: '已取消', colorClass: 'bg-zinc-100 text-zinc-600' },
  submitted: { label: '已提交', colorClass: 'bg-sky-100 text-sky-700' },
  approved: { label: '已通过', colorClass: 'bg-primary-100 text-primary-700' },
  pending: { label: '待审核', colorClass: 'bg-amber-100 text-amber-700' },
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_MAP[status] ?? { label: status, colorClass: 'bg-zinc-100 text-zinc-600' }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.colorClass,
        className,
      )}
    >
      {config.label}
    </span>
  )
}

import { cn } from '@/lib/utils'

type StatusType = 'active' | 'success' | 'pending' | 'warning' | 'rejected' | 'danger' | 'info'

interface StatusBadgeProps {
  status: StatusType | string
  label?: string
  size?: 'sm' | 'md'
}

const statusStyles: Record<string, string> = {
  active: 'bg-success/10 text-success',
  success: 'bg-success/10 text-success',
  pending: 'bg-warning/10 text-warning',
  warning: 'bg-warning/10 text-warning',
  rejected: 'bg-danger/10 text-danger',
  danger: 'bg-danger/10 text-danger',
  info: 'bg-blue-50 text-blue-600',
}

const sizeStyles = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2.5 py-1',
}

export default function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const style = statusStyles[status] || statusStyles.info

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        style,
        sizeStyles[size]
      )}
    >
      {label || status}
    </span>
  )
}

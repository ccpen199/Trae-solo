import { clsx } from 'clsx'

interface StatusBadgeProps {
  variant: 'success' | 'warning' | 'error' | 'info' | 'pending'
  text: string
  size?: 'sm' | 'md'
}

const variantStyles: Record<StatusBadgeProps['variant'], string> = {
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  error: 'bg-error/10 text-error',
  info: 'bg-primary/10 text-primary',
  pending: 'bg-warning/10 text-warning',
}

export default function StatusBadge({ variant, text, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center font-medium rounded-badge',
        variantStyles[variant],
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm'
      )}
    >
      {text}
    </span>
  )
}

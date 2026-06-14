import { cn } from '@/lib/utils'

type BadgeVariant = 'success' | 'warning' | 'error' | 'info'

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-mint-100 text-mint-700',
  warning: 'bg-amber-100 text-amber-700',
  error: 'bg-coral-100 text-coral-700',
  info: 'bg-navy-100 text-navy-700',
}

interface StatusBadgeProps {
  variant: BadgeVariant
  children: React.ReactNode
  className?: string
}

export default function StatusBadge({ variant, children, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

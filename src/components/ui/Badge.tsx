import * as React from 'react'
import { cn } from '@/lib/utils'
import { TrendingUp, AlertTriangle, Info, Sparkles } from 'lucide-react'

type BadgeVariant =
  | 'growth'
  | 'potential-A'
  | 'potential-B'
  | 'potential-C'
  | 'potential-D'
  | 'status'
  | 'warning'
  | 'info'
  | 'implicit'
  | 'emerald'
  | 'purple'
  | 'indigo'
  | 'gold'
  | 'default'
  | 'success'
  | 'destructive'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  withDot?: boolean
  size?: 'sm' | 'md'
}

interface VariantConfig {
  className: string
  icon?: React.ReactNode
  dotColor?: string
}

const variantConfig: Record<BadgeVariant, VariantConfig> = {
  growth: {
    className:
      'bg-gradient-to-r from-emerald-100 to-emerald-50 text-emerald-700 border border-emerald-200',
    icon: <TrendingUp className="h-3 w-3" />,
    dotColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  },
  'potential-A': {
    className:
      'bg-gradient-to-r from-lavender-100 to-lavender-50 text-lavender-700 border border-lavender-200',
    dotColor: 'bg-lavender-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]',
  },
  'potential-B': {
    className:
      'bg-gradient-to-r from-space-indigo-100 to-space-indigo-50 text-space-indigo-700 border border-space-indigo-200',
    dotColor: 'bg-space-indigo-500 shadow-[0_0_8px_rgba(58,95,168,0.6)]',
  },
  'potential-C': {
    className:
      'bg-gradient-to-r from-blue-100 to-blue-50 text-blue-700 border border-blue-200',
    dotColor: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]',
  },
  'potential-D': {
    className:
      'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-600 border border-slate-200',
    dotColor: 'bg-slate-500',
  },
  status: {
    className:
      'bg-gradient-to-r from-sky-100 to-sky-50 text-sky-700 border border-sky-200',
    dotColor: 'bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.6)]',
  },
  warning: {
    className:
      'bg-gradient-to-r from-amber-gold-100 to-amber-gold-50 text-amber-gold-700 border border-amber-gold-200',
    icon: <AlertTriangle className="h-3 w-3" />,
    dotColor: 'bg-amber-gold-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  },
  info: {
    className:
      'bg-gradient-to-r from-slate-100 to-slate-50 text-slate-600 border border-slate-200',
    icon: <Info className="h-3 w-3" />,
    dotColor: 'bg-slate-500',
  },
  implicit: {
    className:
      'bg-gradient-to-r from-lavender-50 to-space-indigo-50 text-lavender-600 border border-lavender-100 italic',
    icon: <Sparkles className="h-3 w-3" />,
    dotColor: 'bg-lavender-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]',
  },
  emerald: {
    className:
      'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  },
  purple: {
    className:
      'bg-lavender-50 text-lavender-700 border border-lavender-200',
    dotColor: 'bg-lavender-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]',
  },
  indigo: {
    className:
      'bg-space-indigo-50 text-space-indigo-700 border border-space-indigo-200',
    dotColor: 'bg-space-indigo-500 shadow-[0_0_8px_rgba(58,95,168,0.6)]',
  },
  gold: {
    className:
      'bg-amber-gold-50 text-amber-gold-700 border border-amber-gold-200',
    dotColor: 'bg-amber-gold-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]',
  },
  default: {
    className:
      'bg-slate-100 text-slate-700 border border-slate-200',
    dotColor: 'bg-slate-500',
  },
  success: {
    className:
      'bg-emerald-50 text-emerald-700 border border-emerald-200',
    dotColor: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]',
  },
  destructive: {
    className:
      'bg-red-50 text-red-700 border border-red-200',
    dotColor: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]',
  },
}

const sizeStyles = {
  sm: 'px-2.5 py-1 text-xs gap-1',
  md: 'px-3 py-1.5 text-sm gap-1.5',
}

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = 'info', className, withDot = false, size = 'sm', children, ...props }, ref) => {
    const config = variantConfig[variant]
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full border font-medium',
          'transition-all duration-200',
          config.className,
          sizeStyles[size],
          className,
        )}
        {...props}
      >
        {withDot ? (
          <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', config.dotColor)} />
        ) : (
          config.icon
        )}
        {children}
      </span>
    )
  },
)
Badge.displayName = 'Badge'

export { Badge };
export type { BadgeVariant };

import * as React from 'react'
import { cn, getWuXingColor, getWuXingName, type WuXingElement } from '@/lib/utils'

type BadgeVariant = 'default' | 'jade' | 'cinnabar' | 'gold' | 'wuxing'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  element?: WuXingElement
  dot?: boolean
}

const variantStyles: Record<BadgeVariant, string> = {
  default: 'bg-ink-100 text-ink-700 border border-ink-300',
  jade: 'bg-jade-50 text-jade-700 border border-jade-300',
  cinnabar: 'bg-cinnabar-50 text-cinnabar-700 border border-cinnabar-300',
  gold: 'bg-gold-50 text-gold-700 border border-gold-300',
  wuxing: '',
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', element, dot = false, children, ...props }, ref) => {
    const wuxingStyle = React.useMemo(() => {
      if (variant !== 'wuxing' || !element) return {}
      const color = getWuXingColor(element)
      return {
        backgroundColor: `${color}20`,
        color: color,
        borderColor: color,
      }
    }, [variant, element])

    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border transition-colors',
          variantStyles[variant],
          className
        )}
        style={variant === 'wuxing' ? wuxingStyle : undefined}
        {...props}
      >
        {dot && (
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: variant === 'wuxing' && element ? getWuXingColor(element) : undefined }}
          />
        )}
        {variant === 'wuxing' && element ? (
          <span className="font-serif font-bold">{getWuXingName(element)}</span>
        ) : (
          children
        )}
      </span>
    )
  }
)
Badge.displayName = 'Badge'

import * as React from 'react'
import { cn } from '@/lib/utils'

type SealSize = 'sm' | 'md' | 'lg'
type SealVariant = 'solid' | 'outline'

export interface SealProps extends React.HTMLAttributes<HTMLDivElement> {
  text: string
  size?: SealSize
  variant?: SealVariant
  rotate?: number
}

const sizeStyles: Record<SealSize, string> = {
  sm: 'w-12 h-12 text-xs',
  md: 'w-16 h-16 text-sm',
  lg: 'w-20 h-20 text-base',
}

const variantStyles: Record<SealVariant, string> = {
  solid:
    'bg-cinnabar-600 text-ink-50 border-2 border-cinnabar-700 shadow-seal',
  outline:
    'bg-transparent text-cinnabar-700 border-2 border-cinnabar-600',
}

export const Seal = React.forwardRef<HTMLDivElement, SealProps>(
  ({ className, text, size = 'md', variant = 'solid', rotate, ...props }, ref) => {
    const randomRotate = React.useMemo(() => {
      if (rotate !== undefined) return rotate
      return (Math.random() * 6 - 3)
    }, [rotate])

    return (
      <div
        ref={ref}
        className={cn(
          'seal-stamp animate-stamp',
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        style={{ transform: `rotate(${randomRotate}deg)` }}
        {...props}
      >
        <span className="font-serif font-bold tracking-widest">{text}</span>
      </div>
    )
  }
)
Seal.displayName = 'Seal'

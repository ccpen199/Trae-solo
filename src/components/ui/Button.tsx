import * as React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'seal' | 'ghost' | 'link'
type ButtonSize = 'sm' | 'md' | 'lg'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-jade-700 text-ink-50 border-2 border-gold-500 hover:bg-jade-800 hover:shadow-gold-glow focus-visible:ring-gold-500',
  secondary:
    'bg-ink-100 text-ink-800 border border-ink-300 hover:bg-ink-200 hover:border-ink-400 focus-visible:ring-jade-500',
  seal:
    'bg-cinnabar-600 text-ink-50 border-2 border-cinnabar-700 shadow-seal hover:bg-cinnabar-700 focus-visible:ring-cinnabar-500 font-serif tracking-wider',
  ghost:
    'bg-transparent text-ink-700 hover:bg-jade-50 hover:text-jade-700 border border-transparent focus-visible:ring-jade-500',
  link:
    'bg-transparent text-jade-700 underline-offset-4 hover:underline hover:text-jade-800 p-0 h-auto focus-visible:ring-jade-500',
}

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-7 text-base gap-2.5',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      leftIcon,
      rightIcon,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center rounded-md font-medium transition-all duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          loading && 'cursor-wait',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {!loading && leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  }
)

Button.displayName = 'Button'

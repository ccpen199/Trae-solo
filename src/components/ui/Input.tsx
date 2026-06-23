import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, leftIcon, rightIcon, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-ink-700">{label}</label>
        )}
        <div className="relative">
          <input
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-10 px-3 bg-ink-50/80 border-0 rounded-md',
              'border-b-2 border-ink-300',
              'focus:outline-none focus:border-b-2 focus:border-cinnabar-500 focus:ring-0',
              'placeholder:text-ink-400',
              'transition-all duration-200',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              error && 'border-b-cinnabar-500',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          />
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-1 text-xs text-cinnabar-600">
            <AlertCircle className="h-3 w-3" />
            {error}
          </div>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

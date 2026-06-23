import * as React from 'react'
import { AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-ink-700">{label}</label>
        )}
        <textarea
          ref={ref}
          disabled={disabled}
          className={cn(
            'w-full min-h-[80px] px-3 py-2 bg-ink-50/80 border-0 rounded-md resize-y',
            'border-b-2 border-ink-300',
            'focus:outline-none focus:border-b-2 focus:border-cinnabar-500 focus:ring-0',
            'placeholder:text-ink-400',
            'transition-all duration-200',
            error && 'border-b-cinnabar-500',
            disabled && 'opacity-50 cursor-not-allowed',
            className
          )}
          {...props}
        />
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
Textarea.displayName = 'Textarea'

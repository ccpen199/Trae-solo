import * as React from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'children'> {
  label?: string
  error?: string
  options: SelectOption[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, placeholder, disabled, ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="block text-sm font-medium text-ink-700">{label}</label>
        )}
        <div className="relative">
          <select
            ref={ref}
            disabled={disabled}
            className={cn(
              'w-full h-10 px-3 pr-10 bg-ink-50/80 border-0 rounded-md appearance-none',
              'border-b-2 border-ink-300',
              'focus:outline-none focus:border-b-2 focus:border-cinnabar-500 focus:ring-0',
              'transition-all duration-200',
              !props.value && placeholder && 'text-ink-400',
              error && 'border-b-cinnabar-500',
              disabled && 'opacity-50 cursor-not-allowed',
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 pointer-events-none">
            <ChevronDown className="h-4 w-4" />
          </div>
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
Select.displayName = 'Select'

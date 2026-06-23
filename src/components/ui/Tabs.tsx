import * as React from 'react'
import { cn } from '@/lib/utils'

export interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  children: React.ReactNode
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({ value, onValueChange, children, className }) => {
  return (
    <div className={cn('w-full', className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement, { value, onValueChange })
          : child
      )}
    </div>
  )
}
Tabs.displayName = 'Tabs'

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  onValueChange?: (value: string) => void
}

export const TabsList = React.forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, value, onValueChange, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-0 p-1 bg-ink-100/50 rounded-md',
          className
        )}
        role="tablist"
        {...props}
      >
        {React.Children.map(children, (child, index) => {
          if (!React.isValidElement(child)) return child
          const childrenArray = React.Children.toArray(children)
          const isLast = index === childrenArray.length - 1
          return (
            <>
              {React.cloneElement(child as React.ReactElement, {
                value,
                onValueChange,
              })}
              {!isLast && <div className="w-px h-5 bg-ink-300 mx-0.5" />}
            </>
          )
        })}
      </div>
    )
  }
)
TabsList.displayName = 'TabsList'

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tabValue: string
  value?: string
  onValueChange?: (value: string) => void
}

export const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ className, tabValue, value, onValueChange, children, ...props }, ref) => {
    const isActive = value === tabValue
    return (
      <button
        ref={ref}
        role="tab"
        aria-selected={isActive}
        onClick={() => onValueChange?.(tabValue)}
        className={cn(
          'relative inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-all duration-200 rounded-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar-500 focus-visible:ring-offset-2',
          isActive ? 'text-cinnabar-700' : 'text-ink-500 hover:text-ink-700',
          className
        )}
        {...props}
      >
        {children}
        {isActive && (
          <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-cinnabar-600 rounded-full" />
        )}
      </button>
    )
  }
)
TabsTrigger.displayName = 'TabsTrigger'

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  tabValue: string
  value?: string
  onValueChange?: (value: string) => void
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, tabValue, value, children, ...props }, ref) => {
    if (value !== tabValue) return null
    return (
      <div
        ref={ref}
        role="tabpanel"
        className={cn('mt-4 animate-fade-in', className)}
        {...props}
      >
        {children}
      </div>
    )
  }
)
TabsContent.displayName = 'TabsContent'

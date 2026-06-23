import { cn } from '../../utils'

interface TagProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'primary'
  size?: 'sm' | 'md'
  className?: string
  dot?: boolean
}

const variantMap: Record<string, string> = {
  default: 'bg-gray-500/15 text-gray-400',
  success: 'bg-green-500/15 text-green-400',
  warning: 'bg-yellow-500/15 text-yellow-400',
  danger: 'bg-red-500/15 text-red-400',
  info: 'bg-blue-500/15 text-blue-400',
  primary: 'bg-primary-500/15 text-primary-400',
}

export function Tag({ children, variant = 'default', size = 'sm', className, dot }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
        variantMap[variant],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', variantMap[variant].replace('/15', ''))} />}
      {children}
    </span>
  )
}

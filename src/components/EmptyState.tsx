import { cn } from '@/lib/utils'
import { LucideIcon, Inbox } from 'lucide-react'

interface EmptyStateProps {
  icon?: LucideIcon
  message: string
  description?: string
  className?: string
}

export default function EmptyState({
  icon: Icon = Inbox,
  message,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-gray-400', className)}>
      <Icon className="h-16 w-16 mb-4" />
      <p className="text-lg font-medium text-gray-500">{message}</p>
      {description && <p className="text-sm mt-1 text-gray-400">{description}</p>}
    </div>
  )
}

import { Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: { label: string; onClick: () => void }
}

export default function Empty({ title, description, icon, action }: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16')}>
      <div className="text-gray-300">
        {icon || <Inbox className="h-16 w-16" />}
      </div>
      <h3 className="mt-4 text-lg font-medium text-gray-500">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-gray-400">{description}</p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary/90"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}

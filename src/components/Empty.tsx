import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface EmptyProps {
  title?: string
  description?: string
  action?: ReactNode
  icon?: ReactNode
  className?: string
}

export default function Empty({
  title = '暂无数据',
  description,
  action,
  icon,
  className,
}: EmptyProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-16 px-6 text-center',
      'animate-fade-in',
      className
    )}>
      {icon || (
        <div className="w-20 h-20 rounded-2xl bg-midnight-800/50 flex items-center justify-center mb-5">
          <svg
            className="w-10 h-10 text-midnight-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875l2.25-2.25M12 13.875l-2.25-2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
            />
          </svg>
        </div>
      )}
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-midnight-400 max-w-sm mb-6">{description}</p>
      )}
      {action && <div className="flex gap-3">{action}</div>}
    </div>
  )
}

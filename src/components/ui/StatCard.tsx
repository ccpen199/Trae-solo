import type { ReactNode } from 'react'
import { cn } from '../../utils'

interface StatCardProps {
  label: string
  value: ReactNode
  trend?: ReactNode
  icon?: ReactNode
  iconColor?: string
  className?: string
}

export function StatCard({ label, value, trend, icon, iconColor = 'bg-primary-500/15 text-primary-400', className }: StatCardProps) {
  return (
    <div className={cn('panel p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-logistics-muted">{label}</div>
          <div className="mt-2 text-2xl font-semibold text-logistics-text">{value}</div>
          {trend && <div className="mt-1 text-xs text-logistics-muted">{trend}</div>}
        </div>
        {icon && (
          <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', iconColor)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

interface MetricCardProps {
  label: string
  value: ReactNode
  suffix?: string
  icon: ReactNode
  trend?: { value: string; positive: boolean }
  gradient?: string
  className?: string
}

export default function MetricCard({
  label,
  value,
  suffix,
  icon,
  trend,
  gradient = 'from-primary to-primary-light',
  className,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl p-5 text-white shadow-lg hover:shadow-xl transition-shadow duration-300',
        `bg-gradient-to-br ${gradient}`,
        className
      )}
    >
      <div className="absolute top-0 right-0 w-24 h-24 rounded-full bg-white/10 -translate-y-8 translate-x-8" />
      <div className="absolute bottom-0 left-0 w-16 h-16 rounded-full bg-white/5 translate-y-6 -translate-x-6" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-medium text-white/70">{label}</span>
          <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
            {icon}
          </div>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          {suffix && <span className="text-sm text-white/70">{suffix}</span>}
        </div>
        {trend && (
          <div className={cn('mt-2 text-xs font-medium', trend.positive ? 'text-green-300' : 'text-red-300')}>
            {trend.positive ? '↑' : '↓'} {trend.value}
          </div>
        )}
      </div>
    </div>
  )
}

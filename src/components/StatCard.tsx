import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  value: number
  label: string
  variant?: 'navy' | 'amber' | 'mint' | 'coral'
  prefix?: string
  className?: string
}

const variantClasses = {
  navy: 'bg-navy-50 text-navy-500',
  amber: 'bg-amber-50 text-amber-500',
  mint: 'bg-mint-50 text-mint-500',
  coral: 'bg-coral-50 text-coral-500',
}

const iconBgClasses = {
  navy: 'bg-navy-100 text-navy-500',
  amber: 'bg-amber-100 text-amber-600',
  mint: 'bg-mint-100 text-mint-600',
  coral: 'bg-coral-100 text-coral-600',
}

export default function StatCard({
  icon: Icon,
  value,
  label,
  variant = 'navy',
  prefix = '',
  className,
}: StatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    let start = 0
    const end = value
    if (end === 0) {
      setDisplayValue(0)
      return
    }
    const duration = 800
    const increment = end / (duration / 16)
    const timer = setInterval(() => {
      start += increment
      if (start >= end) {
        setDisplayValue(end)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 16)
    return () => clearInterval(timer)
  }, [value])

  return (
    <div
      className={cn(
        'rounded-xl bg-white p-5 shadow-sm border border-gray-100',
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-lg',
            iconBgClasses[variant]
          )}
        >
          <Icon className="h-6 w-6" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">
            {prefix}
            {variant === 'amber' || prefix === '¥'
              ? displayValue.toFixed(2)
              : displayValue}
          </p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

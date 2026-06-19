import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: number | string
  unit: string
  trend: 'up' | 'down' | 'stable'
  changePercent: number
  icon: ReactNode
}

const trendConfig = {
  up: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'from-emerald-400 to-gov-gold' },
  down: { icon: TrendingDown, color: 'text-gov-red', bg: 'bg-gov-red/5', border: 'from-gov-red to-gov-blue' },
  stable: { icon: Minus, color: 'text-gov-text-secondary', bg: 'bg-gray-50', border: 'from-gov-blue to-gov-blue-light' },
}

export default function StatCard({ label, value, unit, trend, changePercent, icon }: StatCardProps) {
  const config = trendConfig[trend]
  const TrendIcon = config.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="gov-card relative overflow-hidden p-5"
    >
      <div
        className={cn(
          'absolute top-0 left-0 right-0 h-1 bg-gradient-to-r',
          config.border
        )}
      />

      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gov-text-secondary mb-1">{label}</p>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-mono font-bold text-gov-text">{value}</span>
            <span className="text-sm text-gov-text-secondary">{unit}</span>
          </div>
        </div>

        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', config.bg)}>
          {icon}
        </div>
      </div>

      <div className="flex items-center gap-1 mt-3">
        <TrendIcon className={cn('w-3.5 h-3.5', config.color)} />
        <span className={cn('text-xs font-medium', config.color)}>
          {trend === 'stable' ? '持平' : `${changePercent > 0 ? '+' : ''}${changePercent}%`}
        </span>
        <span className="text-xs text-gov-text-muted ml-1">较上月</span>
      </div>
    </motion.div>
  )
}

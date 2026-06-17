import { ReactNode } from 'react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { motion } from 'framer-motion'

type Trend = 'up' | 'down' | 'stable'

interface StatCardProps {
  title: string
  value: string | number
  icon?: ReactNode
  trend?: Trend
  trendValue?: string
  description?: string
  color?: 'blue' | 'green' | 'yellow' | 'purple' | 'cyan'
  onClick?: () => void
}

const bgColorMap = {
  blue: 'bg-blue-500/10 text-blue-600',
  green: 'bg-green-500/10 text-green-600',
  yellow: 'bg-amber-500/10 text-amber-600',
  purple: 'bg-purple-500/10 text-purple-600',
  cyan: 'bg-cyan-500/10 text-cyan-600',
}

const trendColorMap = {
  up: 'text-green-600 bg-green-50',
  down: 'text-red-600 bg-red-50',
  stable: 'text-gray-600 bg-gray-50',
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  description,
  color = 'blue',
  onClick,
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : trend === 'down' ? ArrowDownRight : null

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={onClick ? { scale: 1.02, y: -2 } : undefined}
      className={`
        bg-white rounded-2xl p-5 border border-gray-100
        ${onClick ? 'cursor-pointer hover:shadow-md transition-all' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="text-sm font-medium text-gray-500">{title}</div>
        {icon && (
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bgColorMap[color]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="flex items-end gap-3">
        <div className="text-3xl font-bold text-gray-900 tracking-tight">{value}</div>
        {trend && trendValue && (
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-xs font-medium ${trendColorMap[trend]}`}>
            {TrendIcon && <TrendIcon className="w-3.5 h-3.5" />}
            {trendValue}
          </div>
        )}
      </div>
      {description && (
        <div className="mt-2 text-xs text-gray-500">{description}</div>
      )}
    </motion.div>
  )
}

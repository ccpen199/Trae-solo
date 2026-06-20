import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  unit?: string
  icon: ReactNode
  trend?: { value: number; isUp: boolean }
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'pink'
}

const colorMap = {
  blue: { bg: 'bg-blue-50', iconBg: 'bg-blue-100', iconText: 'text-blue-600', border: 'border-blue-100' },
  green: { bg: 'bg-green-50', iconBg: 'bg-green-100', iconText: 'text-green-600', border: 'border-green-100' },
  orange: { bg: 'bg-orange-50', iconBg: 'bg-orange-100', iconText: 'text-orange-600', border: 'border-orange-100' },
  red: { bg: 'bg-red-50', iconBg: 'bg-red-100', iconText: 'text-red-600', border: 'border-red-100' },
  purple: { bg: 'bg-purple-50', iconBg: 'bg-purple-100', iconText: 'text-purple-600', border: 'border-purple-100' },
  pink: { bg: 'bg-pink-50', iconBg: 'bg-pink-100', iconText: 'text-pink-600', border: 'border-pink-100' },
}

export default function StatCard({ title, value, unit, icon, trend, color }: StatCardProps) {
  const c = colorMap[color]

  return (
    <div className={`${c.bg} ${c.border} border rounded-xl p-5 shadow-sm`}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm text-slate-500 font-medium">{title}</span>
        <div className={`w-10 h-10 ${c.iconBg} rounded-lg flex items-center justify-center ${c.iconText}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold text-slate-800">{value}</span>
        {unit && <span className="text-sm text-slate-400">{unit}</span>}
      </div>
      {trend && (
        <div className="flex items-center gap-1 mt-2">
          {trend.isUp ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span className={`text-xs font-medium ${trend.isUp ? 'text-green-500' : 'text-red-500'}`}>
            {trend.isUp ? '+' : ''}{trend.value}%
          </span>
          <span className="text-xs text-slate-400 ml-0.5">较上周</span>
        </div>
      )}
    </div>
  )
}

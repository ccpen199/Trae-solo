import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: { value: number; positive: boolean }
  color?: string
}

export default function StatCard({ icon: Icon, label, value, trend, color = 'bg-blue-500' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 flex items-start gap-4">
      <div className={`${color} rounded-lg p-2.5 text-white`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 truncate">{label}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 text-xs mt-1 ${trend.positive ? 'text-emerald-600' : 'text-red-500'}`}>
            {trend.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {trend.positive ? '+' : ''}{trend.value}%
          </div>
        )}
      </div>
    </div>
  )
}

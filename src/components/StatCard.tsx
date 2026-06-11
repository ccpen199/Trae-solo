import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  icon: React.ElementType
  label: string
  value: string | number
  trend?: { value: number; direction: 'up' | 'down' }
  color?: 'emerald' | 'blue' | 'amber' | 'red'
}

const colorMap = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
}

const trendColorMap = {
  up: 'text-emerald-600',
  down: 'text-red-500',
}

export default function StatCard({ icon: Icon, label, value, trend, color = 'emerald' }: StatCardProps) {
  return (
    <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', colorMap[color])}>
          <Icon size={20} />
        </div>
        {trend && (
          <div className={cn('flex items-center gap-1 text-xs font-medium', trendColorMap[trend.direction])}>
            {trend.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{trend.value}%</span>
          </div>
        )}
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-slate-800">{value}</div>
        <div className="text-sm text-slate-500 mt-1">{label}</div>
      </div>
    </div>
  )
}

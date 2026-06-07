import type { ReactNode } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  icon: ReactNode
  value: string | number
  label: string
  sublabel?: string
  trend?: { value: number; positive: boolean }
  gradient?: string
}

export default function StatCard({ icon, value, label, sublabel, trend, gradient = 'gradient-primary' }: StatCardProps) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${gradient} flex items-center justify-center text-white shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-primary truncate">{value}</p>
        <p className="text-sm text-secondary mt-0.5">{label}</p>
        {sublabel && <p className="text-xs text-muted mt-0.5">{sublabel}</p>}
      </div>
      {trend && (
        <div
          className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
            trend.positive ? 'text-mint bg-emerald-50' : 'text-coral bg-red-50'
          }`}
        >
          {trend.positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {Math.abs(trend.value)}%
        </div>
      )}
    </div>
  )
}

import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  icon: React.ReactNode
  iconBg?: string
  suffix?: string
}

export default function StatCard({ title, value, change, icon, iconBg = 'bg-emerald-50 text-emerald-600', suffix }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {suffix && <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>}
          </p>
        </div>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconBg}`}>
          {icon}
        </div>
      </div>
      {change !== undefined && (
        <div className="mt-3 flex items-center gap-1 text-xs">
          {change >= 0 ? (
            <TrendingUp size={14} className="text-emerald-500" />
          ) : (
            <TrendingDown size={14} className="text-red-500" />
          )}
          <span className={change >= 0 ? 'text-emerald-600' : 'text-red-600'}>
            {change >= 0 ? '+' : ''}{change}%
          </span>
          <span className="text-gray-400">较上月</span>
        </div>
      )}
    </div>
  )
}

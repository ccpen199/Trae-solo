import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string | number
  trend?: { value: number; direction: 'up' | 'down' }
  accentColor?: string
}

export default function StatCard({ icon, label, value, trend, accentColor = 'border-primary' }: StatCardProps) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border-l-4 ${accentColor} card-hover`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-display font-bold text-secondary">{value}</p>
          {trend && (
            <div className={`flex items-center gap-1 mt-2 text-xs ${trend.direction === 'up' ? 'text-success' : 'text-danger'}`}>
              {trend.direction === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              <span>{trend.value}%</span>
            </div>
          )}
        </div>
        <div className="p-3 bg-gray-50 rounded-lg text-gray-400">
          {icon}
        </div>
      </div>
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  trend?: { value: number; label: string }
  color: 'primary' | 'accent' | 'success' | 'warning' | 'error'
}

const colorStyles: Record<StatCardProps['color'], { bg: string; icon: string }> = {
  primary: { bg: 'bg-primary/10', icon: 'text-primary' },
  accent: { bg: 'bg-accent/10', icon: 'text-accent' },
  success: { bg: 'bg-success/10', icon: 'text-success' },
  warning: { bg: 'bg-warning/10', icon: 'text-warning' },
  error: { bg: 'bg-error/10', icon: 'text-error' },
}

export default function StatCard({ icon: Icon, label, value, trend, color }: StatCardProps) {
  const styles = colorStyles[color]
  return (
    <div className="bg-white rounded-card shadow-card p-6 flex items-start gap-4">
      <div className={`${styles.bg} ${styles.icon} p-3 rounded-btn`}>
        <Icon size={28} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-gray-500 text-sm mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <div className={`flex items-center gap-1 mt-1 text-sm ${trend.value >= 0 ? 'text-success' : 'text-error'}`}>
            {trend.value >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            <span>{Math.abs(trend.value)}% {trend.label}</span>
          </div>
        )}
      </div>
    </div>
  )
}

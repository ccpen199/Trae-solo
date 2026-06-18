import { TrendingUp, Clock, CheckCircle, XCircle, Star, ArrowUp, ArrowDown } from 'lucide-react'

interface StatItem {
  label: string
  value: string
  trend: string
  trendUp: boolean
  icon: typeof TrendingUp
  color: string
  bg: string
}

const stats: StatItem[] = [
  { label: '本月申办量', value: '12,580', trend: '↑12.3%', trendUp: true, icon: TrendingUp, color: '#165DFF', bg: '#E8F0FF' },
  { label: '平均办理时长', value: '8.5分钟', trend: '↓5.2%', trendUp: false, icon: Clock, color: '#00B42A', bg: '#E8FFEA' },
  { label: '办结率', value: '94.2%', trend: '↑0.8%', trendUp: true, icon: CheckCircle, color: '#722ED1', bg: '#F0E8FF' },
  { label: '退件率', value: '5.8%', trend: '↓1.2%', trendUp: false, icon: XCircle, color: '#F53F3F', bg: '#FFECE8' },
  { label: '满意度', value: '98.5%', trend: '↑0.3%', trendUp: true, icon: Star, color: '#FF7D00', bg: '#FFF3E8' },
]

export default function EnhancedMonitorStatsCards() {
  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {stats.map((s) => {
        const TrendIcon = s.trendUp ? ArrowUp : ArrowDown
        const trendColor = s.label.includes('退件率') || s.label.includes('时长')
          ? (s.trendUp ? 'text-red-500' : 'text-green-500')
          : (s.trendUp ? 'text-green-500' : 'text-red-500')
        return (
          <div key={s.label} className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3.5">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <div className="text-xl font-bold text-gray-900 truncate">{s.value}</div>
                <div className={`flex items-center gap-0.5 text-xs font-medium ${trendColor} flex-shrink-0`}>
                  <TrendIcon size={11} />
                  <span>{s.trend.replace(/^[↑↓]/, '')}</span>
                </div>
              </div>
              <div className="text-xs text-gray-500 truncate">{s.label}</div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

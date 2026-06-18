import { TrendingUp, Clock, CheckCircle, XCircle, Star } from 'lucide-react'

const stats = [
  { label: '本月申办总量', value: '12,580', icon: TrendingUp, color: '#165DFF', bg: '#E8F0FF' },
  { label: '平均办理时长', value: '8.5分钟', icon: Clock, color: '#00B42A', bg: '#E8FFEA' },
  { label: '办结率', value: '94.2%', icon: CheckCircle, color: '#722ED1', bg: '#F0E8FF' },
  { label: '退件率', value: '5.8%', icon: XCircle, color: '#F53F3F', bg: '#FFECE8' },
  { label: '群众满意度', value: '98.5%', icon: Star, color: '#FF7D00', bg: '#FFF3E8' },
]

export default function MonitorStatsCards() {
  return (
    <div className="grid grid-cols-5 gap-4 mb-6">
      {stats.map((s) => (
        <div key={s.label} className="flex items-center gap-3 rounded-lg border border-gray-100 px-4 py-3.5">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.bg }}>
            <s.icon size={18} style={{ color: s.color }} />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-bold text-gray-900 truncate">{s.value}</div>
            <div className="text-xs text-gray-500 truncate">{s.label}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

import { AlertTriangle, ShieldOff, ShieldCheck, Ban } from 'lucide-react'

const stats = [
  { label: '待处理预警', value: 12, icon: AlertTriangle, iconColor: 'text-danger', iconBg: 'bg-danger/10' },
  { label: '本月拦截次数', value: 8, icon: ShieldOff, iconColor: 'text-warning', iconBg: 'bg-warning/10' },
  { label: '风控规则数', value: 4, icon: ShieldCheck, iconColor: 'text-primary', iconBg: 'bg-primary/10' },
  { label: '自动停发次数', value: 3, icon: Ban, iconColor: 'text-success', iconBg: 'bg-success/10' },
]

export default function StatsCards() {
  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {stats.map((stat) => (
        <div key={stat.label} className="bg-white rounded-xl p-4 border border-gray-100 flex items-center gap-4">
          <div className={`w-10 h-10 rounded-lg ${stat.iconBg} flex items-center justify-center flex-shrink-0`}>
            <stat.icon size={20} className={stat.iconColor} />
          </div>
          <div>
            <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

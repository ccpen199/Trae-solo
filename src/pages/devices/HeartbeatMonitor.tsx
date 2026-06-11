import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import PageHeader from '@/components/PageHeader'
import StatCard from '@/components/StatCard'
import { HardDrive, Wifi, WifiOff, Settings } from 'lucide-react'

const stats = [
  { icon: HardDrive, label: '设备总数', value: 128, color: 'blue' as const },
  { icon: Wifi, label: '在线', value: 112, color: 'emerald' as const },
  { icon: WifiOff, label: '离线', value: 12, color: 'red' as const },
  { icon: Settings, label: '维护中', value: 4, color: 'amber' as const },
]

const pieData = [
  { name: '在线', value: 112, color: '#10B981' },
  { name: '离线', value: 12, color: '#EF4444' },
  { name: '维护中', value: 4, color: '#F59E0B' },
]

const abnormalDevices = [
  { id: '1', name: '7号楼门禁', issue: '超过30分钟无心跳', level: 'critical' },
  { id: '2', name: '3号楼摄像头', issue: '信号弱，频繁断连', level: 'important' },
  { id: '3', name: '地下车库闸机', issue: '固件版本过旧', level: 'normal' },
]

const levelStyles: Record<string, string> = {
  critical: 'border-l-red-500 bg-red-50',
  important: 'border-l-amber-500 bg-amber-50',
  normal: 'border-l-blue-500 bg-blue-50',
}

const levelLabels: Record<string, string> = {
  critical: '严重', important: '重要', normal: '一般',
}

export default function HeartbeatMonitor() {
  const onlineRate = ((112 / 128) * 100).toFixed(1)

  return (
    <div className="space-y-6">
      <PageHeader title="心跳监控" subtitle="设备在线状态实时监控" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} color={s.color} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h3 className="font-semibold text-slate-800 mb-4">在线率</h3>
          <div className="flex items-center justify-center">
            <div className="relative w-56 h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={95}
                    dataKey="value"
                    strokeWidth={0}
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-slate-800">{onlineRate}%</span>
                <span className="text-sm text-slate-500">在线率</span>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-6 mt-4">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-2 text-sm text-slate-600">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="p-5 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">异常设备</h3>
          </div>
          <div className="p-5 space-y-3">
            {abnormalDevices.map((d) => (
              <div key={d.id} className={`border-l-4 rounded-lg p-4 ${levelStyles[d.level]}`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-800">{d.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${d.level === 'critical' ? 'bg-red-100 text-red-700' : d.level === 'important' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                    {levelLabels[d.level]}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mt-1">{d.issue}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

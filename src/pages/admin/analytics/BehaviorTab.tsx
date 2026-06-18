import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'

const PIE_COLORS = ['#1A237E', '#FF8F00', '#283593']
const BAR_COLORS = ['#1A237E', '#283593', '#1A237E', '#FF8F00', '#283593', '#1A237E']

const eventTypeLabels: Record<string, string> = {
  ar_launch: 'AR启动',
  poi_enter: '景点进入',
  poi_stay: '景点停留',
  interaction_complete: '互动完成',
  share: '分享',
  audio_finish: '音频完成',
}

export default function BehaviorTab() {
  const { behaviors } = useAnalyticsStore()

  const interactionRate = useMemo(() => {
    const total = behaviors.length
    if (total === 0) return 0
    const completed = behaviors.filter((b) => b.eventType === 'interaction_complete').length
    return completed / total
  }, [behaviors])

  const completionData = useMemo(() => [
    { name: '互动完成', value: +(interactionRate * 100).toFixed(1) },
    { name: '未完成', value: +((1 - interactionRate) * 100).toFixed(1) },
  ], [interactionRate])

  const funnelData = useMemo(() => {
    const steps = ['ar_launch', 'poi_enter', 'interaction_complete', 'share']
    return steps.map((et) => ({
      name: eventTypeLabels[et] ?? et,
      count: behaviors.filter((b) => b.eventType === et).length,
    }))
  }, [behaviors])

  const deviceData = useMemo(() => {
    const map: Record<string, number> = { ios: 0, android: 0, other: 0 }
    behaviors.forEach((b) => {
      const dt = b.deviceType ?? 'other'
      map[dt] = (map[dt] || 0) + 1
    })
    return [
      { name: 'iOS', value: map.ios },
      { name: 'Android', value: map.android },
      { name: '其他', value: map.other },
    ]
  }, [behaviors])

  const eventDistribution = useMemo(() => {
    const map: Record<string, number> = {}
    behaviors.forEach((b) => {
      map[b.eventType] = (map[b.eventType] || 0) + 1
    })
    return Object.entries(map)
      .map(([k, v]) => ({ name: eventTypeLabels[k] ?? k, count: v }))
      .sort((a, b) => b.count - a.count)
  }, [behaviors])

  const tooltipStyle = {
    background: '#1E1E2E',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8,
    fontSize: 12,
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
        <h3 className="mb-3 text-sm font-medium text-gray-300">互动完成率</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={completionData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                dataKey="value"
                stroke="none"
              >
                {completionData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F5F5F0' }} />
              <Legend formatter={(v: string) => <span className="text-xs text-gray-400">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
        <h3 className="mb-3 text-sm font-medium text-gray-300">分享路径漏斗</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={funnelData} layout="vertical">
              <XAxis type="number" tick={{ fill: '#9E9E9E', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: '#9E9E9E', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={80}
              />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F5F5F0' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {funnelData.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
        <h3 className="mb-3 text-sm font-medium text-gray-300">设备分布</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={deviceData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                stroke="none"
                label={({ name, percent }: { name: string; percent: number }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
              >
                {deviceData.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F5F5F0' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
        <h3 className="mb-3 text-sm font-medium text-gray-300">事件类型分布</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={eventDistribution}>
              <XAxis
                dataKey="name"
                tick={{ fill: '#9E9E9E', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={50}
              />
              <YAxis tick={{ fill: '#9E9E9E', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: '#F5F5F0' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {eventDistribution.map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

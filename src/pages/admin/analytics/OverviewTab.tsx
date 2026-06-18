import { Users, Smartphone, Clock, ThumbsUp, TrendingUp } from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import { useScenicStore } from '@/store/useScenicStore'
import type { OverviewMetrics } from '@/types'

function MetricCard({ icon: Icon, label, value, unit, color }: {
  icon: React.ElementType; label: string; value: string | number; unit?: string; color: string
}) {
  return (
    <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-4">
      <div className="flex items-center gap-2 text-gray-500">
        <Icon className={cn('h-4 w-4', color)} />
        <span className="text-xs">{label}</span>
      </div>
      <div className="mt-2 font-mono text-2xl font-semibold text-gray-100">
        {typeof value === 'number' ? value.toLocaleString() : value}
        {unit && <span className="ml-1 text-sm text-gray-500">{unit}</span>}
      </div>
    </div>
  )
}

export default function OverviewTab() {
  const { overviewMetrics, selectedScenicId, loadOverview } = useAnalyticsStore()
  const { scenicAreas } = useScenicStore()

  const m: OverviewMetrics = overviewMetrics ?? {
    totalVisitors: 0, arUsageRate: 0, avgDwellTime: 0, satisfaction: 0,
    visitorTrend: [], topScenics: [],
  }

  const handleScenicChange = (id: string) => {
    useAnalyticsStore.getState().setSelectedScenic(id || null)
    loadOverview(id || undefined)
  }

  const trend = (m.visitorTrend ?? []).slice(-7)

  return (
    <div className="space-y-6">
      <select
        value={selectedScenicId ?? ''}
        onChange={(e) => handleScenicChange(e.target.value)}
        className="rounded-lg border border-white/10 bg-[#1E1E2E] px-3 py-2 text-sm text-gray-300 outline-none focus:border-indigo-800"
      >
        <option value="">全部景区</option>
        {scenicAreas.map((s) => (
          <option key={s.id} value={s.id}>{s.name}</option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard icon={Users} label="总游客数" value={m.totalVisitors} color="text-indigo-400" />
        <MetricCard icon={Smartphone} label="AR使用率" value={((m.arUsageRate ?? m.interactionRate ?? 0) * 100).toFixed(1)} unit="%" color="text-amber-500" />
        <MetricCard icon={Clock} label="平均停留时长" value={(m.avgDwellTime ?? m.avgStayDuration ?? 0).toFixed(1)} unit="小时" color="text-indigo-400" />
        <MetricCard icon={ThumbsUp} label="满意度" value={((m.satisfaction ?? 0.85) * 100).toFixed(0)} unit="%" color="text-amber-500" />
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-medium text-gray-300">7天游客趋势</span>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trend}>
              <defs>
                <linearGradient id="visitorGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1A237E" stopOpacity={0.6} />
                  <stop offset="100%" stopColor="#1A237E" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fill: '#9E9E9E', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: string) => v.slice(5)} />
              <YAxis tick={{ fill: '#9E9E9E', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ background: '#1E1E2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#9E9E9E' }}
                itemStyle={{ color: '#F5F5F0' }}
              />
              <Area type="monotone" dataKey="count" stroke="#1A237E" fill="url(#visitorGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
        <h3 className="mb-3 text-sm font-medium text-gray-300">热门景区排行</h3>
        <div className="space-y-2">
          {(m.topScenics ?? []).map((s, i) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg px-3 py-2 transition hover:bg-white/5">
              <div className="flex items-center gap-3">
                <span className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  i === 0 ? 'bg-amber-600/20 text-amber-500' : 'bg-white/5 text-gray-500'
                )}>
                  {i + 1}
                </span>
                <span className="text-sm text-gray-200">{s.name}</span>
              </div>
              <span className="font-mono text-sm text-gray-400">{s.visitors.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

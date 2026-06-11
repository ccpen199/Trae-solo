import {
  AreaChart, BarChart, Bar, Area,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts'
import { AlertTriangle, TrendingUp, Shield, MapPin } from 'lucide-react'
import { useAppStore } from '@/store/useAppStore'
import { mockDashboardData } from '@/mock/data'

const data = mockDashboardData

const CompletionRing = ({ rate }: { rate: number }) => {
  const r = 36
  const circ = 2 * Math.PI * r
  const offset = circ - (rate / 100) * circ
  return (
    <div className="relative w-20 h-20">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r={r} fill="none" stroke="#E2E8F0" strokeWidth="6" />
        <circle
          cx="40" cy="40" r={r} fill="none" stroke="#1B3A5C" strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-gov-blue">
        {rate}%
      </span>
    </div>
  )
}

const levelConfig = {
  critical: { label: '紧急', cls: 'bg-red-100 text-red-700 border-red-200', icon: '🔴' },
  warning: { label: '预警', cls: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🟠' },
}

const barColors = [
  '#1B3A5C', '#234B73', '#2A5580', '#326693', '#3A77A6',
  '#4C8AB8', '#5E9BCA', '#70ACDC', '#82BDEE', '#94CEFF',
]

export default function DataBoard() {
  const { currentRole } = useAppStore()
  if (currentRole !== 'agent') {
    return (
      <div className="min-h-screen bg-surface-primary p-6 flex items-center justify-center animate-fade-in-up">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 flex items-center justify-center">
            <Shield className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="font-serif text-xl font-bold text-gov-blue-dark mb-2">数据看板 - 权限受限</h2>
          <p className="text-sm text-gray-500 mb-1">此功能仅限基层经办人员访问</p>
          <p className="text-xs text-gray-400 mt-3 leading-relaxed">
            数据看板包含全国社保服务调用量、办结率、超期预警、地域热点分析等数据，<br />
            仅授权基层经办人员按行政区划查看。如需访问请切换至经办人员角色。
          </p>
        </div>
      </div>
    )
  }

  const callsChartData = data.callsTrend.map((d) => ({
    date: d.date.slice(5),
    调用量: d.count,
  }))

  const topServicesData = [...data.topServices]
    .sort((a, b) => a.calls - b.calls)
    .map((s) => ({ name: s.name, 调用量: s.calls, 完结率: s.completionRate }))

  const hotspotsData = data.provinceHotspots.map((p) => ({
    province: p.province,
    调用量: p.count,
    growth: p.growth,
  }))

  return (
    <div className="min-h-screen bg-surface-primary p-6 space-y-6 animate-fade-in-up">
      <div>
        <h1 className="font-serif text-2xl font-bold text-gov-blue-dark">数据看板</h1>
        <p className="text-sm text-gray-500 mt-1">全国社保服务运行态势</p>
      </div>

      <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
        <div className="gov-card p-5 bg-gradient-to-br from-gov-blue to-gov-blue-dark text-white">
          <div className="flex items-center gap-2 opacity-80">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm">服务调用总量</span>
          </div>
          <p className="text-3xl font-bold mt-3">{data.totalCalls.toLocaleString()}</p>
          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs bg-green-400/20 text-green-200">
            <TrendingUp className="w-3 h-3" /> +12.3%
          </span>
        </div>

        <div className="gov-card p-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
              <Shield className="w-4 h-4" />
              <span>办结率</span>
            </div>
            <p className="text-3xl font-bold text-gov-blue mt-3">{data.completionRate}%</p>
          </div>
          <CompletionRing rate={data.completionRate} />
        </div>

        <div className="gov-card p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>超期预警</span>
          </div>
          <div className="flex items-end gap-2 mt-3">
            <p className="text-3xl font-bold text-red-600">
              {data.overdueWarnings.filter((w) => w.level === 'critical').length + data.overdueWarnings.filter((w) => w.level === 'warning').length}
            </p>
            <span className="text-sm text-gray-500 mb-1">件</span>
          </div>
          <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600 border border-red-200">
            <AlertTriangle className="w-3 h-3" /> 待处理
          </span>
        </div>

        <div className="gov-card p-5">
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <MapPin className="w-4 h-4" />
            <span>覆盖省份</span>
          </div>
          <p className="text-3xl font-bold text-gov-blue mt-3">31</p>
          <span className="text-xs text-gray-400 mt-2 block">全国覆盖</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        <div className="gov-card p-5">
          <h2 className="gov-section-title mb-4">服务调用量趋势</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={callsChartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="callsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1B3A5C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#1B3A5C" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F8" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip
                  formatter={(value: number) => [value.toLocaleString(), '调用量']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                />
                <Area type="monotone" dataKey="调用量" stroke="#1B3A5C" strokeWidth={2} fill="url(#callsGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="gov-card p-5">
          <h2 className="gov-section-title mb-4">TOP服务排行</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topServicesData} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F8" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} width={70} />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    name === '调用量' ? value.toLocaleString() : `${value}%`,
                    name,
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="调用量" radius={[0, 4, 4, 0]} barSize={16}>
                  {topServicesData.map((_, i) => (
                    <Cell key={i} fill={barColors[i % barColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
        <div className="gov-card p-5">
          <h2 className="gov-section-title mb-4">超期预警列表</h2>
          <div className="space-y-3">
            {data.overdueWarnings.map((item) => {
              const cfg = levelConfig[item.level]
              return (
                <div
                  key={item.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${cfg.cls}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{cfg.icon}</span>
                      <span className="text-sm font-medium truncate">{item.service}</span>
                    </div>
                    <p className="text-xs opacity-70 mt-1">申请人：{item.applicant}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full border border-current">
                      {cfg.label}
                    </span>
                    <span className={`text-lg font-bold ${item.level === 'critical' ? 'text-red-600' : 'text-orange-500'}`}>
                      {item.days}<span className="text-xs font-normal ml-0.5">天</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="gov-card p-5">
          <h2 className="gov-section-title mb-4">地域热点分析</h2>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hotspotsData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1B3A5C" stopOpacity={1} />
                    <stop offset="100%" stopColor="#3A77A6" stopOpacity={0.8} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F3F8" />
                <XAxis dataKey="province" tick={{ fontSize: 11, fill: '#64748B' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 10000).toFixed(0)}万`} />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === '调用量') return [value.toLocaleString(), name]
                    return [`${value}%`, name]
                  }}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}
                />
                <Bar dataKey="调用量" radius={[4, 4, 0, 0]} barSize={28} fill="url(#barGrad)">
                  {hotspotsData.map((_, i) => (
                    <Cell key={i} fill={`url(#barGrad)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            {hotspotsData.map((p) => (
              <span key={p.province} className="text-xs text-gray-500">
                {p.province} <span className="text-green-600 font-medium">+{p.growth}%</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

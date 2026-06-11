import { useState } from 'react'
import { useStore } from '@/store'
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Users, Target, Calendar, Download, Lightbulb, ShieldAlert, RotateCcw, ArrowUpRight, AlertTriangle, Award } from 'lucide-react'

type DateRange = 'week' | 'month' | 'quarter'

const FUNNEL_DATA = [
  { stage: '投递', count: 1240, fill: '#1e3a5f' },
  { stage: '初筛', count: 680, fill: '#2d5a8e' },
  { stage: '面试', count: 320, fill: '#4a7fc4' },
  { stage: 'Offer', count: 95, fill: '#f59e0b' },
]

const DISTRIBUTION_DATA = [
  { range: '0-20', count: 45 },
  { range: '20-40', count: 120 },
  { range: '40-60', count: 280 },
  { range: '60-80', count: 420 },
  { range: '80-100', count: 175 },
]

const SOURCE_DATA = [
  { name: '官网', value: 340, color: '#1e3a5f' },
  { name: '猎聘', value: 280, color: '#2d5a8e' },
  { name: 'BOSS直聘', value: 420, color: '#f59e0b' },
  { name: '内推', value: 200, color: '#4a7fc4' },
]

const MONTHLY_DATA = [
  { month: '1月', 投递数: 180, 面试数: 45 },
  { month: '2月', 投递数: 220, 面试数: 58 },
  { month: '3月', 投递数: 310, 面试数: 82 },
  { month: '4月', 投递数: 280, 面试数: 70 },
  { month: '5月', 投递数: 350, 面试数: 95 },
  { month: '6月', 投递数: 400, 面试数: 110 },
]

const STATS_BY_RANGE: Record<DateRange, { total: number; avgMatch: number; interviewRate: number }> = {
  week: { total: 186, avgMatch: 72, interviewRate: 28 },
  month: { total: 1240, avgMatch: 68, interviewRate: 25.8 },
  quarter: { total: 3680, avgMatch: 65, interviewRate: 23.2 },
}

const INSIGHTS = [
  { title: '本月投递量环比增长14.3%', desc: '5月投递350份，6月投递400份，增长趋势明显，建议增加初筛人力配置', icon: ArrowUpRight, color: 'text-emerald-600 bg-emerald-50' },
  { title: 'BOSS直聘渠道占比最高', desc: 'BOSS直聘贡献420份投递，占总量的33.9%，其次是官网27.4%和猎聘22.6%', icon: Award, color: 'text-amber-600 bg-amber-50' },
  { title: '面试转化率低于行业平均', desc: '当前面试转化率25.8%，行业平均约30%，建议优化岗位描述或调整筛选阈值', icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
]

function AccessDenied({ onSwitch }: { onSwitch: () => void }) {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="glass-card p-10 text-center max-w-md">
        <div className="bg-red-50 p-4 rounded-full inline-flex mb-4">
          <ShieldAlert className="h-10 w-10 text-red-400" />
        </div>
        <h2 className="font-display text-xl font-semibold text-navy-700 mb-2">访问受限</h2>
        <p className="text-graphite/60 mb-6">该功能仅限HR角色访问</p>
        <button className="btn-primary inline-flex items-center gap-2" onClick={onSwitch}>
          <RotateCcw className="h-4 w-4" /> 切换至HR角色
        </button>
      </div>
    </div>
  )
}

export default function HrAnalytics() {
  const { currentRole, switchRole } = useStore()
  const [range, setRange] = useState<DateRange>('month')
  const stats = STATS_BY_RANGE[range]

  if (currentRole !== 'hr') {
    return <AccessDenied onSwitch={() => switchRole('hr')} />
  }

  const RANGE_OPTIONS: { key: DateRange; label: string }[] = [
    { key: 'week', label: '本周' },
    { key: 'month', label: '本月' },
    { key: 'quarter', label: '本季度' },
  ]

  const rangeLabel = RANGE_OPTIONS.find((o) => o.key === range)?.label ?? ''

  const handleExport = () => {
    const report = [
      `投递分析报告 — ${rangeLabel}`,
      '',
      `总投递数: ${stats.total}`,
      `平均匹配度: ${stats.avgMatch}%`,
      `面试转化率: ${stats.interviewRate}%`,
      '',
      '投递漏斗:',
      ...FUNNEL_DATA.map((d) => `  ${d.stage}: ${d.count}`),
      '',
      '来源分布:',
      ...SOURCE_DATA.map((d) => `  ${d.name}: ${d.value} (${(d.value / SOURCE_DATA.reduce((s, x) => s + x.value, 0) * 100).toFixed(1)}%)`),
      '',
      '关键发现:',
      ...INSIGHTS.map((i) => `  - ${i.title}: ${i.desc}`),
    ].join('\n')
    alert(report)
  }

  return (
    <div className="min-h-screen bg-ivory p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">投递分析报告</h1>
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((opt) => (
            <button key={opt.key} onClick={() => setRange(opt.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${range === opt.key ? 'bg-navy-500 text-white shadow-md' : 'bg-white/70 text-graphite/60 hover:bg-white hover:text-navy-500'}`}>
              {opt.label}
            </button>
          ))}
          <button className="btn-primary inline-flex items-center gap-2 text-sm ml-3" onClick={handleExport}>
            <Download className="h-4 w-4" /> 导出报告
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: '总投递数', value: stats.total, icon: TrendingUp, color: 'text-navy-500 bg-navy-50', suffix: '' },
          { label: '平均匹配度', value: stats.avgMatch, icon: Target, color: 'text-amber-600 bg-amber-50', suffix: '%' },
          { label: '面试转化率', value: stats.interviewRate, icon: Users, color: 'text-emerald-600 bg-emerald-50', suffix: '%' },
        ].map((s) => (
          <div key={s.label} className="glass-card p-5 flex items-center gap-4">
            <div className={`${s.color} p-3 rounded-xl`}><s.icon className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-graphite/50">{s.label}</p>
              <p className="text-2xl font-bold text-navy-700">{s.value}{s.suffix}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="h-5 w-5 text-amber-500" />
          <h3 className="font-semibold text-navy-700 text-lg">关键发现</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {INSIGHTS.map((insight) => (
            <div key={insight.title} className="glass-card p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className={`${insight.color} p-2.5 rounded-xl`}><insight.icon className="h-4 w-4" /></div>
                <h4 className="text-sm font-semibold text-navy-700 leading-tight">{insight.title}</h4>
              </div>
              <p className="text-xs text-graphite/60 leading-relaxed">{insight.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="glass-card p-5">
          <h3 className="font-semibold text-navy-700 mb-4">投递漏斗</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={FUNNEL_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis type="number" tick={{ fill: '#374151', fontSize: 12 }} />
              <YAxis dataKey="stage" type="category" tick={{ fill: '#374151', fontSize: 13 }} width={50} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold text-navy-700 mb-4">匹配度分布</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={DISTRIBUTION_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="range" tick={{ fill: '#374151', fontSize: 12 }} />
              <YAxis tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Bar dataKey="count" fill="#1e3a5f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="glass-card p-5">
          <h3 className="font-semibold text-navy-700 mb-4">来源分析</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={SOURCE_DATA} cx="50%" cy="50%" outerRadius={100} innerRadius={50} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={{ stroke: '#9ca3af' }}>
                {SOURCE_DATA.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="font-semibold text-navy-700 mb-4">月度趋势</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={MONTHLY_DATA}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fill: '#374151', fontSize: 12 }} />
              <YAxis tick={{ fill: '#374151', fontSize: 12 }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
              <Legend />
              <Line type="monotone" dataKey="投递数" stroke="#1e3a5f" strokeWidth={2.5} dot={{ r: 4, fill: '#1e3a5f' }} />
              <Line type="monotone" dataKey="面试数" stroke="#f59e0b" strokeWidth={2.5} dot={{ r: 4, fill: '#f59e0b' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

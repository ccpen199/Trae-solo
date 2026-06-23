import * as React from 'react'
import { Users, FileText, Award, DollarSign, TrendingUp } from 'lucide-react'
import api from '@/lib/api'

interface StatCardProps {
  title: string
  value: string
  change: string
  icon: React.ReactNode
  color: string
}

function StatCard({ title, value, change, icon, color }: StatCardProps) {
  return (
    <div className="rounded-lg bg-ink-800/50 border border-jade-900/50 p-5">
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {icon}
        </div>
        <div className="flex items-center gap-1 text-xs text-jade-300">
          <TrendingUp className="w-3 h-3" />
          <span>{change}</span>
        </div>
      </div>
      <div className="font-serif text-3xl font-bold text-ink-50 mb-1">{value}</div>
      <div className="text-sm text-jade-300">{title}</div>
    </div>
  )
}

function TrendChart() {
  const data = [65, 78, 52, 89, 72, 95, 88, 102, 95, 110, 125, 118]
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const maxVal = Math.max(...data)
  const width = 700
  const height = 250
  const padding = { top: 20, right: 20, bottom: 30, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom

  const points = data.map((v, i) => {
    const x = padding.left + (i / (data.length - 1)) * chartWidth
    const y = padding.top + chartHeight - (v / maxVal) * chartHeight
    return { x, y }
  })

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const areaPath = `${linePath} L${points[points.length - 1].x},${padding.top + chartHeight} L${points[0].x},${padding.top + chartHeight} Z`

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#55988e" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#55988e" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map((t, i) => {
        const y = padding.top + chartHeight * t
        return (
          <line
            key={i}
            x1={padding.left}
            y1={y}
            x2={padding.left + chartWidth}
            y2={y}
            stroke="#2a5d56"
            strokeWidth={1}
            strokeDasharray="4 4"
            opacity={0.4}
          />
        )
      })}
      <path d={areaPath} fill="url(#areaGradient)" />
      <path d={linePath} fill="none" stroke="#7dbaab" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={4} fill="#1a3a3a" stroke="#dcbd53" strokeWidth={2} />
          <text x={p.x} y={height - 10} textAnchor="middle" className="fill-jade-300" style={{ fontSize: 11 }}>
            {months[i]}
          </text>
        </g>
      ))}
      {[0, 0.5, 1].map((t, i) => {
        const y = padding.top + chartHeight * (1 - t)
        return (
          <text
            key={i}
            x={padding.left - 8}
            y={y + 4}
            textAnchor="end"
            className="fill-jade-400"
            style={{ fontSize: 11 }}
          >
            {Math.round(maxVal * t)}
          </text>
        )
      })}
    </svg>
  )
}

export default function AdminDashboardHome() {
  const [stats, setStats] = React.useState({
    userCount: 12586,
    namingCount: 35420,
    masterCount: 28,
    monthlyRevenue: 128600,
  })

  React.useEffect(() => {
    const loadStats = async () => {
      try {
        // 尝试加载真实数据，失败则使用 mock
      } catch {
        // 使用 mock 数据
      }
    }
    loadStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl font-bold text-ink-50 mb-1">数据看板</h1>
        <p className="text-sm text-jade-300">平台运营数据概览</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="用户总数"
          value={stats.userCount.toLocaleString()}
          change="+12.5%"
          icon={<Users className="w-5 h-5" />}
          color="#55988e"
        />
        <StatCard
          title="起名次数"
          value={stats.namingCount.toLocaleString()}
          change="+18.3%"
          icon={<FileText className="w-5 h-5" />}
          color="#dcbd53"
        />
        <StatCard
          title="命名师数"
          value={stats.masterCount.toString()}
          change="+2"
          icon={<Award className="w-5 h-5" />}
          color="#c85959"
        />
        <StatCard
          title="当月收入"
          value={`¥${stats.monthlyRevenue.toLocaleString()}`}
          change="+25.8%"
          icon={<DollarSign className="w-5 h-5" />}
          color="#7dbaab"
        />
      </div>

      <div className="rounded-lg bg-ink-800/50 border border-jade-900/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-serif text-lg font-semibold text-ink-50">起名趋势</h2>
            <p className="text-xs text-jade-300">近12个月起名次数统计</p>
          </div>
        </div>
        <TrendChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-lg bg-ink-800/50 border border-jade-900/50 p-5">
          <h2 className="font-serif text-lg font-semibold text-ink-50 mb-4">最新用户</h2>
          <div className="space-y-3">
            {[
              { phone: '138****8888', nickname: '雅名轩用户', date: '2024-06-20', role: 'member' },
              { phone: '139****6666', nickname: '新手爸妈', date: '2024-06-19', role: 'user' },
              { phone: '137****5555', nickname: '书香门第', date: '2024-06-19', role: 'member' },
            ].map((u, i) => (
              <div key={i} className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-jade-800 flex items-center justify-center">
                    <span className="text-xs font-serif text-ink-50">{u.nickname.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="text-sm text-ink-50">{u.nickname}</div>
                    <div className="text-xs text-jade-400">{u.phone}</div>
                  </div>
                </div>
                <div className="text-xs text-jade-300">{u.date}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg bg-ink-800/50 border border-jade-900/50 p-5">
          <h2 className="font-serif text-lg font-semibold text-ink-50 mb-4">待审核</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-md bg-jade-900/30 border border-jade-800/50">
              <div>
                <div className="text-sm text-ink-50">命名师审核</div>
                <div className="text-xs text-jade-300">3 条待处理</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-cinnabar-600 flex items-center justify-center text-sm font-bold text-ink-50">3</div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-md bg-jade-900/30 border border-jade-800/50">
              <div>
                <div className="text-sm text-ink-50">案例审核</div>
                <div className="text-xs text-jade-300">8 条待处理</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-sm font-bold text-ink-900">8</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

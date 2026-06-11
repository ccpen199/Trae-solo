import { TrendingUp, TrendingDown, Clock, Star, Users, Target } from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { funnelData, positionFillCycles, headhunterROI } from '../data/mockData'
import { usePositionStore } from '../store/PositionStore'

const funnelColors = [
  '#3b82f6',
  '#3b82f6',
  '#2563eb',
  '#1d4ed8',
  '#0ea5e9',
  '#06b6d4',
  '#10b981',
]

function MetricCard({
  icon: Icon,
  label,
  value,
  sub,
  trend,
  accent,
}: {
  icon: React.ElementType
  label: string
  value: string
  sub?: string
  trend?: 'up' | 'down'
  accent?: string
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 shadow-sm hover:shadow-md transition-shadow">
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${
          accent === 'amber'
            ? 'bg-amber-50 text-amber-500'
            : accent === 'green'
              ? 'bg-emerald-50 text-emerald-500'
              : accent === 'red'
                ? 'bg-red-50 text-red-500'
                : 'bg-blue-50 text-blue-600'
        }`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        {sub && (
          <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
            {trend === 'up' && <TrendingUp className="w-3 h-3 text-emerald-500" />}
            {trend === 'down' && <TrendingDown className="w-3 h-3 text-red-500" />}
            {sub}
          </p>
        )}
      </div>
    </div>
  )
}

function FunnelChart() {
  return (
    <div className="space-y-2.5">
      {funnelData.map((item, i) => (
        <div key={item.stage} className="flex items-center gap-3">
          <div className="w-20 text-right text-sm text-slate-600 flex-shrink-0">{item.stage}</div>
          <div className="flex-1 relative h-8">
            <div className="absolute inset-0 bg-slate-100 rounded-md" />
            <div
              className="absolute inset-y-0 left-0 rounded-md flex items-center px-3 transition-all duration-500"
              style={{
                width: `${Math.max(item.rate, 3)}%`,
                background: `linear-gradient(90deg, ${funnelColors[i]}, ${funnelColors[i]}dd)`,
              }}
            >
              <span className="text-white text-xs font-semibold whitespace-nowrap">
                {item.count} ({item.rate}%)
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const cycleBarColor = (d: (typeof positionFillCycles)[0]) => {
  const ratio = d.avgDays / d.target
  if (ratio >= 1.5) return '#ef4444'
  if (ratio >= 1.2) return '#f59e0b'
  return '#10b981'
}

function TargetBarShape(props: any) {
  const { x, y, width, height, payload, background } = props
  const targetX = x * (payload.target / payload.avgDays) + (background ? background.x : 0)
  const actualTargetX = background
    ? background.x + (background.width * payload.target) / Math.max(payload.avgDays, 1)
    : x + (width * payload.target) / Math.max(payload.avgDays, 1)
  const color = cycleBarColor(payload)

  return (
    <g>
      <rect x={background?.x ?? x} y={y} width={background?.width ?? width} height={height} fill="#f1f5f9" rx={4} />
      <rect x={background?.x ?? x} y={y} width={width} height={height} fill={color} rx={4} />
      <line
        x1={actualTargetX}
        y1={y - 2}
        x2={actualTargetX}
        y2={y + height + 2}
        stroke="#1e293b"
        strokeWidth={2}
        strokeDasharray="3 2"
      />
      <text x={actualTargetX} y={y - 6} textAnchor="middle" fill="#475569" fontSize={10}>
        目标{payload.target}天
      </text>
    </g>
  )
}

function PositionCycleChart({ data = positionFillCycles }: { data?: typeof positionFillCycles }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 40, top: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
        <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} />
        <YAxis
          dataKey="position"
          type="category"
          tick={{ fontSize: 12, fill: '#334155' }}
          width={100}
        />
        <Tooltip
          contentStyle={{
            borderRadius: 8,
            border: '1px solid #e2e8f0',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
            fontSize: 13,
          }}
          formatter={(value: number, name: string) => {
            if (name === 'avgDays') return [`${value}天`, '实际周期']
            return [value, name]
          }}
        />
        <Bar dataKey="avgDays" barSize={24} name="avgDays" shape={<TargetBarShape />}>
          {data.map((_, idx) => (
            <Cell key={idx} fill="transparent" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function ROITable() {
  const roiColor = (roi: number) => {
    if (roi >= 3.0) return 'text-emerald-600 bg-emerald-50'
    if (roi >= 2.5) return 'text-amber-600 bg-amber-50'
    return 'text-red-600 bg-red-50'
  }

  const totals = {
    positions: headhunterROI.reduce((s, r) => s + r.positions, 0),
    filled: headhunterROI.reduce((s, r) => s + r.filled, 0),
    avgFillRate:
      headhunterROI.reduce((s, r) => s + r.fillRate, 0) / headhunterROI.length,
    avgDays: Math.round(
      headhunterROI.reduce((s, r) => s + r.avgDays, 0) / headhunterROI.length,
    ),
    avgCost: Math.round(
      headhunterROI.reduce((s, r) => s + r.costPerHire, 0) / headhunterROI.length,
    ),
    avgRoi: headhunterROI.reduce((s, r) => s + r.roi, 0) / headhunterROI.length,
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200">
            <th className="text-left py-3 px-4 text-slate-600 font-semibold">猎头机构</th>
            <th className="text-center py-3 px-4 text-slate-600 font-semibold">委托职位</th>
            <th className="text-center py-3 px-4 text-slate-600 font-semibold">成功填补</th>
            <th className="text-center py-3 px-4 text-slate-600 font-semibold">填补率</th>
            <th className="text-center py-3 px-4 text-slate-600 font-semibold">平均周期</th>
            <th className="text-center py-3 px-4 text-slate-600 font-semibold">单人成本</th>
            <th className="text-center py-3 px-4 text-slate-600 font-semibold">ROI</th>
          </tr>
        </thead>
        <tbody>
          {headhunterROI.map((r) => (
            <tr key={r.agency} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
              <td className="py-3 px-4 font-medium text-slate-800">{r.agency}</td>
              <td className="py-3 px-4 text-center text-slate-600">{r.positions}</td>
              <td className="py-3 px-4 text-center text-slate-600">{r.filled}</td>
              <td className="py-3 px-4 text-center text-slate-600">{r.fillRate}%</td>
              <td className="py-3 px-4 text-center text-slate-600">{r.avgDays}天</td>
              <td className="py-3 px-4 text-center text-slate-600">
                ¥{r.costPerHire.toLocaleString()}
              </td>
              <td className="py-3 px-4 text-center">
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roiColor(r.roi)}`}>
                  {r.roi}x
                </span>
              </td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-semibold text-slate-700">
            <td className="py-3 px-4">汇总 / 均值</td>
            <td className="py-3 px-4 text-center">{totals.positions}</td>
            <td className="py-3 px-4 text-center">{totals.filled}</td>
            <td className="py-3 px-4 text-center">{totals.avgFillRate.toFixed(1)}%</td>
            <td className="py-3 px-4 text-center">{totals.avgDays}天</td>
            <td className="py-3 px-4 text-center">¥{totals.avgCost.toLocaleString()}</td>
            <td className="py-3 px-4 text-center">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${roiColor(totals.avgRoi)}`}>
                {totals.avgRoi.toFixed(1)}x
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  )
}

export default function HRAnalytics() {
  const { positions } = usePositionStore()
  const activeCount = positions.filter((p) => p.status === 'active').length
  const totalApplicants = positions.reduce((s, p) => s + p.applicants, 0)
  const dynamicFillCycles = [
    ...positionFillCycles,
    ...positions
      .filter((p) => !positionFillCycles.some((fc) => fc.position === p.title))
      .map((p) => ({
        position: p.title,
        avgDays: Math.floor(Math.random() * 30) + 35,
        target: Math.floor(Math.random() * 15) + 30,
        trend: 'stable' as const,
      })),
  ]

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">招聘效能分析</h1>
          <p className="text-sm text-slate-500 mt-1">HR招聘全流程数据洞察与效率追踪</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
            {activeCount} 个活跃职位 · {totalApplicants} 位候选人
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={Target}
          label="整体转化率"
          value="2.3%"
          sub="1240份简历 → 28人入职"
          trend="down"
        />
        <MetricCard
          icon={Clock}
          label="平均填补周期"
          value="54天"
          sub="目标 40天 · 超出35%"
          trend="down"
          accent="amber"
        />
        <MetricCard
          icon={Star}
          label="招聘满意度"
          value="4.2/5.0"
          sub="较上季度 +0.3"
          trend="up"
          accent="green"
        />
        <MetricCard
          icon={Users}
          label="猎头合作效率"
          value="66.2%"
          sub="平均填补率"
          accent="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-4">简历转化漏斗</h2>
          <FunnelChart />
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-800 mb-2">岗位平均填补周期</h2>
          <p className="text-xs text-slate-400 mb-3">
            <span className="inline-block w-3 h-0.5 bg-red-400 mr-1 align-middle" style={{ borderTop: '2px dashed #ef4444' }} />
            虚线为目标周期
          </p>
          <PositionCycleChart data={dynamicFillCycles} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-slate-800">猎头合作ROI</h2>
          <div className="flex items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              ROI ≥ 3.0
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              ROI ≥ 2.5
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              ROI &lt; 2.5
            </span>
          </div>
        </div>
        <ROITable />
      </div>
    </div>
  )
}

import { useEffect, useMemo } from 'react'
import { RefreshCw, Clock, Star, AlertTriangle } from 'lucide-react'
import { useDashboardStore } from '@/stores/useDashboardStore'
import StatCard from '@/components/StatCard'
import { cn } from '@/lib/utils'
import type { TrendPoint, BureauOverdue, SentimentStat, BureauStatus, LowReview } from '@/types'

const CARD = 'bg-white rounded-xl border border-slate-100 shadow-sm p-5'
const PIE_COLORS: Record<string, string> = { positive: '#10b981', neutral: '#94a3b8', negative: '#ef4444' }
const TW = 600, TH = 240
const TP = { t: 20, r: 20, b: 36, l: 46 }
const TPW = TW - TP.l - TP.r
const TPH = TH - TP.t - TP.b

function Skeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 h-72 bg-slate-200 rounded-xl" />
        <div className="lg:col-span-4 h-72 bg-slate-200 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 h-64 bg-slate-200 rounded-xl" />
        <div className="lg:col-span-7 h-64 bg-slate-200 rounded-xl" />
      </div>
      <div className="h-48 bg-slate-200 rounded-xl" />
    </div>
  )
}

function TrendChart({ points }: { points: TrendPoint[] }) {
  const chart = useMemo(() => {
    if (!points.length) return null
    const vals = points.map((p) => p.avgDurationHours)
    const min = Math.floor(Math.min(...vals))
    const max = Math.ceil(Math.max(...vals))
    const range = max - min || 1
    const n = points.length
    const yTicks = Array.from({ length: 5 }, (_, i) => {
      const v = min + (range * i) / 4
      return { v: +v.toFixed(1), y: TP.t + TPH - (TPH * i) / 4 }
    })
    const coords = points.map((p, i) => ({
      x: TP.l + (TPW * i) / Math.max(n - 1, 1),
      y: TP.t + TPH - ((p.avgDurationHours - min) / range) * TPH,
    }))
    const line = coords.map((c, i) => `${i ? 'L' : 'M'}${c.x},${c.y}`).join(' ')
    const area = `${line} L${coords.at(-1)!.x},${TP.t + TPH} L${coords[0].x},${TP.t + TPH} Z`
    const xLabels = points
      .map((p, i) => ({ label: p.date.slice(5), i }))
      .filter((p) => p.i % 5 === 0 || p.i === n - 1)
      .map((p) => ({ ...p, x: TP.l + (TPW * p.i) / Math.max(n - 1, 1) }))
    return { line, area, yTicks, xLabels }
  }, [points])

  if (!chart) return null

  return (
    <div className={CARD}>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">办理时长趋势（近30天）</h3>
      <svg viewBox={`0 0 ${TW} ${TH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {chart.yTicks.map((t) => (
          <g key={t.v}>
            <line x1={TP.l} y1={t.y} x2={TW - TP.r} y2={t.y} stroke="#e2e8f0" strokeDasharray="4" />
            <text x={TP.l - 6} y={t.y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">{t.v}</text>
          </g>
        ))}
        {chart.xLabels.map((xl) => (
          <text key={xl.label + xl.i} x={xl.x} y={TH - 8} textAnchor="middle" fontSize="10" fill="#94a3b8">
            {xl.label}
          </text>
        ))}
        <path d={chart.area} fill="url(#trendFill)" />
        <path d={chart.line} fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function OverdueChart({ data }: { data: BureauOverdue[] }) {
  const maxCount = Math.max(...data.map((d) => d.overdueCount), 1)
  return (
    <div className={CARD}>
      <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-red-500" />超期预警监控
      </h3>
      <div className="space-y-2">
        {data.map((d) => (
          <div
            key={d.bureau}
            className={cn('flex items-center gap-3 rounded px-1 py-1', d.overdueRate > 2 && 'bg-red-50')}
          >
            <span className="w-16 text-xs text-slate-600 truncate shrink-0">{d.bureau}</span>
            <div className="flex-1 h-5 bg-slate-100 rounded overflow-hidden">
              <div
                className="h-full rounded transition-all"
                style={{
                  width: `${(d.overdueCount / maxCount) * 100}%`,
                  background: 'linear-gradient(90deg,#f87171,#dc2626)',
                }}
              />
            </div>
            <span className="text-xs font-medium text-slate-700 shrink-0 w-20 text-right">
              {d.overdueCount}件 <span className="text-red-500">{d.overdueRate}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SentimentPie({ stats }: { stats: SentimentStat[] }) {
  const total = stats.reduce((s, v) => s + v.count, 0)
  if (total === 0) return null
  const cx = 80, cy = 80, r = 70
  let angle = 0
  const slices = stats.map((s) => {
    const sweep = (s.count / total) * 360
    const start = angle
    angle += sweep
    return { ...s, start, end: angle }
  })

  return (
    <div className="flex items-center gap-6">
      <svg viewBox="0 0 160 160" className="w-36 shrink-0">
        {slices.map((s) => {
          const r1 = ((s.start - 90) * Math.PI) / 180
          const r2 = ((s.end - 90) * Math.PI) / 180
          const x1 = cx + r * Math.cos(r1)
          const y1 = cy + r * Math.sin(r1)
          const x2 = cx + r * Math.cos(r2)
          const y2 = cy + r * Math.sin(r2)
          const large = s.end - s.start > 180 ? 1 : 0
          return (
            <path
              key={s.sentiment}
              d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large} 1 ${x2},${y2} Z`}
              fill={PIE_COLORS[s.sentiment]}
            />
          )
        })}
      </svg>
      <div className="space-y-3">
        {stats.map((s) => (
          <div key={s.sentiment} className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: PIE_COLORS[s.sentiment] }} />
            <span className="text-slate-600">{s.label}</span>
            <span className="font-medium text-slate-800">{s.percentage}%</span>
            <span className="text-xs text-slate-400">({s.count})</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="inline-flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className={cn('w-3 h-3', i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-300')} />
      ))}
    </span>
  )
}

function LowReviewList({ reviews }: { reviews: LowReview[] }) {
  return (
    <div className={CARD}>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">低分评价</h3>
      <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
        {reviews.map((r) => (
          <div key={r.id} className="border-b border-slate-100 pb-2 last:border-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-slate-700 truncate">{r.serviceName}</span>
              <StarRating rating={r.rating} />
            </div>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{r.reviewText}</p>
            <span className="text-[10px] text-slate-400 mt-1 block">{r.submitTime}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BureauTable({ statuses }: { statuses: BureauStatus[] }) {
  return (
    <div className={CARD}>
      <h3 className="text-sm font-semibold text-slate-700 mb-3">委办局接入状态</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-slate-500 text-xs border-b border-slate-200">
              <th className="text-left py-2 font-medium">委办局</th>
              <th className="text-center py-2 font-medium">连接状态</th>
              <th className="text-right py-2 font-medium">响应时间</th>
              <th className="text-right py-2 font-medium">服务数量</th>
              <th className="text-right py-2 font-medium">最后更新</th>
            </tr>
          </thead>
          <tbody>
            {statuses.map((s) => (
              <tr key={s.bureau} className={cn('border-b border-slate-50', !s.isConnected && 'bg-red-50')}>
                <td className="py-2 text-slate-700">{s.bureau}</td>
                <td className="py-2 text-center">
                  <span className={cn('inline-block w-2.5 h-2.5 rounded-full', s.isConnected ? 'bg-emerald-500' : 'bg-red-500')} />
                </td>
                <td className="py-2 text-right text-slate-600">{s.isConnected ? `${s.responseTimeMs}ms` : '-'}</td>
                <td className="py-2 text-right text-slate-600">{s.serviceCount}</td>
                <td className="py-2 text-right text-slate-400 text-xs">{s.lastUpdateTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { dashboardData, loading, fetchDashboard } = useDashboardStore()

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  if (!dashboardData) return <Skeleton />

  const d = dashboardData

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Clock className="w-4 h-4" />
          最后更新：{d.lastUpdated}
        </div>
        <button
          onClick={() => fetchDashboard()}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gov-700 bg-gov-50 rounded-lg hover:bg-gov-100 transition disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          刷新
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="今日办件量" value={d.todayCount} suffix="件" colorVariant="gov" />
        <StatCard label="平均办理时长" value={d.avgDurationHours} suffix="小时" colorVariant="warm" />
        <StatCard label="按时办结率" value={d.onTimeRate} suffix="%" colorVariant="success" />
        <StatCard label="满意度" value={d.satisfactionRate} suffix="%" colorVariant="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8">
          <TrendChart points={d.trendPoints} />
        </div>
        <div className="lg:col-span-4">
          <OverdueChart data={d.bureauOverdues} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5">
          <div className={CARD}>
            <h3 className="text-sm font-semibold text-slate-700 mb-4">评价情感分析</h3>
            <SentimentPie stats={d.sentimentStats} />
          </div>
        </div>
        <div className="lg:col-span-7">
          <LowReviewList reviews={d.lowReviews} />
        </div>
      </div>

      <BureauTable statuses={d.bureauStatuses} />
    </div>
  )
}

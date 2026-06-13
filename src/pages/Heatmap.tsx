import { useState, useEffect, useMemo } from 'react'
import { useDashboardStore } from '@/stores/useDashboardStore'
import type { DistrictHeat, AgeHeat, TimeSlotHeat, TopService } from '@/types'
import { cn } from '@/lib/utils'
import { MapPin, Users, Clock, TrendingUp, TrendingDown, Minus, BarChart3, Flame, RefreshCw } from 'lucide-react'

type TabKey = 'district' | 'age' | 'timeSlot'

const CITY_NAMES: Record<string, string> = { chengdu: '成都市', deyang: '德阳市', meishan: '眉山市', ziyang: '资阳市' }

const trendIcon = (t: TopService['trend']) =>
  t === 'up' ? <TrendingUp className="w-4 h-4 text-red-500" /> : t === 'down' ? <TrendingDown className="w-4 h-4 text-green-500" /> : <Minus className="w-4 h-4 text-slate-400" />

const rankStyle = (i: number) => {
  if (i === 0) return 'bg-amber-500 text-white'
  if (i === 1) return 'bg-slate-400 text-white'
  if (i === 2) return 'bg-amber-700 text-white'
  return 'bg-slate-100 text-slate-500'
}

function DistrictChart({ data }: { data: DistrictHeat[] }) {
  const grouped = useMemo(() => {
    const map = new Map<string, DistrictHeat[]>()
    data.forEach(d => { const arr = map.get(d.city) || []; arr.push(d); map.set(d.city, arr) })
    return Array.from(map.entries()).map(([city, items]) => ({ city, cityName: CITY_NAMES[city] || city, items }))
  }, [data])
  const maxCount = useMemo(() => Math.max(...data.map(d => d.count), 1), [data])

  return (
    <div className="space-y-5">
      {grouped.map(g => (
        <div key={g.city}>
          <h4 className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-gov-600" />{g.cityName}
          </h4>
          <div className="space-y-1.5">
            {g.items.map(d => {
              const pct = (d.count / maxCount) * 100
              const depth = 30 + Math.round((d.count / maxCount) * 70)
              return (
                <div key={d.district} className="flex items-center gap-2 text-sm">
                  <span className="w-20 shrink-0 truncate text-slate-500 text-right">{d.district}</span>
                  <div className="flex-1 h-6 bg-slate-50 rounded overflow-hidden">
                    <div className="h-full rounded flex items-center pl-2 text-white text-xs font-medium transition-all"
                      style={{ width: `${pct}%`, backgroundColor: `hsl(213, 70%, ${100 - depth}%)` }}>
                      {pct > 18 && d.count.toLocaleString()}
                    </div>
                  </div>
                  {pct <= 18 && <span className="text-xs text-slate-500">{d.count.toLocaleString()}</span>}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function AgeChart({ data }: { data: AgeHeat[] }) {
  const { rects, maxCount, svgH, svgW, pad } = useMemo(() => {
    const maxC = Math.max(...data.map(a => a.count), 1)
    const w = 480, h = 280, p = { l: 55, r: 15, t: 20, b: 40 }
    const plotW = w - p.l - p.r, plotH = h - p.t - p.b
    const barW = plotW / data.length * 0.6
    const gap = plotW / data.length
    const rs = data.map((a, i) => {
      const x = p.l + i * gap + (gap - barW) / 2
      const mH = (a.maleCount / maxC) * plotH
      const fH = (a.femaleCount / maxC) * plotH
      return { x, mH, fH, totalH: mH + fH, item: a }
    })
    return { rects: rs, maxCount: maxC, svgH: h, svgW: w, pad: p }
  }, [data])
  const plotH = svgH - pad.t - pad.b

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-lg mx-auto">
      {[0, 0.25, 0.5, 0.75, 1].map(r => {
        const y = pad.t + plotH * (1 - r)
        return <g key={r}><line x1={pad.l} y1={y} x2={svgW - pad.r} y2={y} stroke="#e2e8f0" />
          <text x={pad.l - 8} y={y + 4} textAnchor="end" className="text-[10px]" fill="#94a3b8">{Math.round(maxCount * r).toLocaleString()}</text></g>
      })}
      {rects.map((r, i) => {
        const baseY = pad.t + plotH
        return (
          <g key={i}>
            <rect x={r.x} y={baseY - r.mH} width={28} height={r.mH} rx={3} fill="#1E5AA8" />
            <rect x={r.x} y={baseY - r.totalH} width={28} height={r.fH} rx={3} fill="#E879A0" />
            <text x={r.x + 14} y={baseY + 16} textAnchor="middle" className="text-[10px]" fill="#64748b">{r.item.ageGroup}</text>
            <text x={r.x + 14} y={baseY - r.totalH - 6} textAnchor="middle" className="text-[9px] font-medium" fill="#334155">{r.item.count.toLocaleString()}</text>
            <text x={r.x + 14} y={baseY - r.totalH - 18} textAnchor="middle" className="text-[8px]" fill="#94a3b8">
              ♂{Math.round(r.item.maleCount / r.item.count * 100)}% ♀{Math.round(r.item.femaleCount / r.item.count * 100)}%
            </text>
          </g>
        )
      })}
    </svg>
  )
}

function TimeSlotChart({ data }: { data: TimeSlotHeat[] }) {
  const { points, maxCount, svgW, svgH, pad } = useMemo(() => {
    const maxC = Math.max(...data.map(t => t.count), 1)
    const w = 560, h = 260, p = { l: 50, r: 15, t: 20, b: 35 }
    const plotW = w - p.l - p.r, plotH = h - p.t - p.b
    const step = plotW / (data.length - 1)
    const pts = data.map((t, i) => ({
      x: p.l + i * step,
      y: p.t + plotH * (1 - t.count / maxC),
      item: t,
    }))
    return { points: pts, maxCount: maxC, svgW: w, svgH: h, pad: p }
  }, [data])
  const plotH = svgH - pad.t - pad.b
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')
  const areaPath = `M${points[0].x},${svgH - pad.b} ` + points.map(p => `L${p.x},${p.y}`).join(' ') + ` L${points[points.length - 1].x},${svgH - pad.b} Z`
  const peakHours = [9, 10, 11, 14, 15, 16]

  return (
    <svg viewBox={`0 0 ${svgW} ${svgH}`} className="w-full max-w-2xl mx-auto">
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1E5AA8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#1E5AA8" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map(r => {
        const y = pad.t + plotH * (1 - r)
        return <g key={r}><line x1={pad.l} y1={y} x2={svgW - pad.r} y2={y} stroke="#e2e8f0" />
          <text x={pad.l - 8} y={y + 4} textAnchor="end" className="text-[9px]" fill="#94a3b8">{Math.round(maxCount * r).toLocaleString()}</text></g>
      })}
      <path d={areaPath} fill="url(#areaGrad)" />
      <polyline points={polyline} fill="none" stroke="#1E5AA8" strokeWidth={2.5} strokeLinejoin="round" />
      {points.filter(p => p.item.hour % 3 === 0).map(p => (
        <text key={p.item.hour} x={p.x} y={svgH - pad.b + 16} textAnchor="middle" className="text-[9px]" fill="#64748b">{p.item.hour}</text>
      ))}
      {points.filter(p => peakHours.includes(p.item.hour)).map(p => (
        <g key={p.item.hour}>
          <circle cx={p.x} cy={p.y} r={4} fill="#1E5AA8" stroke="white" strokeWidth={2} />
          <text x={p.x} y={p.y - 8} textAnchor="middle" className="text-[8px] font-bold" fill="#1E5AA8">{p.item.count.toLocaleString()}</text>
        </g>
      ))}
    </svg>
  )
}

function Top10List({ data }: { data: TopService[] }) {
  return (
    <div className="divide-y divide-slate-100">
      {data.map((s, i) => (
        <div key={s.serviceName} className="flex items-center gap-3 px-3 py-2.5 hover:bg-slate-50 transition-colors">
          <span className={cn('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0', rankStyle(i))}>{i + 1}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-800 truncate">{s.serviceName}</p>
            <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-gov-50 text-gov-700">{s.category}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-sm font-semibold text-slate-700">{s.count.toLocaleString()}</span>
            {trendIcon(s.trend)}
          </div>
        </div>
      ))}
    </div>
  )
}

export default function Heatmap() {
  const { heatmapData, fetchHeatmap, loading } = useDashboardStore()
  const [tab, setTab] = useState<TabKey>('district')

  useEffect(() => { fetchHeatmap() }, [fetchHeatmap])

  const totalVisits = useMemo(() => (heatmapData?.districtHeats || []).reduce((s, d) => s + d.count, 0), [heatmapData])

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-7xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-800 flex items-center gap-2"><Flame className="w-6 h-6 text-gov-600" />服务使用热力图</h1>
          {heatmapData?.lastUpdated && <p className="text-xs text-slate-400 mt-1">更新于 {heatmapData.lastUpdated}</p>}
        </div>
        <button onClick={() => fetchHeatmap()} disabled={loading}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-gov-50 text-gov-700 hover:bg-gov-100 transition-colors disabled:opacity-50">
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />刷新
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="card px-4 py-3 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-gov-600" />
          <div><p className="text-xs text-slate-400">总访问量</p><p className="text-lg font-bold text-slate-800">{totalVisits.toLocaleString()}</p></div>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {([['district', '行政区分布', MapPin], ['age', '年龄段分析', Users], ['timeSlot', '时段热度', Clock]] as const).map(([key, label, Icon]) => (
          <button key={key} onClick={() => setTab(key as TabKey)}
            className={cn(tab === key ? 'tab-btn-active' : 'tab-btn', 'flex items-center gap-1.5')}>
            <Icon className="w-4 h-4" />{label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card p-4 md:p-5">
          {loading && !heatmapData ? (
            <div className="flex items-center justify-center h-64 text-slate-400"><RefreshCw className="w-6 h-6 animate-spin" /></div>
          ) : heatmapData ? (
            tab === 'district' ? <DistrictChart data={heatmapData.districtHeats} /> :
            tab === 'age' ? <AgeChart data={heatmapData.ageHeats} /> :
            <TimeSlotChart data={heatmapData.timeSlotHeats} />
          ) : null}
        </div>

        <div className="card p-4 md:p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-1.5"><Flame className="w-4 h-4 text-amber-500" />高频事项 TOP10</h3>
          {heatmapData?.topServices ? <Top10List data={heatmapData.topServices} /> : (
            <div className="flex items-center justify-center h-40 text-slate-400"><RefreshCw className="w-5 h-5 animate-spin" /></div>
          )}
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import { MapPin, Clock, Download, Calendar, TrendingUp, Share2, FileSpreadsheet } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { HeatmapPoint } from '@/types'

const timeFilters = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'quarter', label: '本季度' },
]

function intensityColor(intensity: number): string {
  if (intensity >= 0.8) return '#FF8F00'
  if (intensity >= 0.6) return '#FFA726'
  if (intensity >= 0.4) return '#1A237E'
  if (intensity >= 0.2) return '#283593'
  return '#3949AB'
}

function intensityBgColor(intensity: number): string {
  if (intensity >= 0.8) return 'bg-amber-500'
  if (intensity >= 0.6) return 'bg-amber-400'
  if (intensity >= 0.4) return 'bg-indigo-900'
  if (intensity >= 0.2) return 'bg-indigo-700'
  return 'bg-indigo-600'
}

interface TooltipProps {
  payload?: { payload: HeatmapPoint & { _offsetLat: number; _offsetLng: number; poiName?: string } }[]
}

function ScatterTooltip({ payload }: TooltipProps) {
  if (!payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-white/10 bg-[#1E1E2E] px-3 py-2 text-xs min-w-[140px] shadow-xl">
      {d.poiName && <p className="text-gray-200 font-medium mb-1">{d.poiName}</p>}
      <p className="text-gray-400">热度强度</p>
      <p className="text-amber-500 font-bold text-sm font-mono">{((d.intensity ?? 0) * 100).toFixed(0)}%</p>
      <div className="mt-2 pt-2 border-t border-white/5">
        <p className="text-gray-500">累计停留 · {Math.round((d.intensity || 0) * 180)}分钟</p>
        <p className="text-gray-500">覆盖人次 · {Math.round((d.intensity || 0) * 2800)}人</p>
      </div>
    </div>
  )
}

export default function HeatmapTab() {
  const [timeFilter, setTimeFilter] = useState('today')
  const { heatmapData, selectedScenicId, loadHeatmap } = useAnalyticsStore()

  const handleTimeChange = (key: string) => {
    setTimeFilter(key)
    if (selectedScenicId) loadHeatmap(selectedScenicId, key)
  }

  const chartData = heatmapData.length > 0 ? heatmapData.map((p) => {
    const refLat = p.lat ?? 0
    const refLng = p.lng ?? 0
    const baseLat = Math.floor(refLat * 10000) / 10000
    const baseLng = Math.floor(refLng * 10000) / 10000
    return {
      ...p,
      _offsetLat: +((refLat - baseLat) * 10000).toFixed(2),
      _offsetLng: +((refLng - baseLng) * 10000).toFixed(2),
    }
  }) : Array.from({ length: 40 }, (_, i) => ({
    id: `demo-${i}`,
    lat: 39.9163 + (Math.random() - 0.5) * 0.02,
    lng: 116.3972 + (Math.random() - 0.5) * 0.02,
    intensity: +(Math.random() * 0.95 + 0.05).toFixed(2),
    poiName: ['太和殿', '保和殿', '乾清宫', '御花园', '午门', '角楼', '珍宝馆'][i % 7],
    _offsetLat: (Math.random() - 0.5) * 180,
    _offsetLng: (Math.random() - 0.5) * 180,
  }))

  const sorted = [...chartData]
    .sort((a, b) => (b.intensity ?? 0) - (a.intensity ?? 0))
    .slice(0, 10)

  const hourlyTrend = Array.from({ length: 12 }, (_, i) => ({
    hour: `${9 + i}:00`,
    density: Math.round((200 + Math.sin(i / 2) * 180 + Math.random() * 120) * (1 + (i > 3 && i < 9 ? 0.4 : 0))),
  }))

  const totalSamples = chartData.reduce((s, d) => s + Math.round((d.intensity || 0) * 1000), 0)
  const hotCount = chartData.filter((d) => (d.intensity || 0) > 0.6).length
  const avgIntensity = chartData.reduce((s, d) => s + (d.intensity || 0), 0) / chartData.length

  const handleExport = (format: 'csv' | 'json' | 'image') => {
    if (format === 'json') {
      const data = {
        generatedAt: new Date().toISOString(),
        timeRange: timeFilter,
        totalSamples,
        averageIntensity: avgIntensity,
        data: chartData.map((d) => ({
          poiName: d.poiName,
          lat: d.lat,
          lng: d.lng,
          intensity: d.intensity,
          estimatedVisitors: Math.round((d.intensity || 0) * 2800),
        })),
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `heatmap-${timeFilter}-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else if (format === 'csv') {
      const rows = [
        ['POI名称', '纬度', '经度', '热度强度', '预估人次'],
        ...chartData.map((d) => [
          d.poiName || '-',
          String(d.lat),
          String(d.lng),
          String(d.intensity),
          String(Math.round((d.intensity || 0) * 2800)),
        ]),
      ]
      const csv = rows.map((r) => r.join(',')).join('\n')
      const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `heatmap-${timeFilter}-${Date.now()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex gap-1 rounded-lg bg-[#1E1E2E] p-1 border border-white/5">
            {timeFilters.map((f) => (
              <button
                key={f.key}
                onClick={() => handleTimeChange(f.key)}
                className={cn(
                  'rounded-md px-3.5 py-1.5 text-xs font-medium transition flex items-center gap-1.5',
                  timeFilter === f.key
                    ? 'bg-indigo-900 text-gray-100 shadow'
                    : 'text-gray-400 hover:text-gray-200',
                )}
              >
                <Calendar size={11} />
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleExport('json')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
          >
            <FileSpreadsheet size={12} /> JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-[11px] text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
          >
            <FileSpreadsheet size={12} /> CSV
          </button>
          <button
            onClick={() => handleExport('image')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-amber-600 to-amber-500 text-[11px] text-white font-medium hover:from-amber-500 hover:to-amber-400 transition-colors shadow-lg shadow-amber-900/30"
          >
            <Download size={12} /> 导出热力图报告
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: '总访问人次', value: totalSamples.toLocaleString(), icon: MapPin, color: 'text-indigo-400', trend: '+15.2%' },
          { label: '高热点位', value: hotCount, icon: TrendingUp, color: 'text-amber-400', trend: '+3个' },
          { label: '平均热度', value: `${(avgIntensity * 100).toFixed(0)}%`, icon: Clock, color: 'text-emerald-400', trend: '+4.8%' },
          { label: '覆盖POI', value: chartData.length, icon: Share2, color: 'text-sky-400', trend: '+2' },
        ].map((m) => (
          <div key={m.label} className="rounded-xl bg-[#1E1E2E] border border-white/5 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center bg-white/5', m.color)}>
                <m.icon size={13} />
              </div>
              <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded font-medium">{m.trend}</span>
            </div>
            <p className="text-xl font-bold text-white mb-0.5">{m.value}</p>
            <p className="text-[10px] text-gray-500">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-500" />
                空间热力分布
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">基于经纬度偏移的访客密度散点图</p>
            </div>
            <div className="flex items-center gap-2 text-[9px]">
              <span className="flex items-center gap-1 text-gray-500">
                <span className="w-3 h-3 rounded-full bg-indigo-600" />低
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <span className="w-3 h-3 rounded-full bg-amber-400" />中
              </span>
              <span className="flex items-center gap-1 text-gray-500">
                <span className="w-3 h-3 rounded-full bg-amber-500" />高
              </span>
            </div>
          </div>
          <div className="h-80 relative">
            <div className="absolute inset-0 pointer-events-none opacity-30">
              <div className="absolute top-1/4 left-1/4 w-40 h-40 rounded-full border border-indigo-400/20 border-dashed" />
              <div className="absolute top-1/3 left-1/3 w-56 h-56 rounded-full border border-amber-400/20 border-dashed" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-amber-500/5 blur-xl" />
            </div>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <XAxis
                  dataKey="_offsetLng"
                  name="经度偏移"
                  tick={{ fill: '#607D8B', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                  type="number"
                />
                <YAxis
                  dataKey="_offsetLat"
                  name="纬度偏移"
                  tick={{ fill: '#607D8B', fontSize: 10 }}
                  axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                  tickLine={false}
                  type="number"
                />
                <ZAxis dataKey="intensity" range={[60, 500]} />
                <Tooltip content={<ScatterTooltip />} cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={chartData}>
                  {chartData.map((entry, idx) => (
                    <circle
                      key={idx}
                      fill={intensityColor(entry.intensity ?? 0)}
                      fillOpacity={0.55 + (entry.intensity ?? 0) * 0.35}
                      stroke={intensityColor(entry.intensity ?? 0)}
                      strokeOpacity={0.2}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5 flex flex-col">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              热点停留排行 TOP 10
            </h3>
            <span className="text-[9px] text-gray-500">按热度排序</span>
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto pr-1 -mr-1">
            {sorted.map((p, i) => {
              const intensity = p.intensity ?? 0
              const visitors = Math.round(intensity * 2800)
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 rounded-xl p-2.5 transition-colors',
                    i < 3 ? 'bg-amber-500/5 hover:bg-amber-500/10' : 'bg-white/5 hover:bg-white/10',
                  )}
                >
                  <span className={cn(
                    'w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0',
                    i === 0 ? 'bg-amber-500 text-white' :
                    i === 1 ? 'bg-gray-400/80 text-white' :
                    i === 2 ? 'bg-orange-600/80 text-white' :
                    'bg-white/10 text-gray-500',
                  )}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-gray-200 truncate font-medium">{p.poiName || `点位 #${i + 1}`}</span>
                      <span className="font-mono text-[10px] text-gray-500 ml-2">{visitors}人</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={cn('h-full rounded-full', intensityBgColor(intensity))}
                        style={{ width: `${intensity * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-amber-400 w-9 text-right">
                    {(intensity * 100).toFixed(0)}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              分时段热力趋势
            </h3>
            <p className="text-[10px] text-gray-500 mt-0.5">单位时间内的热点区域访问人次</p>
          </div>
          <div className="flex items-center gap-3 text-[9px]">
            <span className="flex items-center gap-1 text-gray-400">
              <span className="w-2 h-2 rounded-full bg-amber-500" />访问人次
            </span>
          </div>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={hourlyTrend}>
              <defs>
                <linearGradient id="gradHeat" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FF8F00" stopOpacity={0.45} />
                  <stop offset="95%" stopColor="#FF8F00" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="hour"
                tick={{ fill: '#9E9E9E', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#9E9E9E', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  background: 'rgba(30, 30, 46, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 8,
                  fontSize: 12,
                  color: '#F5F5F0',
                }}
                itemStyle={{ color: '#FF8F00' }}
              />
              <Area
                type="monotone"
                dataKey="density"
                stroke="#FF8F00"
                strokeWidth={2.5}
                fill="url(#gradHeat)"
                name="访问人次"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border border-indigo-700/20 bg-gradient-to-br from-indigo-900/20 to-transparent p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h4 className="text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-indigo-400" />
              热力分布运营建议
            </h4>
            <ul className="space-y-1.5 text-[11px] text-gray-400 leading-relaxed max-w-3xl">
              <li>• <span className="text-amber-400">「{sorted[0]?.poiName || '太和殿'}」</span> 热度最高（{(sorted[0]?.intensity || 0) * 100 | 0}%），建议增加 2 名工作人员维持秩序，高峰时段实行限流。</li>
              <li>• 11:00-14:00 为全天峰值，建议将讲解资源向 {hotCount} 个热点倾斜，或设计错峰优惠政策。</li>
              <li>• 尾部点位（热度 &lt; 20%）可考虑增加 AR 互动或与热销动线绑定，提升整体游览深度。</li>
            </ul>
          </div>
          <button className="px-4 py-2 rounded-xl bg-indigo-900/60 border border-indigo-700/30 text-xs text-indigo-200 hover:bg-indigo-900/80 transition-colors whitespace-nowrap flex items-center gap-1.5">
            <Share2 size={12} /> 同步给景区运营
          </button>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis } from 'recharts'
import { MapPin, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalyticsStore } from '@/store/useAnalyticsStore'
import type { HeatmapPoint } from '@/types'

const timeFilters = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
]

function intensityColor(intensity: number): string {
  if (intensity >= 0.7) return '#FF8F00'
  if (intensity >= 0.4) return '#1A237E'
  return '#283593'
}

interface TooltipProps {
  payload?: { payload: HeatmapPoint & { _offsetLat: number; _offsetLng: number } }[]
}

function ScatterTooltip({ payload }: TooltipProps) {
  if (!payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-white/10 bg-[#1E1E2E] px-3 py-2 text-xs">
      <p className="text-gray-300">偏移: ({d._offsetLng.toFixed(4)}, {d._offsetLat.toFixed(4)})</p>
      <p className="text-amber-500">强度: {(d.intensity ?? 0).toFixed(2)}</p>
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

  const chartData = heatmapData.map((p) => {
    const refLat = p.lat ?? 0
    const refLng = p.lng ?? 0
    const baseLat = Math.floor(refLat * 100) / 100
    const baseLng = Math.floor(refLng * 100) / 100
    return {
      ...p,
      _offsetLat: +(refLat - baseLat).toFixed(5),
      _offsetLng: +(refLng - baseLng).toFixed(5),
    }
  })

  const sorted = [...heatmapData]
    .sort((a, b) => (b.intensity ?? 0) - (a.intensity ?? 0))
    .slice(0, 8)

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        {timeFilters.map((f) => (
          <button
            key={f.key}
            onClick={() => handleTimeChange(f.key)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition',
              timeFilter === f.key
                ? 'bg-indigo-900 text-gray-100'
                : 'bg-white/5 text-gray-400 hover:bg-white/10'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium text-gray-300">热力分布图</span>
          </div>
          <div className="h-80">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <XAxis
                    dataKey="_offsetLng"
                    name="经度偏移"
                    tick={{ fill: '#9E9E9E', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    type="number"
                  />
                  <YAxis
                    dataKey="_offsetLat"
                    name="纬度偏移"
                    tick={{ fill: '#9E9E9E', fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                    type="number"
                  />
                  <ZAxis dataKey="intensity" range={[50, 400]} />
                  <Tooltip content={<ScatterTooltip />} />
                  <Scatter data={chartData} fill="#1A237E">
                    {chartData.map((entry, idx) => (
                      <circle
                        key={idx}
                        fill={intensityColor(entry.intensity ?? 0)}
                        fillOpacity={0.6 + (entry.intensity ?? 0) * 0.4}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-gray-500">
                请选择景区查看热力图
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-white/5 bg-[#1E1E2E] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            <span className="text-sm font-medium text-gray-300">热点停留排名</span>
          </div>
          <div className="space-y-2">
            {sorted.map((p, i) => {
              const intensity = p.intensity ?? 0
              return (
                <div key={i} className="flex items-center gap-3 rounded-lg px-2 py-1.5">
                  <span className={cn(
                    'flex h-5 w-5 items-center justify-center rounded text-xs font-bold',
                    i < 3 ? 'bg-amber-600/20 text-amber-500' : 'bg-white/5 text-gray-500'
                  )}>
                    {i + 1}
                  </span>
                  <div className="flex-1">
                    <div className="h-1.5 w-full rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-900 to-amber-600"
                        style={{ width: `${intensity * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="font-mono text-xs text-gray-400">{(intensity * 100).toFixed(0)}%</span>
                </div>
              )
            })}
            {sorted.length === 0 && (
              <p className="py-4 text-center text-xs text-gray-500">暂无数据</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

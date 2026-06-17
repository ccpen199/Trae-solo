import { useState, useMemo } from 'react'
import { MapPin, TrendingUp } from 'lucide-react'

type TimePeriod = 'today' | 'week' | 'month'

const gridSize = 10

const generateHeatData = (): number[][] => {
  const data: number[][] = []
  for (let i = 0; i < gridSize; i++) {
    const row: number[] = []
    for (let j = 0; j < gridSize; j++) {
      const distCenter = Math.sqrt((i - 4) ** 2 + (j - 5) ** 2)
      const base = Math.max(0, 100 - distCenter * 15)
      row.push(Math.round(base + Math.random() * 30))
    }
    data.push(row)
  }
  return data
}

const regionNames = [
  '中心商业区', '科技园区', '大学城', '居民区A', '居民区B',
  '火车站周边', '工业园区', '老城区', '新区开发', '郊区',
]

const topRegions = [
  { name: '中心商业区', orders: 1842, growth: '+12%' },
  { name: '科技园区', orders: 1356, growth: '+8%' },
  { name: '火车站周边', orders: 1102, growth: '+15%' },
  { name: '大学城', orders: 980, growth: '+5%' },
  { name: '居民区A', orders: 876, growth: '+3%' },
  { name: '老城区', orders: 754, growth: '-2%' },
  { name: '新区开发', orders: 632, growth: '+22%' },
  { name: '居民区B', orders: 598, growth: '+1%' },
  { name: '工业园区', orders: 445, growth: '-5%' },
  { name: '郊区', orders: 312, growth: '+6%' },
]

function getHeatColor(value: number): string {
  if (value >= 120) return '#DC2626'
  if (value >= 100) return '#EF4444'
  if (value >= 80) return '#F97316'
  if (value >= 60) return '#F59E0B'
  if (value >= 40) return '#FBBF24'
  if (value >= 20) return '#34D399'
  return '#6EE7B7'
}

export default function Heatmap() {
  const [period, setPeriod] = useState<TimePeriod>('today')
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; value: number } | null>(null)

  const heatData = useMemo(() => generateHeatData(), [period])

  return (
    <div className="space-y-6" style={{ backgroundColor: '#0F172A', minHeight: '100vh', padding: '1.5rem' }}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">订单热力图</h1>
        <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
          {(['today', 'week', 'month'] as TimePeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {p === 'today' ? '今日' : p === 'week' ? '本周' : '本月'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">区域订单分布</h3>
          </div>

          <div className="relative">
            <div
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
              onMouseLeave={() => setHoveredCell(null)}
            >
              {heatData.map((row, i) =>
                row.map((value, j) => (
                  <div
                    key={`${i}-${j}`}
                    className="aspect-square rounded-sm cursor-pointer transition-transform hover:scale-110"
                    style={{ backgroundColor: getHeatColor(value), opacity: 0.85 }}
                    onMouseEnter={() => setHoveredCell({ row: i, col: j, value })}
                    onClick={() => setHoveredCell({ row: i, col: j, value })}
                  />
                )),
              )}
            </div>

            {hoveredCell && (
              <div className="absolute top-2 right-2 bg-slate-900/90 backdrop-blur rounded-lg p-3 text-sm border border-slate-700">
                <div className="text-gray-400 mb-1">
                  {regionNames[hoveredCell.row]} · 区块 {hoveredCell.col + 1}
                </div>
                <div className="text-white font-bold text-lg">{hoveredCell.value} 单</div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
            <span>低</span>
            <div className="flex gap-1">
              {['#6EE7B7', '#34D399', '#FBBF24', '#F59E0B', '#F97316', '#EF4444', '#DC2626'].map((c) => (
                <div key={c} className="w-8 h-3 rounded-sm" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span>高</span>
          </div>
        </div>

        <div className="bg-slate-800 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-base font-semibold text-white">区域排行 Top 10</h3>
          </div>
          <div className="space-y-2">
            {topRegions.map((region, idx) => (
              <div key={region.name} className="flex items-center gap-3">
                <span
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    idx < 3 ? 'bg-amber-500 text-white' : 'bg-slate-700 text-gray-400'
                  }`}
                >
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white truncate">{region.name}</span>
                    <span
                      className={`text-xs ${
                        region.growth.startsWith('+') ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {region.growth}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full"
                      style={{ width: `${(region.orders / topRegions[0].orders) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-sm text-gray-400 w-16 text-right">{region.orders}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

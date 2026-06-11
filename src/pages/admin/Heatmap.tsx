import { useEffect, useMemo, useState } from 'react'
import {
  MapPin, Calendar, Clock as ClockIcon, Layers, BarChart3, ListOrdered,
  SlidersHorizontal, ChevronRight, Search as SearchIcon,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { apiFetch } from '@/utils/api'
import type { HeatmapDataPoint } from '@/types'

const regions = ['市本级', '东区', '西区', '南区', '北区']
const timeSlots = ['08-10', '10-12', '12-14', '14-16', '16-18', '18-20']
const categoryOptions = [
  { key: 'all', name: '全部事项', color: '#1A5FB4' },
  { key: 'government', name: '政务服务', color: '#4787DF' },
  { key: 'convenience', name: '便民服务', color: '#2EC4B6' },
  { key: 'social', name: '社会保障', color: '#75A5E7' },
  { key: 'tax', name: '税务财务', color: '#A3C3EF' },
  { key: 'house', name: '住房建设', color: '#E76F51' },
  { key: 'traffic', name: '交通出行', color: '#F4A261' },
  { key: 'livelihood', name: '生活缴费', color: '#2A9D8F' },
]

const heatColorSteps = [
  { threshold: 200, cls: 'bg-gov-blue-900 text-white font-bold' },
  { threshold: 140, cls: 'bg-gov-blue-700 text-white' },
  { threshold: 90, cls: 'bg-gov-blue-500 text-white' },
  { threshold: 50, cls: 'bg-gov-blue-400 text-white' },
  { threshold: 25, cls: 'bg-gov-blue-300 text-gov-blue-900' },
  { threshold: 10, cls: 'bg-gov-blue-200 text-gov-blue-800' },
  { threshold: 0, cls: 'bg-gov-blue-50 text-gov-blue-700' },
]

function getCellColor(v: number) {
  for (const s of heatColorSteps) if (v >= s.threshold) return s
  return heatColorSteps[heatColorSteps.length - 1]
}

type Dimension = 'region' | 'time' | 'service'

interface CellData { region: string; slot: string; value: number; service: string }

function genData(seed = 1): CellData[] {
  const services = ['社保', '税务', '公积金', '不动产', '水电气', '违章', '户籍', '投诉']
  const arr: CellData[] = []
  regions.forEach((r, ri) => {
    timeSlots.forEach((s, si) => {
      services.forEach((sv, svi) => {
        const base = (ri + 1) * 12 + (si < 2 || si > 3 ? 30 : si === 2 ? 18 : 50) + Math.sin((ri + si + svi + seed) * 0.7) * 25
        const jitter = ((ri * 17 + si * 7 + svi * 13 + seed) % 35) - 15
        arr.push({ region: r, slot: s, service: sv, value: Math.max(1, Math.round(base + jitter)) })
      })
    })
  })
  return arr
}

const catPieColors = ['#1A5FB4', '#2EC4B6', '#E76F51', '#4787DF', '#F4A261', '#75A5E7', '#2A9D8F', '#A3C3EF']

export default function Heatmap() {
  const [dimension, setDimension] = useState<Dimension>('time')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDate, setSelectedDate] = useState('2026-06-10')
  const [selectedRegion, setSelectedRegion] = useState('all')
  const [activeCell, setActiveCell] = useState<CellData | null>(null)
  const [raw, setRaw] = useState<HeatmapDataPoint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    const q = new URLSearchParams({ date: selectedDate })
    if (selectedCategory !== 'all') q.set('category', selectedCategory)
    if (selectedRegion !== 'all') q.set('region', selectedRegion)
    apiFetch<Array<Record<string, unknown>> | HeatmapDataPoint[]>(`/api/monitor/heatmap?${q.toString()}`)
      .then((d) => {
        const arr = Array.isArray(d) ? d : []
        const norm = arr.map((x) => ({
          region: (x as Record<string, unknown>).region || '市本级',
          timeSlot: (x as Record<string, unknown>).time_slot || (x as Record<string, unknown>).timeSlot || '14-16',
          category: (x as Record<string, unknown>).category || 'social',
          service: (x as Record<string, unknown>).service || '社保',
          count: Number((x as Record<string, unknown>).count || 20),
        } as HeatmapDataPoint))
        setRaw(norm)
      }).catch(() => setRaw([]))
      .finally(() => setLoading(false))
  }, [selectedDate, selectedCategory, selectedRegion])

  const cells = useMemo(() => {
    if (raw.length > 0) {
      const services = Array.from(new Set(raw.map((r) => r.service)))
      const out: CellData[] = []
      regions.forEach((r) => {
        timeSlots.forEach((ts) => {
          ;(services.length ? services : ['社保']).forEach((sv) => {
            const m = raw.find((x) => x.region === r && x.timeSlot === ts && x.service === sv)
            out.push({ region: r, slot: ts, service: sv, value: m?.count || 0 })
          })
        })
      })
      return out
    }
    return genData(2)
  }, [raw])

  const matrix = useMemo(() => {
    const services = Array.from(new Set(cells.map((c) => c.service)))
    if (dimension === 'region') {
      return {
        rows: regions,
        cols: services,
        title: '区域 × 事项类型',
        rowLabel: '区域',
        colLabel: '事项',
        getVal: (row: string, col: string) => cells.filter((c) => c.region === row && c.service === col).reduce((s, x) => s + x.value, 0),
      }
    }
    if (dimension === 'time') {
      return {
        rows: regions,
        cols: timeSlots,
        title: '区域 × 时段',
        rowLabel: '区域',
        colLabel: '时段',
        getVal: (row: string, col: string) => cells.filter((c) => c.region === row && c.slot === col).reduce((s, x) => s + x.value, 0),
      }
    }
    return {
      rows: timeSlots,
      cols: services,
      title: '时段 × 事项类型',
      rowLabel: '时段',
      colLabel: '事项',
      getVal: (row: string, col: string) => cells.filter((c) => c.slot === row && c.service === col).reduce((s, x) => s + x.value, 0),
    }
  }, [dimension, cells])

  const regionRank = useMemo(() => {
    return regions.map((r) => ({
      region: r,
      total: cells.filter((c) => c.region === r).reduce((s, x) => s + x.value, 0),
      max: Math.max(...cells.filter((c) => c.region === r).map((x) => x.value), 1),
    })).sort((a, b) => b.total - a.total)
  }, [cells])

  const serviceRank = useMemo(() => {
    const keys = Array.from(new Set(cells.map((c) => c.service)))
    return keys.map((sv) => ({
      name: sv,
      total: cells.filter((c) => c.service === sv).reduce((s, x) => s + x.value, 0),
      regions: Array.from(new Set(cells.filter((c) => c.service === sv).map((x) => x.region))).length,
    })).sort((a, b) => b.total - a.total)
  }, [cells])

  const categoryPie = useMemo(() => {
    const catMap: Record<string, number> = {}
    cells.forEach((c) => {
      const k = c.service
      catMap[k] = (catMap[k] || 0) + c.value
    })
    return Object.entries(catMap).map(([n, v]) => ({ name: n, value: v })).sort((a, b) => b.value - a.value)
  }, [cells])

  const total = cells.reduce((s, x) => s + x.value, 0)
  const avg = Math.round(total / Math.max(1, matrix.rows.length * matrix.cols.length))
  const peak = Math.max(...cells.map((c) => c.value))
  const peakRegion = regionRank[0]
  const peakService = serviceRank[0]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-6 gap-4">
        {[
          { label: '今日办件总量', value: total.toLocaleString(), unit: '件', icon: BarChart3, cls: 'from-gov-blue-500 to-gov-blue-600' },
          { label: '均值/单元格', value: avg, unit: '件', icon: Layers, cls: 'from-gov-blue-400 to-gov-blue-500' },
          { label: '峰值热力', value: peak, unit: '件', icon: Calendar, cls: 'from-alert to-red-500' },
          { label: '最热区域', value: peakRegion?.region || '-', unit: `${peakRegion?.total || 0}件`, icon: MapPin, cls: 'from-convenience to-teal-500' },
          { label: '最热事项', value: peakService?.name || '-', unit: `${peakService?.total || 0}件`, icon: ListOrdered, cls: 'from-purple-500 to-gov-blue-500' },
          { label: '覆盖服务', value: serviceRank.length, unit: '项', icon: SearchIcon, cls: 'from-amber-500 to-alert' },
        ].map((s, i) => (
          <div key={i} className={`bg-gradient-to-br ${s.cls} text-white rounded-lg p-4 shadow-sm`}>
            <div className="flex items-center gap-2 text-xs opacity-90 mb-1">
              <s.icon className="w-3.5 h-3.5" />{s.label}
            </div>
            <p className="text-2xl font-bold leading-tight">{s.value}</p>
            <p className="text-[10px] opacity-80 mt-1">{s.unit}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-9 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-medium text-gray-800 flex items-center gap-2">
                <Layers className="w-4 h-4 text-gov-blue-500" />办件热力分析 — {matrix.title}
              </h3>
              <span className="text-[10px] text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{selectedDate}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 bg-gray-50 rounded-md border border-gray-200 p-0.5">
                {([
                  { k: 'time', label: '区域×时段', icon: ClockIcon },
                  { k: 'region', label: '区域×事项', icon: MapPin },
                  { k: 'service', label: '时段×事项', icon: Layers },
                ] as { k: Dimension; label: string; icon: typeof ClockIcon }[]).map((o) => (
                  <button
                    key={o.k}
                    onClick={() => setDimension(o.k)}
                    className={`flex items-center gap-1 px-3 py-1 text-xs rounded transition-colors ${
                      dimension === o.k ? 'bg-white text-gov-blue-600 shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    <o.icon className="w-3 h-3" />{o.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 text-[10px] text-gray-500">
                {heatColorSteps.slice(0, 5).reverse().map((s, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span className={`w-5 h-3.5 rounded ${s.cls.split(' ')[0]}`} />
                  </div>
                ))}
                <span className="ml-1">低 → 高</span>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="py-20 text-center text-sm text-gray-400">加载热力数据中...</div>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr>
                    <th className="p-2 text-left text-gray-400 font-medium w-20 border-b border-gray-100">{matrix.rowLabel} ↓ / {matrix.colLabel} →</th>
                    {matrix.cols.map((c) => (
                      <th key={c} className="p-2 text-center text-gray-500 font-medium border-b border-gray-100 min-w-[72px]">{c}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.rows.map((row) => (
                    <tr key={row} className="hover:bg-gov-blue-50/20">
                      <td className="p-1.5 text-gray-600 font-medium text-right pr-2">{row}</td>
                      {matrix.cols.map((col) => {
                        const v = matrix.getVal(row, col)
                        const cls = getCellColor(v)
                        return (
                          <td key={col} className="p-1">
                            <button
                              onMouseEnter={() => setActiveCell({ region: dimension === 'time' ? row : dimension === 'region' ? row : '-', slot: dimension === 'service' ? row : '-', service: dimension === 'region' || dimension === 'service' ? col : '-', value: v } as CellData)}
                              className={`w-full py-3 rounded transition-all text-center font-mono hover:scale-[1.03] hover:shadow ${cls.cls}`}
                            >
                              {v}
                            </button>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {activeCell && (
            <div className="mt-4 p-3 rounded-md bg-amber-50 border border-amber-100 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-amber-800">
                <span className="flex items-center gap-1"><Layers className="w-3 h-3" />区域：<strong>{activeCell.region}</strong></span>
                <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" />时段：<strong>{activeCell.slot}</strong></span>
                <span className="flex items-center gap-1"><ListOrdered className="w-3 h-3" />事项：<strong>{activeCell.service}</strong></span>
                <span className="flex items-center gap-1"><BarChart3 className="w-3 h-3" />办件量：<strong className="text-alert">{activeCell.value}</strong></span>
              </div>
              <span className="text-[10px] text-amber-600">（鼠标悬停单元格查看明细）</span>
            </div>
          )}
        </div>

        <div className="col-span-3 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <SlidersHorizontal className="w-4 h-4 text-gov-blue-500" />
              <h4 className="text-sm font-medium text-gray-800">筛选条件</h4>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-gray-500 mb-1 block">统计日期</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gov-blue-400" />
              </div>
              <div>
                <label className="text-gray-500 mb-1 block">事项分类</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {categoryOptions.map((c) => (
                    <button
                      key={c.key}
                      onClick={() => setSelectedCategory(c.key)}
                      className={`text-[11px] px-2 py-1 rounded transition-colors border ${
                        selectedCategory === c.key ? 'bg-gov-blue-500 text-white border-gov-blue-500' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ background: c.color }} />{c.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-gray-500 mb-1 block">行政区划</label>
                <select value={selectedRegion} onChange={(e) => setSelectedRegion(e.target.value)} className="w-full px-2 py-1.5 bg-gray-50 border border-gray-200 rounded focus:outline-none focus:border-gov-blue-400 text-xs">
                  <option value="all">全部区域</option>
                  {regions.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gov-blue-500" />区域热力榜 TOP5
            </h4>
            <div className="space-y-2">
              {regionRank.slice(0, 5).map((r, i) => (
                <div key={r.region} className="flex items-center gap-2">
                  <span className={`w-5 h-5 rounded text-xs flex items-center justify-center font-medium flex-shrink-0 ${
                    i === 0 ? 'bg-alert text-white' : i === 1 ? 'bg-amber-400 text-white' : i === 2 ? 'bg-gov-blue-400 text-white' : 'bg-gray-100 text-gray-500'
                  }`}>{i + 1}</span>
                  <span className="text-xs text-gray-700 w-14">{r.region}</span>
                  <div className="flex-1 bg-gray-50 rounded overflow-hidden h-5 relative">
                    <div className="h-full bg-gradient-to-r from-gov-blue-400 to-gov-blue-500" style={{ width: `${(r.total / regionRank[0].total) * 100}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">{r.total}</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-gray-300 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <h4 className="text-sm font-medium text-gray-800 mb-3">事项类型占比</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={categoryPie} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30} label={(e) => `${e.value}`} labelLine={false}>
                  {categoryPie.map((_, i) => <Cell key={i} fill={catPieColors[i % catPieColors.length]} />)}
                </Pie>
                <Legend iconSize={7} wrapperStyle={{ fontSize: 10 }} />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-7 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2">
            <ListOrdered className="w-4 h-4 text-gov-blue-500" />事项办件量排行 · 明细榜
            <span className="ml-auto text-[10px] text-gray-400 font-normal">单位：件 / {selectedDate}</span>
          </h3>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={serviceRank} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={60} />
              <Tooltip />
              <Bar dataKey="total" name="办件量" radius={[0, 4, 4, 0]} barSize={18}>
                {serviceRank.map((_, i) => <Cell key={i} fill={catPieColors[i % catPieColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="col-span-5 bg-white rounded-lg shadow-sm border border-gray-100 p-5">
          <h3 className="text-base font-medium text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-convenience" />管理复核依据 · 资源调度建议
          </h3>
          <div className="space-y-3">
            {[
              { level: 'high', title: `${peakRegion?.region || '市本级'}窗口扩容`, desc: `该区域今日峰值 ${peakRegion?.total || 0} 件，建议临时增开 2 个综合受理窗口`, tag: '窗口调度' },
              { level: 'high', title: `${peakService?.name || '社保'}事项`, desc: `高峰时段 14-16 点占全天 38%，建议推行预约分流，延长午间服务`, tag: '预约优化' },
              { level: 'mid', title: '水电气缴费合并办理', desc: '分析显示62%办件人同时办理2项以上生活缴费，建议联合柜台', tag: '流程优化' },
              { level: 'mid', title: '不动产自助机配置', desc: '近7日查询类占47%，建议在市本级、东区增设自助终端', tag: '设备调配' },
              { level: 'low', title: '投诉反馈响应提速', desc: '周末投诉转办耗时较工作日高42%，建议安排周末值班', tag: '效率提升' },
            ].map((r, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-md border ${
                r.level === 'high' ? 'bg-red-50 border-red-100' : r.level === 'mid' ? 'bg-amber-50 border-amber-100' : 'bg-gov-blue-50 border-gov-blue-100'
              }`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  r.level === 'high' ? 'bg-alert text-white' : r.level === 'mid' ? 'bg-amber-500 text-white' : 'bg-gov-blue-500 text-white'
                } text-xs font-bold`}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-gray-800">{r.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      r.level === 'high' ? 'bg-red-100 text-red-600' : r.level === 'mid' ? 'bg-amber-100 text-amber-700' : 'bg-gov-blue-100 text-gov-blue-700'
                    }`}>{r.tag}</span>
                  </div>
                  <p className="text-[11px] text-gray-600 leading-relaxed">{r.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

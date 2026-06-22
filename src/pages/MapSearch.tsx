import 'leaflet/dist/leaflet.css'
import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, ZoomControl } from 'react-leaflet'
import L from 'leaflet'
import { Filter, X, ChevronUp, ChevronDown, RotateCcw, ArrowUpDown, Building2, TrendingUp, Home, MapPin, Award } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/utils/api'
import type { MapProperty, HeatmapData } from '@/types/index'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
})

const DISTRICTS = ['黄浦', '徐汇', '长宁', '静安', '普陀', '虹口', '杨浦', '浦东', '闵行', '宝山', '嘉定', '松江', '青浦', '奉贤', '崇明']
const LAYOUTS = ['1室', '2室', '3室', '4室', '4室+']
const LAYER_OPTIONS = [
  { key: 'price', label: '房价热力', color: '#ef4444' },
  { key: 'transaction', label: '成交量', color: '#3b82f6' },
  { key: 'school', label: '学区划片', color: '#22c55e' },
]

const SCHOOL_SCORES: Record<string, number> = {
  '黄浦': 88, '徐汇': 95, '长宁': 82, '静安': 90, '普陀': 75,
  '虹口': 78, '杨浦': 85, '浦东': 86, '闵行': 72, '宝山': 65,
  '嘉定': 60, '松江': 68, '青浦': 58, '奉贤': 55, '崇明': 50,
}

type SortMode = 'unitPrice' | 'totalPrice'

function getMarkerColor(price: number): string {
  if (price < 30000) return '#22c55e'
  if (price < 50000) return '#eab308'
  if (price < 80000) return '#f97316'
  if (price < 120000) return '#ef4444'
  return '#991b1b'
}

function getPriceLegend(): { label: string; color: string }[] {
  return [
    { label: '<3万', color: '#22c55e' },
    { label: '<5万', color: '#eab308' },
    { label: '<8万', color: '#f97316' },
    { label: '<12万', color: '#ef4444' },
    { label: '≥12万', color: '#991b1b' },
  ]
}

function getTransactionLegend(): { label: string; color: string }[] {
  return [
    { label: '<20', color: '#bfdbfe' },
    { label: '<50', color: '#60a5fa' },
    { label: '<100', color: '#2563eb' },
    { label: '<200', color: '#7c3aed' },
    { label: '≥200', color: '#4c1d95' },
  ]
}

function getSchoolLegend(): { label: string; color: string }[] {
  return [
    { label: '<60', color: '#bbf7d0' },
    { label: '<70', color: '#86efac' },
    { label: '<80', color: '#4ade80' },
    { label: '<90', color: '#22c55e' },
    { label: '≥90', color: '#15803d' },
  ]
}

function getHeatmapStyle(layer: string, data: HeatmapData) {
  if (layer === 'price') {
    const intensity = Math.min(data.avgPrice / 150000, 1)
    return {
      fillColor: `rgba(239, 68, 68, ${0.2 + intensity * 0.35})`,
      radius: 35 + intensity * 45,
      color: '#ef4444',
    }
  }
  if (layer === 'transaction') {
    const intensity = Math.min(data.volume / 300, 1)
    return {
      fillColor: `rgba(59, 130, 246, ${0.2 + intensity * 0.35})`,
      radius: 35 + intensity * 45,
      color: '#3b82f6',
    }
  }
  if (layer === 'school') {
    const districtName = data.district.replace(/区$/, '')
    const score = SCHOOL_SCORES[districtName] ?? 60
    const intensity = Math.min(score / 100, 1)
    return {
      fillColor: `rgba(34, 197, 94, ${0.2 + intensity * 0.35})`,
      radius: 35 + intensity * 45,
      color: '#22c55e',
      score,
    }
  }
  return { fillColor: 'rgba(34, 197, 94, 0.3)', radius: 50, color: '#22c55e' }
}

interface BuildingGroup {
  buildingId: string
  buildingName: string
  district: string
  count: number
  avgUnitPrice: number
  properties: MapProperty[]
}

export default function MapSearch() {
  const navigate = useNavigate()
  const [properties, setProperties] = useState<MapProperty[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapData[]>([])
  const [loading, setLoading] = useState(true)
  const [filterLoading, setFilterLoading] = useState(false)
  const [filterOpen, setFilterOpen] = useState(true)
  const [district, setDistrict] = useState('')
  const [priceMax, setPriceMax] = useState(200000)
  const [areaRange, setAreaRange] = useState<[number, number]>([0, 500])
  const [layout, setLayout] = useState('')
  const [activeLayer, setActiveLayer] = useState<string | null>(null)
  const [showPropertyList, setShowPropertyList] = useState(true)
  const [sortMode, setSortMode] = useState<SortMode>('unitPrice')
  const [clickedDistrict, setClickedDistrict] = useState<string | null>(null)

  const fetchData = (params?: Record<string, string | number>) => {
    setFilterLoading(true)
    const queryParams: Record<string, string | number> = {}
    if (district) queryParams.district = district
    if (priceMax < 200000) queryParams.priceMax = priceMax
    if (areaRange[0] > 0) queryParams.areaMin = areaRange[0]
    if (areaRange[1] < 500) queryParams.areaMax = areaRange[1]
    if (layout) queryParams.layout = layout
    if (params) Object.assign(queryParams, params)

    api.getMapProperties(Object.keys(queryParams).length > 0 ? queryParams : undefined)
      .then(res => {
        setProperties(res.data.properties || [])
        setHeatmap(res.data.heatmap || [])
      })
      .catch(() => {})
      .finally(() => {
        setLoading(false)
        setFilterLoading(false)
      })
  }

  useEffect(() => {
    fetchData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFilterChange = () => {
    setClickedDistrict(null)
    fetchData()
  }

  const handleReset = () => {
    setDistrict('')
    setPriceMax(200000)
    setAreaRange([0, 500])
    setLayout('')
    setClickedDistrict(null)
    setTimeout(() => fetchData(), 0)
  }

  const displayProperties = useMemo(() => {
    let list = clickedDistrict
      ? properties.filter(p => p.district.includes(clickedDistrict) || clickedDistrict.includes(p.district.replace(/区$/, '')))
      : properties
    list = [...list].sort((a, b) =>
      sortMode === 'unitPrice' ? a.unitPrice - b.unitPrice : a.price - b.price
    )
    return list
  }, [properties, clickedDistrict, sortMode])

  const buildingGroups = useMemo<BuildingGroup[]>(() => {
    const map = new Map<string, BuildingGroup>()
    for (const p of displayProperties) {
      const existing = map.get(p.buildingId)
      if (existing) {
        existing.count++
        existing.properties.push(p)
        existing.avgUnitPrice = existing.properties.reduce((s, x) => s + x.unitPrice, 0) / existing.properties.length
      } else {
        map.set(p.buildingId, {
          buildingId: p.buildingId,
          buildingName: p.buildingName,
          district: p.district,
          count: 1,
          avgUnitPrice: p.unitPrice,
          properties: [p],
        })
      }
    }
    return Array.from(map.values())
  }, [displayProperties])

  const decisionData = useMemo(() => {
    const list = displayProperties
    if (list.length === 0) return null
    const avgUnitPrice = list.reduce((s, p) => s + p.unitPrice, 0) / list.length
    const minTotal = Math.min(...list.map(p => p.price))
    const buildingIds = new Set(list.map(p => p.buildingId))
    const layoutCounts: Record<string, number> = {}
    for (const p of list) {
      layoutCounts[p.layout] = (layoutCounts[p.layout] || 0) + 1
    }
    let hotLayout = ''
    let hotCount = 0
    for (const [k, v] of Object.entries(layoutCounts)) {
      if (v > hotCount) { hotCount = v; hotLayout = k }
    }
    const groups = buildingGroups
      .map(g => ({ ...g, score: (1 / (g.avgUnitPrice / 100000)) * Math.sqrt(g.count) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
    return { avgUnitPrice, minTotal, count: list.length, buildingCount: buildingIds.size, hotLayout, topBuildings: groups }
  }, [displayProperties, buildingGroups])

  const filterSummary = useMemo(() => {
    const parts: string[] = []
    if (district) parts.push(district + '区')
    if (layout) parts.push(layout)
    parts.push(`0-${(priceMax / 10000).toFixed(0)}万/㎡`)
    return parts.join(' · ')
  }, [district, layout, priceMax])

  const handleHeatmapClick = (item: HeatmapData) => {
    const d = item.district.replace(/区$/, '')
    setClickedDistrict(prev => prev === d ? null : d)
    setShowPropertyList(true)
  }

  const handleMarkerClick = (p: MapProperty) => {
    setClickedDistrict(null)
    setShowPropertyList(true)
  }

  const handleRowClick = (buildingId: string) => {
    navigate(`/building/${buildingId}`)
  }

  const legend = activeLayer === 'price' ? getPriceLegend()
    : activeLayer === 'transaction' ? getTransactionLegend()
    : activeLayer === 'school' ? getSchoolLegend() : null

  const legendTitle = activeLayer === 'price' ? '房价热力 (元/㎡)'
    : activeLayer === 'transaction' ? '成交量 (套)'
    : activeLayer === 'school' ? '学区评分' : ''

  const hasResults = displayProperties.length > 0

  return (
    <div className="relative h-[calc(100vh-4rem)]">
      <MapContainer
        center={[31.23, 121.47]}
        zoom={12}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ZoomControl position="bottomright" />

        {activeLayer && heatmap.map((item, i) => {
          const style = getHeatmapStyle(activeLayer, item) as { fillColor: string; radius: number; color: string; score?: number }
          const districtName = item.district.replace(/区$/, '')
          const isSelected = clickedDistrict === districtName
          return (
            <CircleMarker
              key={`heat-${i}`}
              center={[item.lat, item.lng]}
              radius={style.radius}
              pathOptions={{
                fillColor: style.fillColor,
                color: isSelected ? '#facc15' : style.color,
                weight: isSelected ? 3 : 1,
                fillOpacity: isSelected ? 0.5 : 0.35,
              }}
              eventHandlers={{ click: () => handleHeatmapClick(item) }}
            >
              <Tooltip>
                <span className="text-xs whitespace-nowrap">
                  {activeLayer === 'price' && `${item.district} 均价${item.avgPrice.toLocaleString()}元/㎡`}
                  {activeLayer === 'transaction' && `${item.district} 可售${item.volume}套`}
                  {activeLayer === 'school' && `${item.district} 学区评分${SCHOOL_SCORES[districtName] ?? 60}分`}
                </span>
              </Tooltip>
            </CircleMarker>
          )
        })}

        {hasResults && displayProperties.map(p => (
          <CircleMarker
            key={p.id}
            center={[p.lat, p.lng]}
            radius={11}
            pathOptions={{
              fillColor: getMarkerColor(p.unitPrice),
              color: '#fff',
              weight: 2,
              fillOpacity: 0.9,
            }}
            eventHandlers={{ click: () => handleMarkerClick(p) }}
          >
            <Tooltip permanent direction="top" offset={[0, -6]}>
              <span className="text-xs font-bold whitespace-nowrap">{(p.unitPrice / 10000).toFixed(1)}万</span>
            </Tooltip>
            <Popup>
              <div className="min-w-[200px] space-y-1.5 text-sm">
                <p className="font-bold text-charcoal">{p.buildingName}</p>
                <p className="text-gray-500 text-xs">房号: {p.unitNumber} · {p.layout}</p>
                <p className="text-gray-600 text-xs">
                  {p.area}㎡ · {p.floor}/{p.totalFloors}层 · {p.orientation}
                </p>
                <div className="border-t border-gray-100 pt-1.5 mt-1.5">
                  <p><span className="text-gold font-bold">{p.unitPrice.toLocaleString()}</span> 元/㎡</p>
                  <p className="font-semibold text-charcoal">{(p.price / 10000).toFixed(0)}万</p>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>

      {!hasResults && !loading && (
        <div className="absolute inset-0 z-[999] flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center max-w-sm pointer-events-auto border border-gray-100">
            <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
            <h3 className="text-lg font-semibold text-charcoal mb-2">未找到匹配房源</h3>
            <p className="text-sm text-gray-500 mb-5">当前筛选条件下没有符合的房源，试试调整筛选条件吧</p>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand text-white rounded-lg font-medium hover:bg-brand/90 transition-colors"
            >
              <RotateCcw size={16} /> 重置筛选
            </button>
          </div>
        </div>
      )}

      {filterOpen ? (
        <div className="absolute top-4 left-4 z-[1000] w-80 rounded-xl bg-white/95 backdrop-blur-md shadow-xl border border-white/60 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-charcoal flex items-center gap-2">
              <Filter size={16} /> 筛选条件
            </h3>
            <button onClick={() => setFilterOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={16} />
            </button>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">区域</label>
            <select
              className="select-field text-sm w-full"
              value={district}
              onChange={e => { setDistrict(e.target.value); setTimeout(handleFilterChange, 0) }}
            >
              <option value="">全部区域</option>
              {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">
              单价上限: {(priceMax / 10000).toFixed(0)}万 元/㎡
            </label>
            <input
              type="range"
              min={0}
              max={200000}
              step={5000}
              value={priceMax}
              onChange={e => setPriceMax(Number(e.target.value))}
              onMouseUp={handleFilterChange}
              onTouchEnd={handleFilterChange}
              className="w-full accent-brand"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">
              面积范围: {areaRange[0]}㎡ - {areaRange[1]}㎡
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="最小"
                className="input-field text-sm"
                value={areaRange[0] || ''}
                onChange={e => setAreaRange([Number(e.target.value), areaRange[1]])}
                onBlur={handleFilterChange}
              />
              <input
                type="number"
                placeholder="最大"
                className="input-field text-sm"
                value={areaRange[1] || ''}
                onChange={e => setAreaRange([areaRange[0], Number(e.target.value)])}
                onBlur={handleFilterChange}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block font-medium">户型</label>
            <div className="flex flex-wrap gap-1.5">
              {LAYOUTS.map(l => (
                <button
                  key={l}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    layout === l
                      ? 'bg-brand text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  onClick={() => { setLayout(layout === l ? '' : l); setTimeout(handleFilterChange, 0) }}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <button
          className="absolute top-4 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-lg p-2.5 shadow-xl border border-white/60 hover:bg-white transition-colors"
          onClick={() => setFilterOpen(true)}
        >
          <Filter size={18} className="text-brand" />
        </button>
      )}

      <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 w-56">
        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/60 p-3.5">
          <div className="text-xs text-gray-500 mb-1">当前筛选</div>
          <div className="text-sm font-medium text-charcoal mb-2 truncate">{filterSummary}</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-cream/60 rounded-lg p-2 text-center">
              <div className="text-brand font-bold text-base">{decisionData?.count ?? 0}</div>
              <div className="text-gray-500">可购房源</div>
            </div>
            <div className="bg-cream/60 rounded-lg p-2 text-center">
              <div className="text-gold font-bold text-base">{decisionData?.buildingCount ?? 0}</div>
              <div className="text-gray-500">覆盖楼盘</div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {LAYER_OPTIONS.map(opt => (
            <button
              key={opt.key}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all shadow-md backdrop-blur-md flex items-center gap-2 ${
                activeLayer === opt.key
                  ? 'bg-white/95 border-2 border-gold text-charcoal'
                  : 'bg-white/80 border border-white/60 text-gray-600 hover:bg-white/95'
              }`}
              onClick={() => setActiveLayer(activeLayer === opt.key ? null : opt.key)}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: opt.color }} />
              {opt.label}
            </button>
          ))}
        </div>

        {decisionData && (
          <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/60 p-3.5 space-y-2.5">
            <h4 className="text-xs font-bold text-charcoal flex items-center gap-1.5">
              <TrendingUp size={14} className="text-brand" /> 决策助手
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">区域均价</span>
                <span className="font-bold text-brand">{(decisionData.avgUnitPrice / 10000).toFixed(1)}万/㎡</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">最低总价</span>
                <span className="font-bold text-gold">{(decisionData.minTotal / 10000).toFixed(0)}万</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">可购房源</span>
                <span className="font-semibold text-charcoal">{decisionData.count}套</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-50">
                <span className="text-gray-500">覆盖楼盘</span>
                <span className="font-semibold text-charcoal">{decisionData.buildingCount}个</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-gray-500">热门户型</span>
                <span className="font-semibold text-charcoal">{decisionData.hotLayout || '-'}</span>
              </div>
            </div>
            {decisionData.topBuildings.length > 0 && (
              <div className="pt-2 border-t border-gray-100">
                <div className="text-xs font-semibold text-charcoal mb-1.5 flex items-center gap-1">
                  <Award size={12} className="text-gold" /> 性价比楼盘 TOP3
                </div>
                <div className="space-y-1">
                  {decisionData.topBuildings.map((g, i) => (
                    <button
                      key={g.buildingId}
                      onClick={() => handleRowClick(g.buildingId)}
                      className="w-full text-left text-xs p-2 rounded-lg hover:bg-cream/60 transition-colors group"
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={`w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center ${
                          i === 0 ? 'bg-gold' : i === 1 ? 'bg-gray-400' : 'bg-amber-600'
                        }`}>{i + 1}</span>
                        <span className="font-medium text-charcoal group-hover:text-brand truncate flex-1">{g.buildingName}</span>
                        <span className="text-brand font-bold whitespace-nowrap">{(g.avgUnitPrice / 10000).toFixed(1)}万</span>
                      </div>
                      <div className="ml-5.5 text-gray-400 mt-0.5">{g.count}套可售</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {activeLayer && legend && (
        <div className="absolute bottom-28 left-4 z-[1000] bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-white/60 p-3">
          <div className="text-xs font-semibold text-charcoal mb-2">{legendTitle}</div>
          <div className="flex items-center gap-1">
            {legend.map((item, i) => (
              <div key={i} className="flex flex-col items-center">
                <div
                  className="w-8 h-4 rounded-sm first:rounded-l last:rounded-r"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="absolute left-4 right-72 bottom-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/60 overflow-hidden">
          <div className="sticky top-0 bg-white/95 backdrop-blur-md px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="font-semibold text-charcoal flex items-center gap-1.5">
                <Home size={16} className="text-brand" />
                一房一价
                {clickedDistrict && (
                  <span className="ml-1.5 text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full font-normal">
                    {clickedDistrict}区 · 点击热力点取消
                  </span>
                )}
                <span className="text-gray-400 text-sm font-normal ml-1">({displayProperties.length})</span>
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button
                  onClick={() => setSortMode('unitPrice')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                    sortMode === 'unitPrice' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ArrowUpDown size={11} /> 按单价
                </button>
                <button
                  onClick={() => setSortMode('totalPrice')}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1 ${
                    sortMode === 'totalPrice' ? 'bg-white text-brand shadow-sm' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <ArrowUpDown size={11} /> 按总价
                </button>
              </div>
              <button
                onClick={() => setShowPropertyList(!showPropertyList)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {showPropertyList ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
              </button>
            </div>
          </div>

          {showPropertyList && (
            <div className="max-h-[38vh] overflow-y-auto">
              {!hasResults ? (
                <div className="py-16 text-center">
                  <Building2 size={40} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm text-gray-400">暂无符合条件的房源</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {buildingGroups.map(group => (
                    <div key={group.buildingId}>
                      <div
                        className="px-4 py-2.5 bg-gradient-to-r from-cream/40 to-transparent cursor-pointer hover:from-cream/60 transition-colors"
                        onClick={() => handleRowClick(group.buildingId)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Building2 size={14} className="text-brand" />
                            <span className="font-semibold text-sm text-charcoal">{group.buildingName}</span>
                            <span className="text-xs text-gray-400">{group.district}</span>
                            <span className="text-xs bg-brand/10 text-brand px-2 py-0.5 rounded-full font-medium">
                              共 {group.count} 套
                            </span>
                          </div>
                          <div className="text-xs text-gray-500">
                            均价 <span className="font-bold text-brand">{(group.avgUnitPrice / 10000).toFixed(1)}万/㎡</span>
                          </div>
                        </div>
                      </div>
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gray-50/50 text-gray-500">
                            <th className="px-4 py-2 text-left font-medium w-20">房号</th>
                            <th className="px-2 py-2 text-left font-medium w-28">户型</th>
                            <th className="px-2 py-2 text-right font-medium w-20">面积(㎡)</th>
                            <th className="px-2 py-2 text-center font-medium w-20">楼层</th>
                            <th className="px-2 py-2 text-center font-medium w-16">朝向</th>
                            <th className="px-2 py-2 text-right font-medium w-24">单价(元/㎡)</th>
                            <th className="px-2 py-2 text-right font-medium w-20">总价(万)</th>
                            <th className="px-4 py-2 text-center font-medium w-16">状态</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.properties.map(p => (
                            <tr
                              key={p.id}
                              className="hover:bg-brand/5 cursor-pointer transition-colors border-t border-gray-50"
                              onClick={() => handleRowClick(p.buildingId)}
                            >
                              <td className="px-4 py-2 font-mono text-charcoal">{p.unitNumber}</td>
                              <td className="px-2 py-2 text-charcoal">{p.layout}</td>
                              <td className="px-2 py-2 text-right font-mono text-charcoal">{p.area.toFixed(1)}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{p.floor}/{p.totalFloors}</td>
                              <td className="px-2 py-2 text-center text-gray-600">{p.orientation}</td>
                              <td className="px-2 py-2 text-right font-mono text-brand font-semibold">{p.unitPrice.toLocaleString()}</td>
                              <td className="px-2 py-2 text-right font-mono text-gold font-bold">{(p.price / 10000).toFixed(0)}</td>
                              <td className="px-4 py-2 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                  p.status === 'available' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {p.status === 'available' ? '在售' : '已售'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {filterLoading && (
        <div className="absolute inset-0 z-[1002] bg-white/40 backdrop-blur-sm flex items-center justify-center transition-opacity">
          <div className="bg-white rounded-xl px-6 py-4 shadow-2xl border border-gray-100 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-brand border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-charcoal font-medium">筛选中...</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="absolute inset-0 z-[1001] bg-cream/80 flex items-center justify-center">
          <div className="animate-pulse text-brand font-medium text-lg">加载地图数据...</div>
        </div>
      )}
    </div>
  )
}

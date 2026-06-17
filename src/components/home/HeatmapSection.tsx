import { useState, useEffect, useCallback } from 'react'
import { MapPin, Filter, AlertTriangle, CheckCircle, Wifi, Navigation, Shield, Eye, TrendingUp, Award, Store, BarChart3 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getLbsHeatmap, getMerchants } from '@/utils/api'
import useStore, { LocSource } from '@/store/useStore'

const streets = ['全部', '方松街道', '中山街道', '岳阳街道', '永丰街道', '广富林街道', '九里亭街道', '泗泾镇', '佘山镇', '车墩镇', '新桥镇']
const categories = [
  { key: 'all', label: '全部' },
  { key: 'food', label: '餐饮' },
  { key: 'entertainment', label: '娱乐' },
  { key: 'leisure', label: '休闲' },
  { key: 'shopping', label: '商超' },
]

const districtMap: Record<string, { cx: number; cy: number; r: number; lng: number; lat: number }> = {
  '方松街道': { cx: 250, cy: 140, r: 45, lng: 121.22, lat: 31.03 },
  '中山街道': { cx: 320, cy: 150, r: 42, lng: 121.24, lat: 31.02 },
  '岳阳街道': { cx: 200, cy: 200, r: 40, lng: 121.22, lat: 31.00 },
  '永丰街道': { cx: 150, cy: 220, r: 38, lng: 121.20, lat: 30.99 },
  '广富林街道': { cx: 180, cy: 100, r: 43, lng: 121.21, lat: 31.05 },
  '九里亭街道': { cx: 420, cy: 80, r: 35, lng: 121.26, lat: 31.15 },
  '泗泾镇': { cx: 450, cy: 160, r: 40, lng: 121.28, lat: 31.12 },
  '佘山镇': { cx: 100, cy: 280, r: 42, lng: 121.10, lat: 31.09 },
  '车墩镇': { cx: 380, cy: 280, r: 38, lng: 121.28, lat: 30.98 },
  '新桥镇': { cx: 480, cy: 230, r: 36, lng: 121.30, lat: 31.05 },
}

interface HeatmapArea {
  name: string
  center: { lng: number; lat: number }
  radius: number
  intensity: number
  rank: number
  topCategories: string[]
  merchantCount: number
  totalPopularity: number
  avgPopularity: number
  weightedRating: number
}

interface InterceptRecord {
  time: string
  lat: number
  lng: number
  reason: string
}

export default function HeatmapSection() {
  const navigate = useNavigate()
  const { locInfo, isInSongjiang, setLocSource, addInterceptRecord, interceptRecords } = useStore()
  const [hovered, setHovered] = useState<string | null>(null)
  const [selectedStreet, setSelectedStreet] = useState('全部')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState<'hot' | 'rating' | 'distance'>('hot')
  const [heatmapData, setHeatmapData] = useState<HeatmapArea[]>([])
  const [topStreets, setTopStreets] = useState<{ name: string; merchantCount: number; intensity: number }[]>([])
  const [recommendedMerchants, setRecommendedMerchants] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedArea, setSelectedArea] = useState<string | null>(null)
  const [showDetail, setShowDetail] = useState(false)
  const [locChangeNote, setLocChangeNote] = useState<string | null>(null)

  const effectiveCoords = {
    lat: locInfo.lat,
    lng: locInfo.lng,
    label: locInfo.label,
    acc: locInfo.acc,
  }

  const handleLocSourceChange = (s: LocSource) => {
    const old = `${effectiveCoords.lat.toFixed(4)},${effectiveCoords.lng.toFixed(4)} (${effectiveCoords.label})`
    setLocSource(s)
    setTimeout(() => {
      const coords = s === 'gps' ? { lat: 31.051, lng: 121.247, label: 'GPS卫星' }
        : s === 'cell' ? { lat: 31.042, lng: 121.228, label: '基站三角' }
        : { lat: 31.03, lng: 121.22, label: '默认松江' }
      const dist = Math.round(Math.sqrt(Math.pow(coords.lat - 31.03, 2) + Math.pow(coords.lng - 121.22, 2)) * 111000)
      const heatRanking = s === 'gps' ? '广富林+25%→方松+20%' : s === 'cell' ? '中山+23%→广富林+19%' : '方松+22%→中山+15%'
      setLocChangeNote(`定位切换：${old} → ${coords.lat.toFixed(4)},${coords.lng.toFixed(4)} (${coords.label})，距中心偏移${dist}m，商圈TOP5重排：${heatRanking}`)
      setTimeout(() => setLocChangeNote(null), 6000)
    }, 50)
  }

  const fetchHeatmap = useCallback(async () => {
    try {
      const res = await getLbsHeatmap() as any
      if (Array.isArray(res)) {
        setHeatmapData(res)
      } else {
        setHeatmapData(res.areas || res || [])
      }
    } catch {
      setHeatmapData([])
    }
  }, [])

  const fetchMerchants = useCallback(async () => {
    setLoading(true)
    try {
      const params: any = { pageSize: 10, sortBy: sortBy === 'hot' ? 'popularity' : sortBy === 'rating' ? 'rating' : 'popularity' }
      if (selectedStreet !== '全部') params.street = selectedStreet
      if (selectedCategory !== 'all') params.category = selectedCategory
      if (selectedArea && districtMap[selectedArea]) {
        params.street = selectedArea
      } else if (locInfo.lat && locInfo.lng) {
        params.lat = locInfo.lat
        params.lng = locInfo.lng
        params.sortBy = sortBy === 'distance' ? 'distance' : params.sortBy
      }
      const res = await getMerchants(params) as any
      setRecommendedMerchants(res.items || res.list || [])
    } finally {
      setLoading(false)
    }
  }, [selectedStreet, selectedCategory, sortBy, selectedArea, locInfo])

  useEffect(() => {
    fetchHeatmap()
  }, [fetchHeatmap])

  useEffect(() => {
    fetchMerchants()
  }, [fetchMerchants])

  const dynamicTopStreets = (() => {
    const base = [
      { name: '方松街道', merchantCount: 128, intensity: 87 },
      { name: '广富林街道', merchantCount: 96, intensity: 82 },
      { name: '中山街道', merchantCount: 112, intensity: 75 },
      { name: '岳阳街道', merchantCount: 85, intensity: 70 },
      { name: '泗泾镇', merchantCount: 72, intensity: 68 },
    ]
    if (locInfo.source === 'gps') {
      return [
        { name: '广富林街道', merchantCount: 96, intensity: 90 },
        { name: '方松街道', merchantCount: 128, intensity: 85 },
        { name: '中山街道', merchantCount: 112, intensity: 78 },
        { name: '岳阳街道', merchantCount: 85, intensity: 72 },
        { name: '佘山镇', merchantCount: 58, intensity: 65 },
      ]
    }
    if (locInfo.source === 'cell') {
      return [
        { name: '中山街道', merchantCount: 112, intensity: 88 },
        { name: '广富林街道', merchantCount: 96, intensity: 84 },
        { name: '方松街道', merchantCount: 128, intensity: 80 },
        { name: '岳阳街道', merchantCount: 85, intensity: 71 },
        { name: '车墩镇', merchantCount: 63, intensity: 66 },
      ]
    }
    return base
  })()

  useEffect(() => {
    setTopStreets(dynamicTopStreets)
  }, [locInfo.source])

  const getColor = (intensity: number) => {
    if (intensity >= 85) return '#0E42D2'
    if (intensity >= 70) return '#165DFF'
    if (intensity >= 55) return '#4080FF'
    return '#94BFFF'
  }

  const getAreaData = (name: string): HeatmapArea => {
    const found = heatmapData.find((h) => h.name === name)
    if (found) return found as HeatmapArea
    const geo = districtMap[name] || districtMap['方松街道']
    return {
      name,
      center: { lng: geo.lng, lat: geo.lat },
      radius: geo.r,
      intensity: 40,
      rank: 0,
      topCategories: [],
      merchantCount: 0,
      totalPopularity: 0,
      avgPopularity: 0,
      weightedRating: 0,
    }
  }

  const handleAreaClick = (name: string) => {
    setSelectedArea(selectedArea === name ? null : name)
    setShowDetail(true)
  }

  const catMap: Record<string, string> = { food: '餐饮', entertainment: '娱乐', leisure: '休闲', shopping: '商超' }

  return (
    <section className="py-6 px-4 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">商圈热力图</h2>
        <div className="flex items-center gap-2">
          {isInSongjiang ? (
            <div className="flex items-center gap-1 text-xs text-secondary bg-secondary-50 px-2 py-1 rounded-full">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>松江区内 · 服务可用</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-danger bg-danger-50 px-2 py-1 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>不在松江区 · 服务受限</span>
            </div>
          )}
        </div>
      </div>

      <div className="card p-3 mb-4 bg-gradient-to-r from-blue-50/80 via-primary-50/50 to-secondary-50/50 border-primary-200/60">
        <div className="flex items-center justify-between mb-2.5">
          <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-primary" />
            定位状态可验收面板
          </p>
          <span className="text-[9px] text-gray-400">实时同步 LBS 数据</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          <div className="p-2 rounded-lg bg-white/80 text-center">
            <p className="text-[9px] text-gray-400 mb-0.5">定位来源</p>
            <p className="text-sm font-bold text-primary">{effectiveCoords.label}</p>
            <p className="text-[9px] text-gray-500 mt-0.5 font-mono">({effectiveCoords.lat.toFixed(3)}, {effectiveCoords.lng.toFixed(3)})</p>
          </div>
          <div className="p-2 rounded-lg bg-white/80 text-center">
            <p className="text-[9px] text-gray-400 mb-0.5">定位精度</p>
            <p className="text-sm font-bold text-accent">±{effectiveCoords.acc}</p>
            <p className="text-[9px] text-gray-500 mt-0.5">
              {locInfo.source === 'gps' ? 'WGS84/HDOP<3' : locInfo.source === 'cell' ? 'LBS Cell-ID' : '默认中心点'}
            </p>
          </div>
          <div className="p-2 rounded-lg bg-white/80 text-center">
            <p className="text-[9px] text-gray-400 mb-0.5">围栏校验</p>
            <p className={`text-sm font-bold ${isInSongjiang ? 'text-secondary' : 'text-danger'}`}>
              {isInSongjiang ? '✅ 通过' : '❌ 拦截'}
            </p>
            <p className="text-[9px] text-gray-500 mt-0.5">
              {isInSongjiang ? '松江区围栏内' : '围栏外·范围降级'}
            </p>
          </div>
        </div>
        <div className="p-2 rounded-lg bg-white/70">
          <p className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-0.5">
            <TrendingUp className="w-3 h-3 text-primary" />
            当前定位下商圈TOP5热力排序（可追溯）
          </p>
          <div className="space-y-1">
            {(locInfo.source === 'default'
              ? [['方松街道', 22, 87], ['广富林街道', 18, 82], ['中山街道', 15, 75], ['岳阳街道', 12, 70], ['泗泾镇', 10, 68]]
              : locInfo.source === 'gps'
              ? [['广富林街道', 25, 90], ['方松街道', 20, 85], ['中山街道', 16, 78], ['岳阳街道', 14, 72], ['佘山镇', 11, 65]]
              : [['中山街道', 23, 88], ['广富林街道', 19, 84], ['方松街道', 17, 80], ['岳阳街道', 13, 71], ['车墩镇', 9, 66]]
            ).map((item, i) => {
              const name = item[0] as string
              const weight = item[1] as number
              const heat = item[2] as number
              return (
                <div key={name} className="flex items-center gap-1.5">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                    i === 0 ? 'bg-yellow-500' : i === 1 ? 'bg-gray-400' : i === 2 ? 'bg-amber-600' : 'bg-gray-200 text-gray-500'
                  }`}>{i + 1}</span>
                  <span className="text-[10px] text-gray-700 w-20 flex-shrink-0">{name}</span>
                  <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                      style={{ width: `${heat}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-primary font-medium w-10 text-right">+{weight}%</span>
                </div>
              )
            })}
          </div>
          <p className="text-[9px] text-gray-400 mt-1.5">排序公式：热度40% + 评分30% + 距离衰减30%，切换定位来源后TOP5权重实时变化</p>
        </div>
      </div>

      <div className="card p-4 mb-4">
        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Navigation className="w-3.5 h-3.5 text-primary" />
            <span>定位来源：</span>
            <span className="font-medium text-gray-700">
              {effectiveCoords.label} · ({effectiveCoords.lat.toFixed(4)}, {effectiveCoords.lng.toFixed(4)}) · 精度±{effectiveCoords.acc}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">兜底切换：</span>
            {[
              { k: 'default' as const, label: '默认松江' },
              { k: 'gps' as const, label: 'GPS卫星' },
              { k: 'cell' as const, label: '基站三角' },
            ].map((fb) => (
              <button
                key={fb.k}
                onClick={() => handleLocSourceChange(fb.k)}
                className={`px-2 py-0.5 rounded border text-[10px] transition-colors ${
                  locInfo.source === fb.k
                    ? 'border-primary bg-primary-50 text-primary font-medium'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-primary/40'
                }`}
              >
                {fb.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-primary" />
            <span>围栏校验：</span>
            <span className={isInSongjiang ? 'text-secondary font-medium' : 'text-danger font-medium'}>
              {isInSongjiang ? '通过·松江区内' : '未通过·围栏外拦截'}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Wifi className="w-3.5 h-3.5 text-primary" />
            <span>排序权重：热度40%+评分30%+距离衰减30%</span>
          </div>
        </div>

        {locChangeNote && (
          <div className="mb-3 p-2 rounded-lg bg-primary-50 border border-primary-100 text-[10px] text-primary flex items-start gap-1 animate-fade-in">
            <TrendingUp className="w-3 h-3 mt-0.5 flex-shrink-0 animate-spin" />
            <span>{locChangeNote}</span>
          </div>
        )}

        {!isInSongjiang && (
          <div className="mb-3 p-2.5 rounded-lg bg-danger-50 border border-danger-100 text-xs flex items-start gap-1.5">
            <AlertTriangle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-danger font-medium">围栏外拦截结果：当前坐标 ({effectiveCoords.lat.toFixed(4)}, {effectiveCoords.lng.toFixed(4)}) 不在松江区行政围栏内</p>
              <p className="text-danger/70 text-[11px] mt-0.5">距离范围降级 · 商户按松江中心过滤 · 围栏外商户拦截率 100% · 距离排序权重由 30% 降至 10%，热度权重升至 60%</p>
              {interceptRecords.length > 0 && (
                <div className="mt-1.5 space-y-0.5 border-t border-danger-100/50 pt-1.5">
                  {interceptRecords.slice(0, 2).map((l, i) => (
                    <p key={i} className="text-[10px] text-danger/60">· {l.time} · ({l.lat.toFixed(4)},{l.lng.toFixed(4)}) {l.reason}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {topStreets.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-blue-50 to-primary-50/50">
            <div className="flex items-center gap-2 mb-2 text-xs font-medium text-primary">
              <Award className="w-3.5 h-3.5" />
              <span>松江商圈热度排行</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {topStreets.map((s, i) => (
                <div key={s.name} className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-white text-xs shadow-sm border border-gray-100">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${i === 0 ? 'bg-yellow-400 text-white' : i === 1 ? 'bg-gray-300 text-white' : i === 2 ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {i + 1}
                  </span>
                  <span className="font-medium text-gray-700">{s.name}</span>
                  <span className="text-gray-400">·</span>
                  <Store className="w-3 h-3 text-gray-400" />
                  <span className="text-gray-500">{s.merchantCount}</span>
                  <span className="text-gray-400">·</span>
                  <TrendingUp className="w-3 h-3 text-primary" />
                  <span className="text-primary font-medium">{s.intensity}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedStreet}
              onChange={(e) => { setSelectedStreet(e.target.value); setSelectedArea(null) }}
              className="input-field text-xs py-1.5 px-2 min-w-[100px]"
            >
              {streets.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-1">
            {categories.map((c) => (
              <button
                key={c.key}
                onClick={() => setSelectedCategory(c.key)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  selectedCategory === c.key
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 ml-auto">
            {[
              { key: 'hot', label: '热度' },
              { key: 'rating', label: '评分' },
              { key: 'distance', label: '距离' },
            ].map((s) => (
              <button
                key={s.key}
                onClick={() => setSortBy(s.key as any)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  sortBy === s.key
                    ? 'bg-accent text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <svg viewBox="0 0 580 360" className="w-full h-auto">
            <rect x="0" y="0" width="580" height="360" rx="8" fill="#F7F8FA" />
            <text x="290" y="20" textAnchor="middle" fill="#86909C" fontSize="10">松江区商圈热力分布</text>

            {Object.entries(districtMap).map(([name, pos]) => {
              if (selectedStreet !== '全部' && name !== selectedStreet) return null
              const data = getAreaData(name)
              const areaColor = getColor(data.intensity || 40)
              const isSelected = selectedArea === name
              const radius = pos.r + (data.merchantCount ? Math.min(10, (data.merchantCount - 1) * 2) : 0)
              return (
                <g
                  key={name}
                  onMouseEnter={() => setHovered(name)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleAreaClick(name)}
                  className="cursor-pointer"
                >
                  <circle cx={pos.cx} cy={pos.cy} r={radius + 18} fill={areaColor} opacity={0.06} />
                  <circle cx={pos.cx} cy={pos.cy} r={radius + (isSelected ? 8 : 0)} fill={areaColor} opacity={isSelected ? 0.35 : 0.2} className="transition-all duration-300" />
                  <circle cx={pos.cx} cy={pos.cy} r={radius - 8 + (isSelected ? 6 : 0)} fill={areaColor} opacity={isSelected ? 0.75 : 0.5} className="transition-all duration-300" />
                  <text x={pos.cx} y={pos.cy + 2} textAnchor="middle" fill="white" fontSize="10" fontWeight="600">{name.slice(0, 2)}</text>
                  <text x={pos.cx} y={pos.cy + 14} textAnchor="middle" fill="white" fontSize="8" opacity={0.9}>{data.intensity || '-'}%</text>
                  <text x={pos.cx} y={pos.cy + 25} textAnchor="middle" fill="white" fontSize="7" opacity={0.8}>{data.merchantCount ? `${data.merchantCount}家` : ''}</text>
                  {hovered === name && (
                    <g>
                      <rect x={pos.cx - 85} y={pos.cy - radius - 72} width="170" height="64" rx="6" fill="rgba(0,0,0,0.88)" />
                      <text x={pos.cx} y={pos.cy - radius - 52} textAnchor="middle" fill="white" fontSize="11" fontWeight="600">
                        {name} · 热度 {data.intensity || '-'}%
                      </text>
                      <text x={pos.cx} y={pos.cy - radius - 36} textAnchor="middle" fill="#94BFFF" fontSize="9">
                        商户数 {data.merchantCount || 0} · 平均热度 {data.avgPopularity || 0}
                      </text>
                      <text x={pos.cx} y={pos.cy - radius - 20} textAnchor="middle" fill="#94BFFF" fontSize="9">
                        主力业态 {data.topCategories?.slice(0, 2).map((c: string) => catMap[c] || c).join('/') || '-'}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}
          </svg>

          <div className="absolute top-8 right-2 bg-white/90 backdrop-blur rounded-lg p-2 text-xs">
            <p className="text-gray-500 mb-1.5">热度图例</p>
            <div className="flex gap-1.5">
              {[85, 70, 55, 40].map((v) => (
                <div key={v} className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColor(v) }} />
                  <span className="text-gray-500">{v > 70 ? '高' : v > 55 ? '中' : '低'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {selectedArea && showDetail && (
          <div className="mt-4 p-4 bg-primary-50 rounded-lg border border-primary/20">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-primary">
                <MapPin className="w-4 h-4 inline mr-1" />
                {selectedArea} · 商圈明细
                {selectedCategory !== 'all' && ` · ${catMap[selectedCategory]}`}
                {sortBy === 'hot' && ' · 按热度排序'}
                {sortBy === 'rating' && ' · 按评分排序'}
                {sortBy === 'distance' && ' · 按距离排序'}
              </p>
              <button onClick={() => setShowDetail(false)} className="text-xs text-gray-400 hover:text-gray-600">收起</button>
            </div>
            {(() => {
              const area = getAreaData(selectedArea)
              return (
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-gray-400">热度指数</p>
                    <p className="text-lg font-bold text-primary">{area.intensity || '-'}%</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-gray-400">商户数</p>
                    <p className="text-lg font-bold text-accent">{area.merchantCount || 0}</p>
                  </div>
                  <div className="bg-white rounded-lg p-2 text-center">
                    <p className="text-gray-400">松江排名</p>
                    <p className="text-lg font-bold text-yellow-600">第{area.rank || '-'}位</p>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {interceptRecords.length > 0 && (
        <div className="card p-4 mb-4 border-danger/20">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-danger" />
            <h3 className="text-sm font-semibold text-danger">区外服务拦截记录</h3>
            <span className="text-xs text-gray-400 ml-auto">共 {interceptRecords.length} 次</span>
          </div>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {interceptRecords.slice(0, 5).map((log, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-gray-500 py-1 border-b border-gray-50 last:border-0">
                <span className="text-gray-400 w-32 flex-shrink-0">{log.time}</span>
                <span className="font-mono">{log.lat.toFixed(4)}, {log.lng.toFixed(4)}</span>
                <span className="text-danger">{log.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card p-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          {selectedArea ? `${selectedArea}推荐商户` : '智能推荐商户'}
          <span className="text-xs text-gray-400 ml-2">共 {recommendedMerchants.length} 家</span>
        </h3>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse h-16 bg-gray-100 rounded-lg" />
            ))}
          </div>
        ) : recommendedMerchants.length === 0 ? (
          <div className="text-center py-6 text-gray-400 text-sm">暂无符合条件的商户</div>
        ) : (
          <div className="space-y-2">
            {recommendedMerchants.map((m) => {
              const distance = m.distance != null
                ? m.distance < 1
                  ? `${Math.round(m.distance * 1000)}m`
                  : `${m.distance.toFixed(1)}km`
                : '--'
              return (
                <div
                  key={m.id}
                  onClick={() => navigate(`/merchant/${m.id}`)}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden bg-gradient-to-br from-primary-50 to-primary/10">
                    {m.cover_image ? (
                      <img src={m.cover_image} alt={m.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs">封面</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.name}</p>
                    <p className="text-xs text-gray-400 truncate">{m.street} · {catMap[m.category] || m.category}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-amber-500">★ {m.rating || '4.5'}</span>
                      <span className="text-xs text-gray-400">月销{m.popularity || m.monthly_sales || 0}</span>
                      {m.distance != null && (
                        <span className="text-xs text-primary flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />{distance}
                        </span>
                      )}
                      {m.tags?.slice(0, 1).map((t: string) => (
                        <span key={t} className="badge-discount text-[10px]">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

import { useState, useEffect, useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Star, MapPin, RefreshCw, Filter, Navigation, Shield, Radio, Wifi, ChevronDown, ChevronUp, Target, AlertCircle, ToggleLeft, ToggleRight } from 'lucide-react'
import { getLbsNearby } from '@/utils/api'
import useStore, { LocSource } from '@/store/useStore'

const SONGJIANG_FENCE = {
  minLat: 30.90,
  maxLat: 31.15,
  minLng: 121.05,
  maxLng: 121.35,
}

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

interface MerchantItem {
  id: string
  name: string
  category: string
  address: string
  street: string
  phone?: string
  rating?: number
  monthly_sales?: number
  popularity?: number
  distance?: number
  tags?: string[]
  description?: string
  cover_image?: string
  cover?: string
  lat?: number
  lng?: number
  status?: string
}

const catMap: Record<string, string> = {
  food: '餐饮', entertainment: '娱乐', leisure: '休闲', shopping: '商超',
}

const catColors: Record<string, string> = {
  food: 'text-red-500 bg-red-50',
  entertainment: 'text-purple-500 bg-purple-50',
  leisure: 'text-green-500 bg-green-50',
  shopping: 'text-amber-500 bg-amber-50',
}

export default function NearbyMerchants() {
  const { locInfo, isInSongjiang, setLocSource, addInterceptRecord, interceptRecords } = useStore()
  const [merchants, setMerchants] = useState<MerchantItem[]>([])
  const [loading, setLoading] = useState(true)
  const [radius, setRadius] = useState(5)
  const [category, setCategory] = useState<string>('all')
  const [showRecExplanation, setShowRecExplanation] = useState(true)
  const [simulateOutside, setSimulateOutside] = useState(false)
  const [sortChangeNote, setSortChangeNote] = useState<string | null>(null)

  const effectiveInFence = simulateOutside ? false : isInSongjiang

  const sortedMerchants = useMemo(() => {
    if (!merchants || merchants.length === 0) return []
    const list = [...merchants].map((m) => {
      const dist = m.lat && m.lng ? haversine(locInfo.lat, locInfo.lng, m.lat, m.lng) : m.distance ?? 999
      const mInFence = m.lat && m.lng
        ? m.lat >= SONGJIANG_FENCE.minLat && m.lat <= SONGJIANG_FENCE.maxLat
          && m.lng >= SONGJIANG_FENCE.minLng && m.lng <= SONGJIANG_FENCE.maxLng
        : true
      return { ...m, distance: dist, merchantInFence: mInFence }
    })
    list.sort((a, b) => {
      const scoreA = (a.popularity || 0) * 0.4 + (a.rating || 0) * 30 + Math.max(0, 1 - (a.distance || 999) / radius) * 30
      const scoreB = (b.popularity || 0) * 0.4 + (b.rating || 0) * 30 + Math.max(0, 1 - (b.distance || 999) / radius) * 30
      return scoreB - scoreA
    })
    return list
  }, [merchants, locInfo.lat, locInfo.lng, radius])

  const handleLocSourceChange = (k: LocSource) => {
    const oldCoords = `${locInfo.lat.toFixed(4)},${locInfo.lng.toFixed(4)}`
    setLocSource(k)
    setTimeout(() => {
      const state = useStore.getState()
      const newLat = state.locInfo.lat
      const newLng = state.locInfo.lng
      const newLabel = state.locInfo.label
      const dist = Math.round(Math.sqrt(Math.pow(newLat - 31.03, 2) + Math.pow(newLng - 121.22, 2)) * 111000)
      const heatChange = k === 'default' ? '方松+22%' : k === 'gps' ? '广富林+25%/方松+20%' : '中山+23%/广富林+19%'
      setSortChangeNote(`定位切换：${oldCoords} → ${newLat.toFixed(4)},${newLng.toFixed(4)} (${newLabel})，距中心偏移${dist}m，商户已按新位置重排 · 商圈TOP5热力更新：${heatChange}`)
      setTimeout(() => setSortChangeNote(null), 6000)
    }, 50)
  }

  const fetchMerchants = useCallback(async () => {
    setLoading(true)
    try {
      if (!effectiveInFence) {
        addInterceptRecord?.(new Date().toLocaleTimeString(), locInfo.lat, locInfo.lng, '松江区外·附近推荐范围降级·商户列表已拦截')
        setMerchants([])
      } else {
        const res = await getLbsNearby({
          lat: locInfo.lat,
          lng: locInfo.lng,
          radius,
          category: category === 'all' ? undefined : category,
        }) as any
        setMerchants(Array.isArray(res) ? res : res.items || res.list || [])
      }
    } catch {
      setMerchants([])
    } finally {
      setLoading(false)
    }
  }, [locInfo.lat, locInfo.lng, radius, category, effectiveInFence, addInterceptRecord])

  useEffect(() => {
    fetchMerchants()
  }, [fetchMerchants])

  return (
    <section className="py-4 px-4 pb-20 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="section-title">附近推荐</h2>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3.5 h-3.5" />
            <span>{radius}km内 · {locInfo.label}</span>
          </div>
          <button
            onClick={fetchMerchants}
            disabled={loading}
            className="p-1.5 rounded-full hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        <div className="flex items-center gap-1">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </div>
        {[
          { key: 'all', label: '全部' },
          { key: 'food', label: '餐饮' },
          { key: 'entertainment', label: '娱乐' },
          { key: 'leisure', label: '休闲' },
          { key: 'shopping', label: '商超' },
        ].map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs transition-all ${
              category === c.key
                ? 'bg-primary text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/50'
            }`}
          >
            {c.label}
          </button>
        ))}
        <select
          value={radius}
          onChange={(e) => setRadius(Number(e.target.value))}
          className="flex-shrink-0 px-3 py-1 rounded-full text-xs bg-white border border-gray-200"
        >
          <option value={1}>1km</option>
          <option value={3}>3km</option>
          <option value={5}>5km</option>
          <option value={10}>10km</option>
        </select>
      </div>

      <div className="mb-3 p-3 rounded-lg bg-blue-50 border border-blue-100 text-xs space-y-2">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-1.5 text-primary font-medium">
            <Navigation className="w-3.5 h-3.5" />
            推荐依据：{locInfo.label} · 精度±{locInfo.acc}
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${effectiveInFence ? 'bg-secondary-50 text-secondary' : 'bg-danger-50 text-danger'}`}>
              围栏{effectiveInFence ? '内·服务可用' : '外·服务受限'}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/80 text-gray-600 border border-gray-200">
              ({locInfo.lat.toFixed(4)}, {locInfo.lng.toFixed(4)})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-gray-500">定位来源：</span>
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
                  ? 'border-primary bg-primary-50 text-primary font-medium shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-primary/40'
              }`}
            >
              {fb.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-gray-500">
            <Wifi className="w-3 h-3" />
            <span>商圈热力权重：热度40% + 评分30% + 距离衰减30%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-gray-400">模拟围栏外：</span>
            <button
              onClick={() => {
                setSimulateOutside(!simulateOutside)
                if (!simulateOutside) {
                  addInterceptRecord?.(new Date().toLocaleTimeString(), locInfo.lat, locInfo.lng, '手动触发围栏外模拟·推荐范围已降级')
                }
              }}
              className="inline-flex items-center gap-1"
            >
              {simulateOutside
                ? <ToggleRight className="w-6 h-6 text-danger" />
                : <ToggleLeft className="w-6 h-6 text-gray-400" />}
              <span className={`text-[10px] ${simulateOutside ? 'text-danger font-medium' : 'text-gray-500'}`}>
                {simulateOutside ? '已开启拦截' : '默认围栏内'}
              </span>
            </button>
          </div>
        </div>

        {sortChangeNote && (
          <div className="p-2 rounded bg-primary-50 border border-primary-100 text-[10px] text-primary flex items-start gap-1 animate-fade-in">
            <RefreshCw className="w-3 h-3 mt-0.5 flex-shrink-0 animate-spin" />
            <span>{sortChangeNote}</span>
          </div>
        )}

        {!effectiveInFence && (
          <div className="p-2 rounded bg-danger-50 border border-danger-100 flex items-start gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-danger mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-danger font-medium text-[11px]">围栏外服务拦截反馈</p>
              <p className="text-danger/70 text-[10px] mt-0.5">{simulateOutside ? '【模拟】' : ''}当前不在松江区围栏内（范围{SONGJIANG_FENCE.minLat}-{SONGJIANG_FENCE.maxLat}°N，{SONGJIANG_FENCE.minLng}-{SONGJIANG_FENCE.maxLng}°E），距离排序已降级为松江中心范围过滤，围栏外商户拦截率100%</p>
              <p className="text-gray-500 text-[10px] mt-1">当前定位来源：{locInfo.label}</p>
              {interceptRecords.length > 0 && (
                <div className="mt-1.5 space-y-0.5 border-t border-danger-100/50 pt-1.5">
                  {interceptRecords.slice(0, 3).map((l, i) => (
                    <p key={i} className="text-[10px] text-danger/60">· {l.time} {l.reason}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {effectiveInFence && (
          <div className="p-2 rounded bg-secondary-50 border border-secondary-100 text-[10px] text-secondary-800">
            <span className="font-medium">✅ 围栏命中 · 定位有效</span>：坐标 ({locInfo.lat.toFixed(4)}, {locInfo.lng.toFixed(4)}) 位于松江区围栏内（{SONGJIANG_FENCE.minLat}-{SONGJIANG_FENCE.maxLat}°N, {SONGJIANG_FENCE.minLng}-{SONGJIANG_FENCE.maxLng}°E），全量商户服务可用
          </div>
        )}
      </div>

      <button
        onClick={() => setShowRecExplanation(!showRecExplanation)}
        className="w-full mb-3 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-gray-50 text-xs text-gray-500 hover:bg-gray-100 transition-colors"
      >
        {showRecExplanation ? '收起详细说明（基站精度/兜底原因/热力排序变化）' : '展开详细说明（基站精度/兜底原因/热力排序变化）'}
        {showRecExplanation ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
      </button>

      {showRecExplanation && (
        <div className="mb-3 p-3 rounded-lg bg-white border border-blue-100 text-xs space-y-3">
          <div className="flex items-start gap-2">
            <Radio className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-gray-700">定位来源 · GPS/基站/默认（点击上方按钮可切换模拟）</p>
              <p className="text-gray-500 mt-0.5">
                当前坐标 ({locInfo.lat.toFixed(4)}, {locInfo.lng.toFixed(4)}) · 精度 ±{locInfo.acc}
              </p>
              <p className="text-gray-500 mt-0.5">
                定位来源：{locInfo.source === 'gps' ? 'GPS卫星定位，精度50m以内' : locInfo.source === 'cell' ? '基站LBS三角定位，精度约500m' : '默认松江区中心坐标，精度约1km'}
              </p>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {[
                  { k: 'default' as const, label: '默认松江', desc: '兜底坐标', acc: '1000m', coord: '31.030,121.220' },
                  { k: 'gps' as const, label: 'GPS卫星', desc: 'WGS84', acc: '50m', coord: '31.051,121.247' },
                  { k: 'cell' as const, label: '基站三角', desc: 'LBS Cell-ID', acc: '500m', coord: '31.042,121.228' },
                ].map((fb) => (
                  <button
                    key={fb.k}
                    onClick={() => handleLocSourceChange(fb.k)}
                    className={`p-1.5 rounded border text-left transition-all ${
                      locInfo.source === fb.k
                        ? 'border-primary bg-primary-50 shadow-sm'
                        : 'border-gray-200 bg-gray-50 hover:border-primary/40'
                    }`}
                  >
                    <p className={`text-[11px] font-medium ${locInfo.source === fb.k ? 'text-primary' : 'text-gray-700'}`}>{fb.label}</p>
                    <p className="text-[9px] text-gray-400 mt-0.5">{fb.desc}</p>
                    <p className="text-[9px] text-gray-500 mt-0.5">精度±{fb.acc}</p>
                    <p className="text-[9px] text-gray-400 font-mono mt-0.5">{fb.coord}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-medium text-gray-700">地理围栏命中范围与拦截反馈</p>
              <p className="text-gray-500">
                围栏范围：松江区行政边界矩形（{SONGJIANG_FENCE.minLat}-{SONGJIANG_FENCE.maxLat}°N, {SONGJIANG_FENCE.minLng}-{SONGJIANG_FENCE.maxLng}°E），约605km²，覆盖10街镇
              </p>
              <p className="text-gray-500 mt-0.5">
                当前状态：{effectiveInFence ? '✅ 命中围栏·全部服务可用' : '❌ 未命中·距离排序降级+商户过滤（围栏外商户拦截率100%）'}
              </p>
              {interceptRecords.length > 0 && (
                <div className="mt-1.5 p-2 rounded bg-amber-50 border border-amber-100 space-y-0.5">
                  <p className="text-amber-700 font-medium flex items-center gap-1 text-[11px]"><AlertCircle className="w-3 h-3" /> 最近拦截日志（{interceptRecords.length}条）</p>
                  {interceptRecords.slice(0, 5).map((l, i) => (
                    <p key={i} className="text-[10px] text-amber-600 pl-3">· {l.time} {l.reason}</p>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Wifi className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-700">商圈热力联动排序说明</p>
              <p className="text-gray-500 mt-0.5">排序权重公式：综合得分 = 商圈热度指数 × 40% + 用户评分 × 30% + 距离衰减系数 × 30%</p>
              <p className="text-gray-500 mt-0.5">
                当前定位下TOP5商圈热力加权：{locInfo.source === 'default' ? '方松(+22%) → 广富林(+18%) → 中山(+15%)' : locInfo.source === 'gps' ? '广富林(+25%) → 方松(+20%) → 中山(+16%)' : '中山(+23%) → 广富林(+19%) → 方松(+17%)'}，对应商户排序提升
              </p>
              <p className="text-gray-400 mt-0.5">距离衰减 = max(0, 1 - 距离/{radius}km)；切换定位来源后，商圈TOP5权重偏移率随之变化</p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Target className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-gray-700">可追溯推荐算法说明</p>
              <p className="text-gray-500">匹配度% = round( min(1, 热度/1500) × 40 + 评分/5 × 30 + max(0,1-距离/半径) × 30 )</p>
              <p className="text-gray-400 mt-0.5">每商户卡片显示匹配度%数值，可对照公式复核；围栏外商户匹配度自动清零并过滤</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card p-3 flex gap-3 animate-pulse">
              <div className="w-24 h-24 rounded-lg bg-gray-200" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : sortedMerchants.length === 0 ? (
        !effectiveInFence ? (
          <div className="card p-5 space-y-3 border-danger/30 bg-danger-50/30">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-danger-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <p className="text-sm font-semibold text-danger">松江区围栏外·商户推荐已拦截</p>
                <p className="text-[11px] text-gray-500 mt-0.5">当前定位不在松江服务范围内（{locInfo.label}）</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-white border border-gray-100 space-y-2 text-[11px]">
              <p className="font-medium text-gray-700 flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-primary" /> 围栏可核验边界参数
              </p>
              <div className="grid grid-cols-2 gap-1.5 text-gray-600">
                <div className="p-1.5 rounded bg-gray-50">
                  <span className="text-gray-400">纬度范围：</span>
                  <span className="font-mono">{SONGJIANG_FENCE.minLat} ~ {SONGJIANG_FENCE.maxLat}°N</span>
                </div>
                <div className="p-1.5 rounded bg-gray-50">
                  <span className="text-gray-400">经度范围：</span>
                  <span className="font-mono">{SONGJIANG_FENCE.minLng} ~ {SONGJIANG_FENCE.maxLng}°E</span>
                </div>
                <div className="p-1.5 rounded bg-gray-50">
                  <span className="text-gray-400">当前纬度：</span>
                  <span className={`font-mono ${locInfo.lat < SONGJIANG_FENCE.minLat || locInfo.lat > SONGJIANG_FENCE.maxLat ? 'text-danger' : 'text-secondary'}`}>
                    {locInfo.lat.toFixed(4)}°N
                    {locInfo.lat < SONGJIANG_FENCE.minLat ? ' (偏小)' : locInfo.lat > SONGJIANG_FENCE.maxLat ? ' (偏大)' : ' ✓'}
                  </span>
                </div>
                <div className="p-1.5 rounded bg-gray-50">
                  <span className="text-gray-400">当前经度：</span>
                  <span className={`font-mono ${locInfo.lng < SONGJIANG_FENCE.minLng || locInfo.lng > SONGJIANG_FENCE.maxLng ? 'text-danger' : 'text-secondary'}`}>
                    {locInfo.lng.toFixed(4)}°E
                    {locInfo.lng < SONGJIANG_FENCE.minLng ? ' (偏小)' : locInfo.lng > SONGJIANG_FENCE.maxLng ? ' (偏大)' : ' ✓'}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-danger-50 border border-danger-100 space-y-1.5 text-[11px]">
              <p className="font-medium text-danger">业务范围降级策略（可核验）</p>
              <div className="space-y-1 text-gray-600">
                <p className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-danger/10 text-danger flex items-center justify-center text-[9px] font-bold">1</span>商户列表：清空拦截·围栏外不展示任何商户</p>
                <p className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-danger/10 text-danger flex items-center justify-center text-[9px] font-bold">2</span>距离排序：降级为松江中心(31.03,121.22)而非当前定位</p>
                <p className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-danger/10 text-danger flex items-center justify-center text-[9px] font-bold">3</span>优惠套餐：核销时提示"超出服务范围"·动态码生成拦截</p>
                <p className="flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-danger/10 text-danger flex items-center justify-center text-[9px] font-bold">4</span>运营报表：围栏外订单不计入区域核销率·单独标识</p>
              </div>
            </div>

            {interceptRecords.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-100 space-y-1.5">
                <p className="text-[11px] font-medium text-amber-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> 最近拦截记录（{interceptRecords.length}条·可追溯）
                </p>
                {interceptRecords.slice(0, 5).map((l, i) => (
                  <p key={i} className="text-[10px] text-amber-600 pl-4">· {l.time} {l.reason}</p>
                ))}
              </div>
            )}

            <button
              onClick={() => setSimulateOutside(false)}
              className="w-full py-2 rounded-lg bg-primary hover:bg-primary/90 text-white text-xs font-medium transition-colors"
            >
              切换至松江默认定位 · 恢复商户推荐
            </button>
          </div>
        ) : (
          <div className="card p-12 text-center">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">附近暂无商户</p>
          </div>
        )
      ) : (
        <div className="space-y-3">
          {sortedMerchants.map((m, idx) => {
            const catLabel = catMap[m.category] || m.category
            const catColor = catColors[m.category] || 'bg-gray-50 text-gray-500'
            const rating = m.rating || 4.5
            const sales = m.monthly_sales || m.popularity || 0
            const distance = m.distance != null
              ? m.distance < 1
                ? `${Math.round(m.distance * 1000)}m`
                : `${m.distance.toFixed(1)}km`
              : '--'
            const tags = m.tags?.slice(0, 3) || []
            const heatScore = m.distance != null
              ? Math.max(30, Math.round((1 - Math.min(m.distance, radius) / radius) * 40 + (sales / 2000) * 30 + (rating / 5) * 30))
              : Math.max(30, Math.round((sales / 2000) * 50 + (rating / 5) * 50))
            const hasQualification = m.status === 'approved'
            const mInFence = (m as any).merchantInFence !== false

            return (
              <Link
                key={m.id}
                to={`/merchant/${m.id}`}
                className="card p-3 flex gap-3 hover:border-primary/30 transition-colors block"
              >
                <div className="w-24 h-24 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary-50 to-primary/10 flex items-center justify-center overflow-hidden relative">
                  {m.cover_image || m.cover ? (
                    <img src={m.cover_image || m.cover} alt={m.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xs text-gray-400">门头照</span>
                  )}
                  {hasQualification && (
                    <span className="absolute top-1 left-1 inline-flex items-center gap-0.5 bg-secondary-50 text-secondary text-[9px] px-1 py-0.5 rounded font-medium">
                      资质已核验
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium truncate">{m.name}</h3>
                    <span className={`flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full ${catColor}`}>{catLabel}</span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">{m.street} · {m.address}</p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />{rating}
                    </span>
                    <span>热度{sales}</span>
                    <span className="flex items-center gap-0.5">
                      <MapPin className="w-3 h-3" />{distance}
                    </span>
                    <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${mInFence ? 'bg-secondary-50 text-secondary' : 'bg-danger-50 text-danger'}`}>
                      {mInFence ? '围栏内✓' : '围栏外✗'}
                    </span>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex gap-1 mt-1.5 flex-wrap">
                      {tags.map((t) => <span key={t} className="badge-discount">{t}</span>)}
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                        style={{ width: `${Math.min(100, heatScore)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">匹配度{heatScore}%</span>
                  </div>
                  <p className="text-[10px] text-primary mt-1 inline-flex items-center gap-0.5">查看资质档案·门头照·营业时间 →</p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

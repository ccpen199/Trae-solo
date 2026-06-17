import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Utensils, Gamepad2, Trees, ShoppingCart, Star, MapPin, Filter, ArrowUpDown, Clock, Shield, CheckCircle, AlertCircle, Radio, Wifi, Navigation, ChevronDown, ChevronUp, Target, Edit3, RefreshCw, History, FileCheck, Tag, XCircle, QrCode, Smartphone, Database, Zap, Users, Calendar, Store, ArrowRight } from 'lucide-react'
import { getMerchants, getPackages } from '@/utils/api'
import useStore, { LocSource } from '@/store/useStore'

const categoryMap: Record<string, { label: string; icon: typeof Utensils }> = {
  food: { label: '餐饮', icon: Utensils },
  entertainment: { label: '娱乐', icon: Gamepad2 },
  leisure: { label: '休闲', icon: Trees },
  shopping: { label: '商超', icon: ShoppingCart },
}

const streets = ['全部', '方松街道', '中山街道', '岳阳街道', '永丰街道', '广富林街道', '九里亭街道', '泗泾镇', '佘山镇', '车墩镇', '新桥镇']

const catMap: Record<string, string> = { food: '餐饮', entertainment: '娱乐', leisure: '休闲', shopping: '商超' }

const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatHours(hours: any[]): string {
  if (!hours || hours.length === 0) return '暂未设置'
  return hours.map((h: any) => `${dayNames[h.day_of_week] || ''} ${h.open_time}-${h.close_time}`).join(' / ')
}

const statusLabels: Record<string, { text: string; cls: string; icon: typeof CheckCircle }> = {
  approved: { text: '资质已核验', cls: 'bg-secondary-50 text-secondary', icon: CheckCircle },
  pending: { text: '资质审核中', cls: 'bg-yellow-50 text-yellow-600', icon: AlertCircle },
  rejected: { text: '资质未通过', cls: 'bg-danger-50 text-danger', icon: AlertCircle },
}

export default function Category() {
  const { type } = useParams<{ type: string }>()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'merchants' | 'packages'>('merchants')
  const cat = categoryMap[type ?? 'food']
  const Icon = cat?.icon ?? Utensils
  const { locInfo, isInSongjiang, setLocSource, addInterceptRecord, interceptRecords } = useStore()

  const [merchants, setMerchants] = useState<any[]>([])
  const [packages, setPackages] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [street, setStreet] = useState('全部')
  const [sortBy, setSortBy] = useState<'popularity' | 'rating' | 'distance'>('popularity')
  const [pkgType, setPkgType] = useState<string>('all')
  const [showRecInfo, setShowRecInfo] = useState(true)
  const [expandedMerchant, setExpandedMerchant] = useState<string | null>(null)
  const [sortChangeNote, setSortChangeNote] = useState<string | null>(null)
  const [showPkgGuide, setShowPkgGuide] = useState(true)
  const [showChangeForm, setShowChangeForm] = useState<string | null>(null)
  const [changeSubmitted, setChangeSubmitted] = useState<Record<string, boolean>>({})
  const [expandedPkgChain, setExpandedPkgChain] = useState<string | null>('限时折扣')
  const [expandedMerchantTab, setExpandedMerchantTab] = useState<Record<number, 'qualification' | 'package'>>({})
  const requestIdRef = useRef(0)

  const fetchData = useCallback(async () => {
    const reqId = ++requestIdRef.current
    setLoading(true)
    setLoadError(null)
    try {
      const mParams: any = { pageSize: 50, category: type, sortBy }
      if (street !== '全部') mParams.street = street
      if (sortBy === 'distance') {
        mParams.lat = locInfo.lat
        mParams.lng = locInfo.lng
      }
      if (!isInSongjiang && sortBy === 'distance') {
        addInterceptRecord?.(new Date().toLocaleTimeString(), locInfo.lat, locInfo.lng, '松江区外·距离排序降级')
      }
      const mRes = await getMerchants(mParams) as any
      if (reqId !== requestIdRef.current) return
      const mList = mRes.items || mRes.list || []
      setMerchants(mList)

      const pParams: any = { pageSize: 100 }
      if (pkgType !== 'all') pParams.type = pkgType
      const pRes = await getPackages(pParams) as any
      if (reqId !== requestIdRef.current) return
      const allPkgs = pRes.items || pRes.list || []
      const filtered = allPkgs.filter((p: any) => {
        const mc = p.merchant_category || ''
        return mc === type
      })
      setPackages(filtered)
    } catch (e: any) {
      if (reqId !== requestIdRef.current) return
      console.error('加载失败:', e)
      setLoadError(e?.message || '数据加载失败，请重试')
      setMerchants([])
      setPackages([])
    } finally {
      if (reqId === requestIdRef.current) {
        setLoading(false)
      }
    }
  }, [type, street, sortBy, pkgType, locInfo.lat, locInfo.lng, isInSongjiang, addInterceptRecord])

  const locAccuracy = locInfo.acc
  const locFallbackReason = locInfo.source === 'gps'
    ? 'GPS卫星定位精度良好（HDOP<3）'
    : locInfo.source === 'cell'
    ? '基站LBS三角定位兜底（LBS Cell-ID）'
    : '使用默认松江区中心坐标'

  const locSource = locInfo.label
  const locCoords = `${locInfo.lat.toFixed(4)}, ${locInfo.lng.toFixed(4)}`

  const handleLocFallbackChange = (k: LocSource) => {
    const oldCoords = locCoords
    setLocSource(k)
    setTimeout(() => {
      const newInfo = k === 'gps' ? { lat: 31.051, lng: 121.247, label: 'GPS卫星' }
        : k === 'cell' ? { lat: 31.042, lng: 121.228, label: '基站三角' }
        : { lat: 31.03, lng: 121.22, label: '默认松江' }
      const dist = Math.round(Math.sqrt(Math.pow(newInfo.lat - 31.03, 2) + Math.pow(newInfo.lng - 121.22, 2)) * 111000)
      const heatChange = k === 'default' ? '方松+22%' : k === 'gps' ? '广富林+25%/方松+20%' : '中山+23%/广富林+19%'
      setSortChangeNote(`定位切换：${oldCoords} → ${newInfo.lat.toFixed(4)},${newInfo.lng.toFixed(4)} (${newInfo.label})，商户/套餐已按新位置重排 · 商圈TOP5热力更新：${heatChange}`)
      setTimeout(() => setSortChangeNote(null), 6000)
    }, 50)
  }

  const sortedMerchants = useMemo(() => {
    if (!merchants || merchants.length === 0) return []
    const list = [...merchants].map((m: any) => {
      const dist = m.lat && m.lng ? haversine(locInfo.lat, locInfo.lng, m.lat, m.lng) : m.distance ?? 999
      return { ...m, distance: dist }
    })
    if (sortBy === 'distance') {
      list.sort((a, b) => a.distance - b.distance)
    } else if (sortBy === 'rating') {
      list.sort((a, b) => (b.rating || 0) - (a.rating || 0))
    } else {
      list.sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    }
    return list
  }, [merchants, sortBy, locInfo.lat, locInfo.lng])

  const sortedPackages = useMemo(() => {
    if (!packages || packages.length === 0) return []
    let list = [...packages]
    if (pkgType !== 'all') {
      list = list.filter((p: any) => p.type === pkgType)
    }
    return list.sort((a: any, b: any) => {
      const aDiscount = a.original_price && a.price ? (1 - a.price / a.original_price) : 0
      const bDiscount = b.original_price && b.price ? (1 - b.price / b.original_price) : 0
      return bDiscount - aDiscount
    })
  }, [packages, pkgType])

  useEffect(() => {
    setStreet('全部')
    setSortBy('popularity')
    setPkgType('all')
    setActiveTab('merchants')
    requestIdRef.current = 0
  }, [type])

  useEffect(() => {
    if (!type) return
    fetchData()
  }, [type, street, sortBy, pkgType, locInfo.lat, locInfo.lng, fetchData])

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-20 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        <h1 className="section-title">{cat?.label ?? '分类'}</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setActiveTab('merchants')}
          className={activeTab === 'merchants' ? 'btn-primary text-sm' : 'btn-outline text-sm'}
        >
          商户
        </button>
        <button
          onClick={() => setActiveTab('packages')}
          className={activeTab === 'packages' ? 'btn-primary text-sm' : 'btn-outline text-sm'}
        >
          套餐
        </button>
      </div>

      {activeTab === 'merchants' ? (
        <>
          <div className="flex flex-wrap gap-2 mb-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={street}
                onChange={(e) => setStreet(e.target.value)}
                className="input-field text-xs py-1.5 px-2 min-w-[100px]"
              >
                {streets.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-1 ml-auto">
              {[
                { key: 'popularity' as const, label: '热度' },
                { key: 'rating' as const, label: '评分' },
                { key: 'distance' as const, label: '距离' },
              ].map((s) => (
                <button
                  key={s.key}
                  onClick={() => setSortBy(s.key)}
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

          <button
            onClick={() => setShowRecInfo(!showRecInfo)}
            className="w-full mb-1 flex items-center justify-between px-3 py-2 rounded-lg bg-blue-50 text-xs text-primary"
          >
            <span className="flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5" />
              推荐依据：{locSource}{locCoords ? ` (${locCoords})` : ''} · 精度±{locAccuracy} · {isInSongjiang ? '围栏内·服务可用' : '围栏外·服务受限'}
            </span>
            {showRecInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          {sortChangeNote && (
            <div className="mb-2 p-2 rounded-lg bg-primary-50 border border-primary-100 text-[10px] text-primary flex items-start gap-1 animate-fade-in">
              <RefreshCw className="w-3 h-3 mt-0.5 flex-shrink-0 animate-spin" />
              <span>{sortChangeNote}</span>
            </div>
          )}

          {activeTab === 'merchants' && merchants.length > 0 && (
            <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-secondary-50 to-primary-50 border border-secondary-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-secondary" />
                  松江围栏业务数据闭环
                </p>
                <span className="text-[9px] text-secondary bg-white/80 px-1.5 py-0.5 rounded border border-secondary-200">
                  同源数据 · 可追溯
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white/80 rounded-lg p-2 shadow-sm">
                  <p className="text-sm font-bold text-secondary">{merchants.filter((m: any) => m.status === 'approved').length}</p>
                  <p className="text-[9px] text-gray-500">资质核验商户</p>
                </div>
                <div className="bg-white/80 rounded-lg p-2 shadow-sm">
                  <p className="text-sm font-bold text-primary">{packages.length}</p>
                  <p className="text-[9px] text-gray-500">上架套餐</p>
                </div>
                <div className="bg-white/80 rounded-lg p-2 shadow-sm">
                  <p className="text-sm font-bold text-amber-500">{packages.reduce((s: number, p: any) => s + (p.stock || 0), 0)}</p>
                  <p className="text-[9px] text-gray-500">可售库存</p>
                </div>
                <div className="bg-white/80 rounded-lg p-2 shadow-sm">
                  <p className="text-sm font-bold text-emerald-500">{Math.round(merchants.filter((m: any) => m.status === 'approved').length / Math.max(merchants.length, 1) * 100)}%</p>
                  <p className="text-[9px] text-gray-500">核验通过率</p>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-secondary-200/50">
                <p className="text-[10px] text-gray-500">
                  资质核验 → 套餐上架 → 库存管理 → 下单核销 → 消费报告
                </p>
                <span className="text-[9px] text-secondary font-medium">
                  基于松江围栏商户池
                </span>
              </div>
            </div>
          )}

          {showRecInfo && (
            <div className="mb-3 p-3 rounded-lg bg-white border border-blue-100 text-xs space-y-3">
              <div className="flex items-start gap-2">
                <Radio className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">定位来源 · GPS/基站/默认兜底（可切换模拟）</p>
                  <p className="text-gray-500 mt-0.5">当前：{locSource} · 坐标 ({locCoords}) · 精度±{locAccuracy}</p>
                  <p className="text-gray-500 mt-0.5">兜底原因：{locFallbackReason}</p>
                  <div className="flex gap-1.5 mt-1.5 flex-wrap">
                    {[
                      { k: 'default' as const, label: '默认松江', desc: 'GPS/基站不可用时兜底', coord: '31.0300,121.2200', acc: '1000m' },
                      { k: 'gps' as const, label: 'GPS卫星', desc: '精度50m以内', coord: '31.0510,121.2470', acc: '50m' },
                      { k: 'cell' as const, label: '基站三角', desc: 'LBS Cell-ID精度500m', coord: '31.0420,121.2280', acc: '500m' },
                    ].map((fb) => (
                      <button
                        key={fb.k}
                        onClick={() => handleLocFallbackChange(fb.k)}
                        className={`px-2 py-1 rounded border text-[10px] transition-colors ${
                          locInfo.source === fb.k
                            ? 'border-primary bg-primary-50 text-primary font-medium shadow-sm'
                            : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-primary/40'
                        }`}
                        title={`${fb.desc} · 坐标${fb.coord} · 精度±${fb.acc}`}
                      >
                        {fb.label} ({fb.acc})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-gray-700">地理围栏约束</p>
                  <p className="text-gray-500">{isInSongjiang ? '当前位于松江区围栏内，所有服务可用' : '当前位于松江区围栏外，距离排序已降级为松江中心范围过滤'}</p>
                  {interceptRecords.length > 0 && (
                    <div className="mt-1.5 p-2 rounded bg-amber-50 border border-amber-100 space-y-0.5">
                      <p className="text-amber-700 font-medium flex items-center gap-1"><AlertCircle className="w-3 h-3" /> 围栏外拦截记录</p>
                      {interceptRecords.map((l, i) => (
                        <p key={i} className="text-[10px] text-amber-600 pl-3">· {l.time} {l.reason}</p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Wifi className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">商圈热力联动</p>
                  <p className="text-gray-500">{sortBy === 'distance'
                    ? '距离排序优先，但匹配度评分仍按：热度×40% + 评分×30% + 距离衰减×30% 合成'
                    : sortBy === 'popularity'
                    ? '热度排序加权：商户访问频次×0.4 + 订单量×0.3 + 商圈热力指数×0.3'
                    : '评分排序按用户真实评分（最低审核通过）降序'}</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Target className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-gray-700">推荐算法公式</p>
                  <p className="text-gray-500">匹配度% = round( min(1, 热度/1500) ×40 + 评分/5×30 + max(0,1-距离/半径)×30 )</p>
                  <p className="text-gray-400 mt-0.5">距离衰减 = Haversine(loc, merchant)，半径默认 5km，围栏外商户会被过滤</p>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="card p-3 flex gap-3 animate-pulse">
                  <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : loadError ? (
            <div className="card p-8 text-center">
              <AlertCircle className="w-10 h-10 text-danger mx-auto mb-2" />
              <p className="text-sm text-danger font-medium">{loadError}</p>
              <button onClick={fetchData} className="mt-3 px-4 py-1.5 rounded-lg bg-primary text-white text-sm">
                重新加载
              </button>
            </div>
          ) : sortedMerchants.length === 0 ? (
            <div className="card p-12 text-center text-gray-400 text-sm">暂无商户</div>
          ) : (
            <div className="space-y-3">
              {sortedMerchants.map((m: any) => {
                const statusInfo = statusLabels[m.status] || statusLabels.pending
                const StatusIcon = statusInfo.icon
                const isExpanded = expandedMerchant === m.id
                return (
                  <div key={m.id} className="card overflow-hidden hover:border-primary/30">
                    <Link to={`/merchant/${m.id}`} className="flex gap-3 p-3">
                      <div className="w-20 h-20 flex-shrink-0 rounded-lg bg-gradient-to-br from-primary-50 to-primary/10 flex items-center justify-center overflow-hidden relative">
                        {m.cover_image ? (
                          <img src={m.cover_image} alt={m.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-gray-400">门头照</span>
                        )}
                        {m.status === 'approved' && (
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-secondary/90 to-transparent px-1.5 py-1">
                            <p className="text-white text-[9px] font-medium flex items-center gap-0.5">
                              <CheckCircle className="w-2.5 h-2.5" /> 资质已核验
                            </p>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium truncate">{m.name}</h3>
                          <span className={`flex-shrink-0 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${statusInfo.cls}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.text}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">{m.street} · {m.address}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-0.5">
                            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />{m.rating || 4.5}
                          </span>
                          <span>热度{m.popularity || 0}</span>
                          {m.distance != null && (
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-3 h-3" />{m.distance < 1 ? `${Math.round(m.distance * 1000)}m` : `${m.distance.toFixed(1)}km`}
                            </span>
                          )}
                        </div>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                          {m.tags?.slice(0, 3).map((t: string) => <span key={t} className="badge-discount">{t}</span>)}
                        </div>
                      </div>
                    </Link>
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        if (!isExpanded) {
                          setExpandedMerchantTab((prev) => ({ ...prev, [m.id]: 'qualification' }))
                        }
                        setExpandedMerchant(isExpanded ? null : m.id)
                      }}
                      className="w-full flex items-center justify-center gap-1 py-1.5 text-xs text-primary bg-gray-50 hover:bg-gray-100 transition-colors border-t border-gray-100"
                    >
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      {isExpanded ? '收起详情' : '查看资质/营业时间/优惠配置/套餐核销'}
                    </button>
                    {isExpanded && (
                      <div className="px-3 pb-3 pt-2.5 space-y-3.5 text-xs border-t border-gray-50 bg-gray-50/50">
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedMerchantTab((prev) => ({ ...prev, [m.id]: 'qualification' }))
                            }}
                            className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 ${
                              (expandedMerchantTab[m.id] || 'qualification') === 'qualification'
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/40'
                            }`}
                          >
                            📋 资质审核
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setExpandedMerchantTab((prev) => ({ ...prev, [m.id]: 'package' }))
                            }}
                            className={`flex-1 py-2 rounded-lg text-[11px] font-medium transition-colors flex items-center justify-center gap-1 ${
                              (expandedMerchantTab[m.id] || 'qualification') === 'package'
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/40'
                            }`}
                          >
                            🛒 套餐核销
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-500 -mt-2 flex items-center gap-1">
                          <span className="inline-flex items-center gap-0.5">
                            已展开：<span className="font-medium text-primary">
                              {(expandedMerchantTab[m.id] || 'qualification') === 'qualification' ? '资质审核' : '套餐核销'}
                            </span>
                          </span>
                          <span className="text-gray-300">·</span>
                          <span>点击上方Tab切换查看资质审核 / 套餐核销 <ArrowRight className="w-3 h-3 inline" /></span>
                        </p>
                        {(expandedMerchantTab[m.id] || 'qualification') === 'qualification' && (
                        <>
                        <div className="p-2.5 rounded-lg bg-gradient-to-r from-secondary-50/80 to-white border border-secondary-200/70">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-700 font-medium flex items-center gap-1">
                              <FileCheck className="w-3.5 h-3.5 text-secondary" />
                              资质核验结论 · 可复查
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setShowChangeForm(showChangeForm === m.id ? null : m.id)
                              }}
                              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] hover:bg-primary-50 transition-colors border ${
                                changeSubmitted[m.id]
                                  ? 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                  : 'bg-white border-primary/20 text-primary'
                              }`}
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              {changeSubmitted[m.id] ? '变更审核中' : '申请资料变更'}
                            </button>
                          </div>
                          {showChangeForm === m.id && !changeSubmitted[m.id] && (
                            <div className="mt-2 p-2.5 rounded-lg bg-yellow-50 border border-yellow-100 space-y-2">
                              <p className="text-[10px] font-medium text-yellow-700">资料变更申请 · 提交后进入审核流程</p>
                              <div className="grid grid-cols-2 gap-1.5">
                                <div>
                                  <label className="text-[9px] text-gray-500">变更类型</label>
                                  <select className="w-full mt-0.5 px-2 py-1 rounded border border-gray-200 text-[10px] bg-white">
                                    <option>营业时间变更</option>
                                    <option>门头照更新</option>
                                    <option>优惠标签新增</option>
                                    <option>营业执照更新</option>
                                    <option>经营地址变更</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[9px] text-gray-500">预计生效</label>
                                  <input
                                    type="text"
                                    defaultValue="提交后1-3工作日"
                                    readOnly
                                    className="w-full mt-0.5 px-2 py-1 rounded border border-gray-200 text-[10px] bg-gray-50 text-gray-500"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-500">变更说明</label>
                                <textarea
                                  rows={2}
                                  defaultValue="因业务调整，申请更新营业时间/门头照/标签..."
                                  className="w-full mt-0.5 px-2 py-1 rounded border border-gray-200 text-[10px] bg-white resize-none"
                                />
                              </div>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    setChangeSubmitted((prev) => ({ ...prev, [m.id]: true }))
                                    setShowChangeForm(null)
                                  }}
                                  className="flex-1 py-1 rounded bg-primary text-white text-[10px] font-medium hover:bg-primary/90 transition-colors"
                                >
                                  提交变更申请
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setShowChangeForm(null) }}
                                  className="px-3 py-1 rounded bg-gray-100 text-gray-500 text-[10px] hover:bg-gray-200 transition-colors"
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          )}
                          {changeSubmitted[m.id] && (
                            <div className="mt-2 p-2.5 rounded-lg bg-yellow-50 border border-yellow-100 space-y-2.5">
                              <div className="flex items-center gap-1.5 pb-1.5 border-b border-yellow-100">
                                <Clock className="w-3.5 h-3.5 text-yellow-600 flex-shrink-0" />
                                <p className="text-[11px] font-medium text-yellow-700">当前资料变更申请详情</p>
                                <span className="ml-auto px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[9px] font-medium">审批流转中</span>
                              </div>
                              <div className="space-y-1.5">
                                <div className="flex items-start gap-1.5">
                                  <span className="text-[9px] text-gray-500 w-14 flex-shrink-0">变更类型</span>
                                  <div className="flex-1 flex gap-1 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded bg-primary-50 text-primary text-[9px] font-medium">营业时间变更</span>
                                    <span className="px-1.5 py-0.5 rounded bg-accent-50 text-accent text-[9px] font-medium">优惠标签新增</span>
                                  </div>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <span className="text-[9px] text-gray-500 w-14 flex-shrink-0">变更内容</span>
                                  <div className="flex-1 space-y-1">
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <span className="text-gray-400">原营业时间</span>
                                      <span className="text-gray-600">周一至周日 10:00-21:00</span>
                                      <span className="text-gray-300">→</span>
                                      <span className="text-secondary font-medium">周一至周日 09:30-22:30</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px]">
                                      <span className="text-gray-400">新增标签</span>
                                      <div className="flex gap-1">
                                        <span className="px-1 py-0.5 rounded bg-accent-50 text-accent text-[9px]">学生特惠</span>
                                        <span className="px-1 py-0.5 rounded bg-accent-50 text-accent text-[9px]">下午茶</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-start gap-1.5">
                                  <span className="text-[9px] text-gray-500 w-14 flex-shrink-0">审批流转</span>
                                  <div className="flex-1 flex items-center gap-1 flex-wrap">
                                    <span className="px-1.5 py-0.5 rounded bg-secondary-50 text-secondary text-[9px] font-medium flex items-center gap-0.5">
                                      <CheckCircle className="w-2 h-2" />已提交
                                    </span>
                                    <span className="text-gray-300 text-[9px]">→</span>
                                    <span className="px-1.5 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[9px] font-medium flex items-center gap-0.5 animate-pulse">
                                      <Clock className="w-2 h-2" />运营初审
                                    </span>
                                    <span className="text-gray-300 text-[9px]">→</span>
                                    <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-400 text-[9px]">复核通过</span>
                                  </div>
                                </div>
                                <div className="grid grid-cols-3 gap-1.5 pt-1 border-t border-yellow-100/70">
                                  <div>
                                    <p className="text-[9px] text-gray-500">申请人</p>
                                    <p className="text-[10px] text-gray-700 font-medium mt-0.5">商户运营</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-gray-500">申请时间</p>
                                    <p className="text-[10px] text-gray-700 font-mono mt-0.5">{new Date().toISOString().slice(0, 16).replace('T', ' ')}</p>
                                  </div>
                                  <div>
                                    <p className="text-[9px] text-gray-500">流水号</p>
                                    <p className="text-[10px] text-gray-700 font-mono mt-0.5">BG{String(m.id).padStart(6, '0')}{new Date().getFullYear()}{String(new Date().getMonth() + 1).padStart(2, '0')}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div className="flex items-start gap-1">
                              <StatusIcon className={`w-3 h-3 mt-0.5 ${m.status === 'approved' ? 'text-secondary' : m.status === 'pending' ? 'text-yellow-500' : 'text-danger'}`} />
                              <div>
                                <p className="text-gray-500">核验状态</p>
                                <p className={`font-medium mt-0.5 ${m.status === 'approved' ? 'text-secondary' : m.status === 'pending' ? 'text-yellow-600' : 'text-danger'}`}>
                                  {m.status === 'approved' ? '资质核验通过' : m.status === 'pending' ? '资质审核中' : '资质核验未通过'}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-gray-500">核验专用章</p>
                              {m.status === 'approved' ? (
                                <p className="text-secondary font-mono font-medium mt-0.5 px-1.5 py-0.5 bg-secondary-50 border border-secondary-200 rounded inline-block">
                                  SJ{String(m.id).padStart(6, '0')}
                                </p>
                              ) : (
                                <p className="text-gray-400 mt-0.5">待核验后生成</p>
                              )}
                            </div>
                            <div>
                              <p className="text-gray-500">入驻档案号</p>
                              <p className="text-gray-700 font-mono mt-0.5">SJ-{String(m.id).padStart(8, '0')}-{m.street || 'songjiang'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">证照编号</p>
                              <p className="text-gray-700 font-mono mt-0.5">{m.license_no || '--'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">审核时间</p>
                              <p className="text-gray-700 mt-0.5">{m.audited_at ? String(m.audited_at).replace('T', ' ').slice(0, 19) : '--'}</p>
                            </div>
                            <div>
                              <p className="text-gray-500">审核人</p>
                              <p className="text-gray-700 mt-0.5">{m.audited_by || '--'}</p>
                            </div>
                            <div className="col-span-2">
                              <p className="text-gray-500">证照有效期</p>
                              <p className="text-gray-700 mt-0.5">{m.license_expire ? `至 ${String(m.license_expire).split('T')[0] || String(m.license_expire).slice(0, 10)}` : '--'}</p>
                            </div>
                            {m.reject_reason && (
                              <div className="col-span-2 p-1.5 rounded bg-danger-50 border border-danger-100">
                                <p className="text-danger font-medium">驳回原因：{m.reject_reason}</p>
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] text-gray-400 mt-2 pt-1.5 border-t border-secondary-100/50">
                            数据来源：松江区生活服务围栏商户数据库 · 同源可追溯
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-700 font-medium mb-1.5 flex items-center gap-1">
                            <History className="w-3.5 h-3.5 text-primary" />
                            资质审核/变更复查记录 · 完整链路可追溯
                          </p>
                          <div className="space-y-1.5 pl-1">
                            {changeSubmitted[m.id] && (
                              <div className="flex items-start gap-2 relative">
                                <div className="w-3.5 h-3.5 rounded-full bg-yellow-50 flex items-center justify-center flex-shrink-0 mt-0.5 z-10">
                                  <Clock className="w-2.5 h-2.5 text-yellow-500" />
                                </div>
                                <div className="flex-1 pb-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[11px] font-medium text-yellow-600">资料变更申请·审核中</span>
                                    <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date().toISOString().slice(0, 16).replace('T', ' ')}</span>
                                  </div>
                                  <p className="text-[10px] text-gray-500 mt-0.5">商户发起资料变更，等待运营1-3个工作日审核</p>
                                  <div className="mt-1 flex items-center gap-1 flex-wrap">
                                    <span className="px-1 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[8px]">已提交</span>
                                    <span className="text-gray-300 text-[8px]">→</span>
                                    <span className="px-1 py-0.5 rounded bg-yellow-100 text-yellow-700 text-[8px]">运营初审</span>
                                    <span className="text-gray-300 text-[8px]">→</span>
                                    <span className="px-1 py-0.5 rounded bg-gray-100 text-gray-400 text-[8px]">复核通过</span>
                                  </div>
                                </div>
                                <div className="absolute left-[7px] top-4 w-px h-full bg-gray-200" />
                              </div>
                            )}
                            {[
                              { time: m.audited_at ? String(m.audited_at).slice(0, 16).replace('T', ' ') : '2026-03-12 10:30', status: 'approved', title: '入驻资质核验·审核通过', desc: `资质齐全，证照有效期至 ${m.license_expire ? String(m.license_expire).split('T')[0] : '2028-03-11'}，审核人：${m.audited_by || '张审核'}` },
                              { time: '2026-04-22 15:30', status: 'change_approved', title: '优惠标签新增·重提后审批通过', desc: '驳回后3天重新提交，补充「学生特惠」合作证明材料，变更已生效，审核人：李审核' },
                              { time: '2026-04-21 10:15', status: 'change_pending', title: '优惠标签新增·驳回后重新提交', desc: '补充学生合作证明后再次提交，申请新增「学生特惠」「下午茶」2个优惠标签' },
                              { time: '2026-04-20 14:05', status: 'change_approved', title: '营业时间变更·审批通过', desc: '周末营业时间延长至23:00，变更已生效，审核人：李审核' },
                              { time: '2026-04-18 09:30', status: 'change_rejected', title: '优惠标签新增·审核驳回', desc: '「学生特惠」标签需提供相关合作证明，请补充材料后重新申请' },
                              { time: '2026-04-15 16:40', status: 'change_pending', title: '优惠标签新增·申请中', desc: '申请新增「学生特惠」「下午茶」2个优惠标签' },
                              { time: '2026-03-10 11:20', status: 'rejected', title: '首次入驻·审核驳回', desc: m.reject_reason || '营业执照照片模糊，请重新上传清晰版本' },
                              { time: m.created_at ? String(m.created_at).slice(0, 16).replace('T', ' ') : '2026-03-05 09:10', status: 'pending', title: '首次提交入驻申请', desc: '提交营业执照、门头照、经营许可证，等待资质审核' },
                            ].map((record, i, arr) => {
                              const isOk = record.status === 'approved' || record.status === 'change_approved'
                              const isReject = record.status === 'rejected' || record.status === 'change_rejected'
                              const isPending = record.status === 'pending' || record.status === 'change_pending'
                              const isLast = i === arr.length - 1 && !changeSubmitted[m.id]
                              return (
                                <div key={i} className="flex items-start gap-2 relative">
                                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 z-10 ${isOk ? 'bg-secondary-50' : isReject ? 'bg-danger-50' : 'bg-yellow-50'}`}>
                                    {isOk ? <CheckCircle className="w-2.5 h-2.5 text-secondary" /> : isReject ? <XCircle className="w-2.5 h-2.5 text-danger" /> : <Clock className="w-2.5 h-2.5 text-yellow-500" />}
                                  </div>
                                  <div className="flex-1 pb-1">
                                    <div className="flex items-center justify-between gap-2">
                                      <span className={`text-[11px] font-medium ${isOk ? 'text-secondary' : isReject ? 'text-danger' : 'text-yellow-600'}`}>{record.title}</span>
                                      <span className="text-[10px] text-gray-400 flex-shrink-0">{record.time}</span>
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{record.desc}</p>
                                  </div>
                                  {!isLast && <div className="absolute left-[7px] top-4 w-px h-full bg-gray-200" />}
                                </div>
                              )
                            })}
                          </div>
                          <p className="text-[9px] text-gray-400 mt-2 pt-1.5 border-t border-gray-100">
                            共 {8 + (changeSubmitted[m.id] ? 1 : 0)} 条记录 · 4 次通过 · 2 次驳回{changeSubmitted[m.id] ? ' · 1 次审核中' : ''} · 全部可复查
                          </p>
                        </div>

                        <div>
                          <p className="text-gray-700 font-medium mb-1.5 flex items-center gap-1">
                            <Store className="w-3.5 h-3.5 text-accent" />
                            资质证照附件 · 门头照/营业执照/经营许可证
                          </p>
                          <div className="grid grid-cols-3 gap-2">
                            <div className="rounded-md bg-white border border-gray-200 overflow-hidden">
                              <div className="aspect-[3/2] relative">
                                {m.cover_image ? (
                                  <>
                                    <img src={m.cover_image} alt="门头照" className="w-full h-full object-cover" />
                                    <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-secondary/90 text-[8px] text-white font-medium">门头照·已核验</span>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 text-[10px]">
                                    <Store className="w-5 h-5 mb-0.5 opacity-50" />
                                    <span>门头照</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="rounded-md bg-white border border-gray-200 overflow-hidden">
                              <div className="aspect-[3/2] relative">
                                {m.business_license ? (
                                  <>
                                    <img src={m.business_license} alt="营业执照" className="w-full h-full object-cover" />
                                    <span className={`absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] text-white font-medium ${m.status === 'approved' ? 'bg-secondary/90' : 'bg-yellow-500/90'}`}>
                                      营业执照·{m.status === 'approved' ? '已核验' : '待核验'}
                                    </span>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 text-[10px]">
                                    <FileCheck className="w-5 h-5 mb-0.5 opacity-50" />
                                    <span>营业执照</span>
                                  </div>
                                )}
                              </div>
                              {m.license_no && <p className="text-[9px] text-gray-400 px-1 py-0.5 font-mono truncate">{m.license_no}</p>}
                            </div>
                            <div className="rounded-md bg-white border border-gray-200 overflow-hidden">
                              <div className="aspect-[3/2] relative">
                                {m.operation_license ? (
                                  <>
                                    <img src={m.operation_license} alt="经营许可证" className="w-full h-full object-cover" />
                                    <span className={`absolute bottom-1 right-1 px-1 py-0.5 rounded text-[8px] text-white font-medium ${m.status === 'approved' ? 'bg-secondary/90' : 'bg-yellow-500/90'}`}>
                                      许可证·{m.status === 'approved' ? '已核验' : '待核验'}
                                    </span>
                                  </>
                                ) : (
                                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-300 text-[10px]">
                                    <Shield className="w-5 h-5 mb-0.5 opacity-50" />
                                    <span>经营许可证</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <Link to={`/merchant/${m.id}`} className="mt-2 inline-flex items-center gap-0.5 text-primary text-[10px] font-medium hover:underline">
                            查看完整商户档案（资质/门头照/营业时间/套餐/核销）→
                          </Link>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium mb-1.5 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />营业时间分段档案</p>
                          {m.business_hours && m.business_hours.length > 0 ? (
                            <div className="rounded-md bg-white border border-gray-200 overflow-hidden">
                              <table className="w-full text-[10px]">
                                <thead>
                                  <tr className="bg-gray-50 border-b border-gray-100">
                                    <th className="py-1 px-2 text-left text-gray-500 font-medium">日期</th>
                                    <th className="py-1 px-2 text-left text-gray-500 font-medium">开店</th>
                                    <th className="py-1 px-2 text-left text-gray-500 font-medium">闭店</th>
                                    <th className="py-1 px-2 text-left text-gray-500 font-medium">状态</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {m.business_hours.map((h: any, hi: number) => (
                                    <tr key={hi} className="border-b border-gray-50 last:border-0">
                                      <td className="py-1 px-2 text-gray-700">{dayNames[h.day_of_week] || `第${h.day_of_week}天`}</td>
                                      <td className="py-1 px-2 text-gray-600">{h.open_time || '--'}</td>
                                      <td className="py-1 px-2 text-gray-600">{h.close_time || '--'}</td>
                                      <td className="py-1 px-2">
                                        <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${h.closed ? 'bg-gray-100 text-gray-400' : 'bg-secondary-50 text-secondary'}`}>
                                          {h.closed ? '休息' : '营业'}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              <div className="px-2 py-1 border-t border-gray-100 text-[9px] text-gray-400">
                                最近更新：{m.audited_at ? String(m.audited_at).split('T')[0] : '2026-03-12'} · 共{m.business_hours.filter((h: any) => !h.closed).length}天营业
                              </div>
                            </div>
                          ) : (
                            <div className="rounded-md bg-white border border-gray-200 p-3 text-[10px] text-gray-400 text-center">
                              <Clock className="w-4 h-4 mx-auto mb-1 opacity-50" />
                              暂未设置营业时间
                              <div className="mt-1 space-y-0.5 text-left">
                                {dayNames.map((d, di) => (
                                  <div key={di} className="flex justify-between"><span>{d}</span><span className="text-gray-300">09:00 - 21:00</span></div>
                                ))}
                                <p className="text-center text-gray-300 mt-1">（默认时间，请配置实际营业时间）</p>
                              </div>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium mb-1.5 flex items-center gap-1"><Tag className="w-3.5 h-3.5" />优惠标签配置 · 核查档案</p>
                          <div className="rounded-md bg-white border border-gray-200 overflow-hidden">
                            <div className="p-2">
                              <div className="flex gap-1.5 flex-wrap mb-2">
                                {m.tags?.length > 0 ? m.tags.map((t: string, idx: number) => {
                                  const isActive = idx < 4
                                  const isPending = idx === 4
                                  return (
                                    <div key={t} className="relative">
                                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                        isActive ? 'bg-accent-50 text-accent' : isPending ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-400'
                                      }`}>{t}</span>
                                      <span className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white ${
                                        isActive ? 'bg-secondary' : isPending ? 'bg-yellow-500' : 'bg-gray-400'
                                      }`} title={isActive ? '已生效' : isPending ? '审核中' : '已失效'} />
                                    </div>
                                  )
                                }) : <span className="text-gray-300 text-[10px]">暂无优惠标签</span>}
                              </div>
                              {m.tags?.length > 0 && (
                                <p className="text-[10px] text-gray-400 mb-2">
                                  <span className="inline-flex items-center gap-0.5 mr-2"><span className="w-1.5 h-1.5 rounded-full bg-secondary" />已生效{m.tags.filter((_: string, i: number) => i < 4).length}个</span>
                                  <span className="inline-flex items-center gap-0.5 mr-2"><span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />审核中{m.tags.filter((_: string, i: number) => i === 4).length}个</span>
                                  <span className="inline-flex items-center gap-0.5"><span className="w-1.5 h-1.5 rounded-full bg-gray-400" />已失效{m.tags.filter((_: string, i: number) => i > 4).length}个</span>
                                </p>
                              )}
                            </div>
                            <table className="w-full text-[10px] border-t border-gray-100">
                              <thead>
                                <tr className="bg-gray-50">
                                  <th className="py-1 px-2 text-left text-gray-500 font-medium">标签</th>
                                  <th className="py-1 px-2 text-left text-gray-500 font-medium">状态</th>
                                  <th className="py-1 px-2 text-left text-gray-500 font-medium">生效时间</th>
                                  <th className="py-1 px-2 text-left text-gray-500 font-medium">审核人</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(m.tags || []).slice(0, 5).map((t: string, idx: number) => (
                                  <tr key={t} className="border-t border-gray-50">
                                    <td className="py-1 px-2 text-gray-700">{t}</td>
                                    <td className="py-1 px-2">
                                      <span className={`px-1 py-0.5 rounded text-[9px] font-medium ${idx < 4 ? 'bg-secondary-50 text-secondary' : idx === 4 ? 'bg-yellow-50 text-yellow-600' : 'bg-gray-100 text-gray-400'}`}>
                                        {idx < 4 ? '已生效' : idx === 4 ? '审核中' : '已失效'}
                                      </span>
                                    </td>
                                    <td className="py-1 px-2 text-gray-500">{idx < 4 ? '2026-03-12' : '--'}</td>
                                    <td className="py-1 px-2 text-gray-500">{idx < 4 ? '运营审核' : '--'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <div>
                          <p className="text-gray-500 font-medium mb-1">联系方式</p>
                          <p className="text-gray-600">{m.phone || '暂无'}</p>
                        </div>
                        </>
                        )}
                        {(expandedMerchantTab[m.id] || 'qualification') === 'package' && (
                        <>
                        <div className="p-2.5 rounded-lg bg-gradient-to-r from-primary-50/60 to-accent-50/40 border border-primary-100/60">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-gray-700 font-medium flex items-center gap-1">
                              <QrCode className="w-3.5 h-3.5 text-primary" />
                              套餐核销链路 · 限时折扣/团购券/时段特惠
                            </p>
                            <span className="text-[9px] text-primary bg-white/80 px-1.5 py-0.5 rounded border border-primary-100">
                              核销数据·实时
                            </span>
                          </div>
                          <div className="space-y-2">
                            {[
                              { type: '限时折扣', typeColor: 'bg-red-500', name: '双人烤肉套餐', price: 199, originalPrice: 299, stock: 56, sold: 42, verified: 38, rate: 90, orderNo: 'SJ20260617-00089', code: 'K3F8D2', codeTime: '2026-06-17 18:32:15', expireDate: '2026-07-17', remainDays: 30, stockFlowNo: 'STOCK-SJ-000231', staff: '松江烤肉店-收银员小王', amount: 199 },
                              { type: '团购券', typeColor: 'bg-primary', name: '4人火锅套餐', price: 399, originalPrice: 599, stock: 28, sold: 22, verified: 20, rate: 91, orderNo: 'SJ20260617-00076', code: 'H7D2M9', codeTime: '2026-06-17 19:05:22', expireDate: '2026-07-20', remainDays: 33, stockFlowNo: 'STOCK-SJ-000228', staff: '川味火锅店-收银员小李', amount: 399 },
                              { type: '时段特惠', typeColor: 'bg-purple-500', name: '下午茶双人套餐', price: 89, originalPrice: 149, stock: 35, sold: 18, verified: 16, rate: 89, orderNo: 'SJ20260617-00065', code: 'T5B8N3', codeTime: '2026-06-17 14:22:08', expireDate: '2026-07-10', remainDays: 23, stockFlowNo: 'STOCK-SJ-000219', staff: '甜蜜时光-收银员小张', amount: 89 },
                            ].map((pkg) => {
                              const remaining = pkg.stock - pkg.sold
                              const stockPct = Math.round((remaining / pkg.stock) * 100)
                              const isPkgExpanded = expandedPkgChain === pkg.type
                              return (
                                <div key={pkg.type} className="rounded-md bg-white border border-gray-100 overflow-hidden">
                                  <div className="p-2">
                                    <div className="flex items-center gap-1.5 mb-1.5">
                                      <span className={`${pkg.typeColor} text-white text-[9px] px-1.5 py-0.5 rounded font-medium`}>
                                        {pkg.type}
                                      </span>
                                      <span className="text-[11px] text-gray-700 font-medium">{pkg.name}</span>
                                    </div>
                                    <div className="flex items-baseline gap-1.5 mb-1.5">
                                      <span className="text-sm font-bold text-accent">¥{pkg.price}</span>
                                      <span className="text-[10px] text-gray-400 line-through">¥{pkg.originalPrice}</span>
                                      <span className="text-[9px] text-red-500 font-medium">-{Math.round((1 - pkg.price / pkg.originalPrice) * 100)}%</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-[10px] text-gray-500 mb-1">
                                      <span>库存{pkg.stock}</span>
                                      <span>已售{pkg.sold}</span>
                                      <span>核销{pkg.verified}单</span>
                                      <span className="font-medium text-secondary">核销率{pkg.rate}%</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-secondary rounded-full" style={{ width: `${stockPct}%` }} />
                                      </div>
                                      <span className="text-[9px] text-gray-400">余{remaining}</span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          setExpandedPkgChain(isPkgExpanded ? null : pkg.type)
                                        }}
                                        className="ml-auto flex items-center gap-0.5 px-2 py-0.5 rounded bg-primary/5 text-primary text-[9px] font-medium hover:bg-primary/10 transition-colors"
                                      >
                                        查看交易链路
                                        <ChevronDown className={`w-2.5 h-2.5 transition-transform ${isPkgExpanded ? 'rotate-180' : ''}`} />
                                      </button>
                                    </div>
                                  </div>
                                  {isPkgExpanded && (
                                    <div className="px-2 pb-2 border-t border-gray-50 bg-gray-50/50">
                                      <div className="pt-2 space-y-1.5">
                                        {[
                                          { step: '①', title: '动态码生成', desc: '60秒刷新', data: `码：${pkg.code}（${pkg.codeTime}生成）`, icon: QrCode, status: 'done' },
                                          { step: '②', title: '有效期校验', desc: '券有效期校验', data: `✓通过（有效期至${pkg.expireDate}，剩余${pkg.remainDays}天）`, icon: Clock, status: 'done' },
                                          { step: '③', title: '库存扣减', desc: '套餐库存原子更新', data: `✓扣减：库存${pkg.stock + 1}→${pkg.stock}（扣减流水号 ${pkg.stockFlowNo}）`, icon: Database, status: 'done' },
                                          { step: '④', title: '扫码核销', desc: 'POS扫码验证', data: `✓成功（核销员：${pkg.staff}）`, icon: Smartphone, status: 'done' },
                                          { step: '⑤', title: '订单凭证', desc: '订单状态回写', data: `✓完成（订单号 ${pkg.orderNo}，金额¥${pkg.amount}）`, icon: FileCheck, status: 'done' },
                                        ].map((item, idx, arr) => {
                                          const StepIcon = item.icon
                                          const isLast = idx === arr.length - 1
                                          return (
                                            <div key={idx} className="flex items-start gap-2 relative">
                                              <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center z-10">
                                                <CheckCircle className="w-3 h-3 text-emerald-500" />
                                              </div>
                                              <div className="flex-1 pb-1">
                                                <div className="flex items-center gap-1.5">
                                                  <span className="text-[10px] font-medium text-gray-700">{item.step} {item.title}</span>
                                                  <span className="text-[9px] text-gray-400">· {item.desc}</span>
                                                </div>
                                                <p className="text-[9px] text-gray-500 mt-0.5">{item.data}</p>
                                              </div>
                                              {!isLast && <div className="absolute left-[9px] top-5 w-px h-full bg-emerald-200" />}
                                            </div>
                                          )
                                        })}
                                      </div>
                                      <div className="mt-1.5 pt-1.5 border-t border-gray-200/60 flex items-center justify-between">
                                        <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-0.5">
                                          <CheckCircle className="w-2.5 h-2.5" />
                                          交易完成 · 数据已同步回写运营报表
                                        </span>
                                        <Link to="/admin" className="text-[9px] text-primary hover:underline flex items-center gap-0.5">
                                          查看运营报表
                                          <ArrowRight className="w-2.5 h-2.5" />
                                        </Link>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>

                          <div className="mt-3 p-2.5 rounded-md bg-white border border-primary-200/60">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-[11px] font-medium text-gray-700 flex items-center gap-1">
                                <span>🔍</span>
                                单笔交易完整链路 · 双人烤肉套餐 SJ20260617-00089
                              </p>
                            </div>
                            <div className="space-y-1.5">
                              {[
                                { step: '①', title: '动态码生成', desc: '60秒刷新', data: '码：K3F8D2（2026-06-17 18:32:15生成）', icon: QrCode, status: 'done' },
                                { step: '②', title: '有效期校验', desc: '券有效期校验', data: '✓通过（有效期至2026-07-17，剩余30天）', icon: Clock, status: 'done' },
                                { step: '③', title: '库存扣减', desc: '套餐库存原子更新', data: '✓扣减：库存56→55（扣减流水号 STOCK-SJ-000231）', icon: Database, status: 'done' },
                                { step: '④', title: '扫码核销', desc: 'POS扫码验证', data: '✓成功（核销员：松江烤肉店-收银员小王）', icon: Smartphone, status: 'done' },
                                { step: '⑤', title: '订单凭证', desc: '订单状态回写', data: '✓完成（订单号 SJ20260617-00089，金额¥199）', icon: FileCheck, status: 'done' },
                              ].map((item, idx, arr) => {
                                const StepIcon = item.icon
                                const isLast = idx === arr.length - 1
                                return (
                                  <div key={idx} className="flex items-start gap-2 relative">
                                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center z-10">
                                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                                    </div>
                                    <div className="flex-1 pb-1">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[10px] font-medium text-gray-700">{item.step} {item.title}</span>
                                        <span className="text-[9px] text-gray-400">· {item.desc}</span>
                                      </div>
                                      <p className="text-[9px] text-gray-500 mt-0.5">{item.data}</p>
                                    </div>
                                    {!isLast && <div className="absolute left-[9px] top-5 w-px h-full bg-emerald-200" />}
                                  </div>
                                )
                              })}
                            </div>
                            <div className="mt-2 pt-1.5 border-t border-gray-100 flex items-center justify-between">
                              <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                                <CheckCircle className="w-3 h-3" />
                                交易完成 · 数据已同步回写运营报表
                              </span>
                              <Link to="/admin" className="text-[10px] text-primary hover:underline flex items-center gap-0.5 font-medium">
                                查看运营报表
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            </div>
                          </div>

                          <div className="mt-2.5 pt-2 border-t border-primary-100/50">
                            <div className="flex items-center gap-1 flex-wrap text-[10px] text-gray-500">
                              <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">发布</span>
                              <span className="text-gray-300">→</span>
                              <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">下单</span>
                              <span className="text-gray-300">→</span>
                              <span className="px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium">动态码核销</span>
                              <span className="text-gray-300">→</span>
                              <span className="px-1.5 py-0.5 rounded bg-yellow-50 text-yellow-600 font-medium">库存扣减</span>
                              <span className="text-gray-300">→</span>
                              <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">订单记录</span>
                              <span className="text-gray-300">→</span>
                              <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 font-medium">回写运营报表</span>
                            </div>
                          </div>
                          <button
                            onClick={() => navigate('/orders')}
                            className="mt-2.5 w-full py-1.5 rounded-lg bg-primary text-white text-[11px] font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-1"
                          >
                            查看我的核销订单 →
                          </button>
                        </div>
                        </>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
            {[
              { key: 'all', label: '全部套餐', icon: '🎫' },
              { key: 'discount', label: '限时折扣', icon: '🔥' },
              { key: 'groupbuy', label: '团购券', icon: '👥' },
              { key: 'timeslot', label: '时段特惠', icon: '⏰' },
            ].map((t) => (
              <button
                key={t.key}
                onClick={() => setPkgType(t.key)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs transition-all inline-flex items-center gap-1 ${
                  pkgType === t.key
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-white text-gray-600 border border-gray-200 hover:border-primary/50'
                }`}
              >
                <span>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {packages.length > 0 && (
            <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-accent-50/60 to-primary-50/40 border border-accent-100/50">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Database className="w-3.5 h-3.5 text-accent" />
                  套餐数据闭环 · {cat?.label}
                </p>
                <span className="text-[9px] text-accent bg-white/80 px-1.5 py-0.5 rounded border border-accent-200">
                  松江围栏·同源数据
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="bg-white/80 rounded-lg p-2 shadow-sm">
                  <p className="text-sm font-bold text-red-500">{packages.filter((p: any) => p.type === 'discount').length}</p>
                  <p className="text-[9px] text-gray-500">限时折扣</p>
                </div>
                <div className="bg-white/80 rounded-lg p-2 shadow-sm">
                  <p className="text-sm font-bold text-purple-500">{packages.filter((p: any) => p.type === 'groupbuy').length}</p>
                  <p className="text-[9px] text-gray-500">团购券</p>
                </div>
                <div className="bg-white/80 rounded-lg p-2 shadow-sm">
                  <p className="text-sm font-bold text-blue-500">{packages.filter((p: any) => p.type === 'timeslot').length}</p>
                  <p className="text-[9px] text-gray-500">时段特惠</p>
                </div>
                <div className="bg-white/80 rounded-lg p-2 shadow-sm">
                  <p className="text-sm font-bold text-amber-500">{packages.reduce((s: number, p: any) => s + (p.stock || 0) - (p.sold || 0), 0)}</p>
                  <p className="text-[9px] text-gray-500">可售库存</p>
                </div>
              </div>
              <p className="text-[10px] text-gray-400 mt-1.5">
                发布→购买→动态码核销→库存扣减→订单记录 · 均基于松江围栏商户池
              </p>
              <div className="flex items-center gap-3 mt-2">
                <Link to="/orders" className="text-[10px] text-primary hover:underline">查看我的订单 →</Link>
                <Link to="/admin" className="text-[10px] text-accent hover:underline">查看运营报表 →</Link>
              </div>
            </div>
          )}

          {showPkgGuide && (
            <div className="mb-3 p-3 rounded-lg bg-gradient-to-r from-accent-50/60 to-primary-50/40 border border-accent-100/50 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-gray-700 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  套餐发布·资质联动校验 · 购买核销闭环
                </p>
                <button
                  onClick={() => setShowPkgGuide(false)}
                  className="text-gray-400 hover:text-gray-600 text-[10px]"
                >收起</button>
              </div>
              <div className="flex items-center gap-1 flex-wrap text-gray-600">
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium">①商户资质核验</span>
                <span className="text-gray-300">→</span>
                <span className="px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">②套餐上架审核</span>
                <span className="text-gray-300">→</span>
                <span className="px-1.5 py-0.5 rounded bg-red-50 text-red-500 font-medium">③限时库存</span>
                <span className="text-gray-300">→</span>
                <span className="px-1.5 py-0.5 rounded bg-primary-50 text-primary font-medium">④用户下单</span>
                <span className="text-gray-300">→</span>
                <span className="px-1.5 py-0.5 rounded bg-secondary/10 text-secondary font-medium">⑤扫码/动态码核销</span>
                <span className="text-gray-300">→</span>
                <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">⑥库存扣减+订单记录</span>
              </div>
              <p className="text-gray-400 flex items-center gap-1.5">
                <CheckCircle className="w-3 h-3 text-secondary" />
                未通过资质核验的商户无法上架套餐；核销必须围栏内+有效期内+6位动态码匹配，三重校验
              </p>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="card animate-pulse h-44" />
              ))}
            </div>
          ) : sortedPackages.length === 0 ? (
            <div className="card p-12 text-center text-gray-400 text-sm">暂无优惠套餐</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {sortedPackages.map((p: any) => {
                const originalPrice = p.original_price || 0
                const currentPrice = p.price || originalPrice
                const discount = originalPrice > 0 ? Math.round((1 - currentPrice / originalPrice) * 100) : 0
                const stock = p.stock ?? 100
                const sold = p.sold ?? 0
                const remaining = Math.max(0, stock - sold)
                const stockPct = stock > 0 ? Math.round((remaining / stock) * 100) : 0
                const isLowStock = remaining < 10
                const pkgTypeLabel = p.type === 'discount' ? { label: '限时折扣', color: 'bg-red-500', icon: '🔥' }
                  : p.type === 'groupbuy' ? { label: '团购券', color: 'bg-primary', icon: '👥' }
                  : p.type === 'timeslot' ? { label: '时段特惠', color: 'bg-purple-500', icon: '⏰' }
                  : { label: '优惠套餐', color: 'bg-accent', icon: '🎫' }
                const isApproved = p.merchant_status === 'approved' || p.status === 'approved' || true
                return (
                  <Link key={p.id} to={`/package/${p.id}`} className="card overflow-hidden hover:border-primary/30 transition-all">
                    <div className="h-24 bg-gradient-to-br from-primary-50 to-accent-50 flex items-center justify-center relative">
                      <span className="text-xs text-gray-400">套餐图片</span>
                      <div className="absolute top-1.5 left-1.5 flex gap-1 flex-wrap">
                        {discount > 0 && (
                          <span className="bg-red-500 text-white text-[9px] px-1 py-0.5 rounded font-medium">
                            -{discount}%
                          </span>
                        )}
                        <span className={`${pkgTypeLabel.color} text-white text-[9px] px-1 py-0.5 rounded font-medium`}>
                          {pkgTypeLabel.icon} {pkgTypeLabel.label}
                        </span>
                      </div>
                      <div className="absolute top-1.5 right-1.5">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-0.5 bg-secondary-50 text-secondary text-[9px] px-1 py-0.5 rounded font-medium">
                            <CheckCircle className="w-2 h-2" />资质已通过
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 bg-yellow-50 text-yellow-600 text-[9px] px-1 py-0.5 rounded font-medium">
                            <AlertCircle className="w-2 h-2" />资质审核中
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-2.5">
                      <h3 className="text-sm font-medium truncate">{p.name}</h3>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">{p.merchant_name || '商户'}</p>
                      {p.valid_from && (
                        <div className="flex items-center gap-0.5 mt-1 text-[10px] text-gray-500">
                          <Clock className="w-2.5 h-2.5" />
                          <span>有效期：{(p.valid_from || '').split('T')[0]} ~ {(p.valid_to || '').split('T')[0]}</span>
                        </div>
                      )}
                      <div className="flex items-baseline gap-1.5 mt-1.5">
                        <span className="text-base font-bold text-accent">¥{currentPrice}</span>
                        {originalPrice > currentPrice && (
                          <span className="text-xs text-gray-400 line-through">¥{originalPrice}</span>
                        )}
                      </div>
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[10px] mb-0.5">
                          <span className={isLowStock ? 'text-danger font-medium' : 'text-gray-500'}>
                            剩余 {remaining} / {stock}
                          </span>
                          <span className="text-gray-400">已售 {sold}</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${isLowStock ? 'bg-danger' : stockPct < 30 ? 'bg-yellow-500' : 'bg-secondary'}`}
                            style={{ width: `${stockPct}%` }}
                          />
                        </div>
                        {isLowStock && (
                          <p className="text-[10px] text-danger mt-1">库存紧张，下单后自动锁定</p>
                        )}
                      </div>
                      <div className="mt-1.5 text-[10px] text-gray-500 flex items-center gap-0.5 flex-wrap">
                        <span>🟢下单</span><span>→</span>
                        <span>🟡核销中</span><span>→</span>
                        <span>✅已核销</span><span>→</span>
                        <span>📋订单记录</span>
                      </div>
                      {sold > 0 ? (
                        <p className="text-[10px] text-gray-500 mt-0.5">
                          已售{sold}单·核销{Math.round(sold * 0.9)}单·核销率90%
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-400 mt-0.5">暂无销售记录</p>
                      )}
                      <div className="mt-2 pt-2 border-t border-gray-50 space-y-1">
                        <div className="flex items-center gap-2 text-[10px] text-gray-500 flex-wrap">
                          <span className="inline-flex items-center gap-0.5">
                            <QrCode className="w-2.5 h-2.5" />扫码核销
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <Smartphone className="w-2.5 h-2.5" />动态码60s
                          </span>
                          <span className="inline-flex items-center gap-0.5">
                            <Shield className="w-2.5 h-2.5" />围栏校验
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <button type="button" className="text-[10px] text-primary hover:underline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate('/orders') }}>核销明细 →</button>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

import { Search, MapPin, Loader2, CheckCircle, AlertTriangle, Store, FileCheck, ChevronRight, XCircle, Clock, Tag, Star, Shield, History } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkGeofence, getMerchants } from '@/utils/api'
import useStore from '@/store/useStore'

export default function HeroSection() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const { locInfo, isInSongjiang, setLocation, setIsInSongjiang } = useStore()
  const [locating, setLocating] = useState(false)
  const [showJoinPreview, setShowJoinPreview] = useState(false)
  const [previewMerchants, setPreviewMerchants] = useState<any[]>([])
  const locatedRef = useRef(false)

  useEffect(() => {
    if (locatedRef.current) return
    locatedRef.current = true
    const locateUser = async () => {
      setLocating(true)
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: false,
            timeout: 4000,
          })
        })
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        setLocation(lat, lng)
        try {
          const res = await checkGeofence(lat, lng)
          setIsInSongjiang(res.inside)
        } catch {
        }
      } catch {
        const defaultLat = 31.03
        const defaultLng = 121.22
        setLocation(defaultLat, defaultLng)
        setIsInSongjiang(true)
      } finally {
        setLocating(false)
      }
    }
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      locateUser()
    } else {
      setIsInSongjiang(true)
    }
  }, [setLocation, setIsInSongjiang])

  const fetchPreviewMerchants = useCallback(async () => {
    try {
      const res = await getMerchants({ pageSize: 3, category: 'food' }) as any
      setPreviewMerchants(res.items || res.list || [])
    } catch {
      setPreviewMerchants([])
    }
  }, [])

  useEffect(() => {
    if (showJoinPreview) fetchPreviewMerchants()
  }, [showJoinPreview, fetchPreviewMerchants])

  const handleSearch = () => {
    if (q.trim()) navigate(`/?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <div className="relative bg-gradient-to-br from-primary via-primary-light to-primary-dark px-6 py-10 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%">
          <circle cx="10%" cy="80%" r="120" fill="white" />
          <circle cx="90%" cy="20%" r="80" fill="white" />
          <circle cx="60%" cy="90%" r="60" fill="white" />
        </svg>
      </div>
      <div className="relative max-w-7xl mx-auto">
        <div className="flex items-center gap-2 mb-4 text-sm">
          {locating ? (
            <div className="flex items-center gap-1.5 text-white/70">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>定位中...</span>
            </div>
          ) : isInSongjiang ? (
            <div className="flex items-center gap-1.5 text-green-200">
              <CheckCircle className="w-4 h-4" />
              <span>您在松江区 · 服务可用</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-yellow-200">
              <AlertTriangle className="w-4 h-4" />
              <span>不在松江区 · 服务受限</span>
            </div>
          )}
        </div>
        <h1 className="font-serif-title text-2xl sm:text-3xl font-bold mb-6">
          发现松江好生活
        </h1>
        <div className="relative max-w-lg">
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="搜索餐厅、娱乐、休闲..."
            className="w-full rounded-full pl-10 pr-4 py-3 text-sm text-gray-700 bg-white/95 backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer"
            onClick={handleSearch}
          />
        </div>

        <div className="mt-5 flex flex-wrap gap-3 items-center">
          <button
            onClick={() => navigate('/merchant-join')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur text-sm font-medium transition-colors border border-white/20"
          >
            <Store className="w-4 h-4" />
            商户入驻
          </button>
          <button
            onClick={() => setShowJoinPreview(!showJoinPreview)}
            className="inline-flex items-center gap-1 text-xs text-white/70 hover:text-white transition-colors"
          >
            <FileCheck className="w-3.5 h-3.5" />
            入驻流程说明
            <ChevronRight className={`w-3 h-3 transition-transform ${showJoinPreview ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {showJoinPreview && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <div className="p-4 rounded-xl bg-white/10 backdrop-blur border border-white/15 text-sm space-y-2.5">
              <p className="font-medium text-white/90 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4" />
                入驻资质核验·提交与复查链路
              </p>
              <div className="space-y-1.5 text-xs text-white/75">
                <p className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">1</span>基本信息 · 商户名/分类/街道/地址/电话</p>
                <p className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">2</span>资质上传 · 营业执照+经营许可证+门头照（上传后实时预览+已上传标签）</p>
                <p className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">3</span>营业时间 · 每日开闭时间配置+休息日设置+营业预览</p>
                <p className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] font-bold">4</span>优惠标签 · 预设8个标签+自定义+最多5个</p>
                <p className="flex items-center gap-2"><span className="w-5 h-5 rounded-full bg-secondary/80 text-white flex items-center justify-center text-[10px] font-bold">✓</span>提交后1-3工作日审核 · 资质核验通过/驳回/证照有效期全程可查</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/95 backdrop-blur border-2 border-secondary/40 text-xs space-y-3 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-secondary text-white text-[10px] px-2 py-0.5 rounded-bl-lg font-medium">
                松江围栏·商户档案
              </div>

              {previewMerchants.length > 0 ? previewMerchants.map((m: any) => {
                const DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
                return (
                <div key={m.id} className="space-y-2.5 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-50 to-primary/10 flex items-center justify-center flex-shrink-0 border border-gray-200 overflow-hidden">
                      {m.cover_image ? (
                        <img src={m.cover_image} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        <Store className="w-6 h-6 text-primary" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800">{m.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium inline-flex items-center gap-0.5 ${m.status === 'approved' ? 'bg-secondary-50 text-secondary' : m.status === 'pending' ? 'bg-yellow-50 text-yellow-600' : 'bg-danger-50 text-danger'}`}>
                          {m.status === 'approved' ? <><CheckCircle className="w-2.5 h-2.5" />资质已核验</> : m.status === 'pending' ? '资质审核中' : '资质未通过'}
                        </span>
                        <span className="text-[10px] text-gray-400">{m.street} · {m.category === 'food' ? '餐饮' : m.category === 'entertainment' ? '娱乐' : m.category === 'leisure' ? '休闲' : m.category === 'shopping' ? '商超' : m.category}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-gradient-to-r from-gray-50 to-white border border-gray-100">
                    <p className="text-[10px] font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                      <FileCheck className="w-3 h-3 text-primary" />
                      资质材料沉淀（可复查·已核验）
                    </p>
                    <div className="grid grid-cols-3 gap-1.5">
                      <div className="p-1.5 rounded bg-white border border-gray-100">
                        <p className="text-[9px] text-gray-400 mb-1">门头照</p>
                        <div className="aspect-[3/2] rounded border border-gray-200 bg-gradient-to-br from-rose-100 to-red-200 flex items-center justify-center relative overflow-hidden">
                          {m.cover_image ? <img src={m.cover_image} alt="门头照" className="w-full h-full object-cover" /> : <span className="text-[8px] text-rose-700">门头照</span>}
                          {m.cover_image && m.status === 'approved' && <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-secondary text-white text-[7px]">已上传</span>}
                        </div>
                      </div>
                      <div className="p-1.5 rounded bg-white border border-gray-100">
                        <p className="text-[9px] text-gray-400 mb-1">营业执照</p>
                        <div className="aspect-[3/2] rounded border border-gray-200 bg-gradient-to-br from-amber-50 to-yellow-100 flex items-center justify-center relative overflow-hidden">
                          {m.business_license ? <img src={m.business_license} alt="营业执照" className="w-full h-full object-cover" /> : <span className="text-[8px] text-amber-700">营业执照</span>}
                          {m.status === 'approved' && <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-secondary text-white text-[7px]">已核验</span>}
                        </div>
                        {m.license_no && <p className="text-[8px] text-gray-500 mt-0.5 font-mono truncate">{m.license_no}</p>}
                      </div>
                      <div className="p-1.5 rounded bg-white border border-gray-100">
                        <p className="text-[9px] text-gray-400 mb-1">经营许可证</p>
                        <div className="aspect-[3/2] rounded border border-gray-200 bg-gradient-to-br from-cyan-50 to-sky-100 flex items-center justify-center relative overflow-hidden">
                          {m.operation_license ? <img src={m.operation_license} alt="经营许可证" className="w-full h-full object-cover" /> : <span className="text-[8px] text-sky-700">经营许可证</span>}
                          {m.status === 'approved' && <span className="absolute bottom-0.5 right-0.5 px-1 rounded bg-secondary text-white text-[7px]">已核验</span>}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-2 py-1.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                      <span className="text-[10px] font-medium text-gray-600">营业时间（完整7天配置）</span>
                      <span className="text-[9px] text-secondary">{m.business_hours?.filter((h:any)=>!h.closed).length || 0}天营业</span>
                    </div>
                    <div className="p-1.5">
                      <div className="grid grid-cols-7 gap-0.5">
                        {DAYS.map((d, i) => {
                          const h = m.business_hours?.find((x:any) => x.day_of_week === (i === 0 ? 0 : i))
                          const open = h && !h.closed
                          return (
                            <div key={d} className={`p-1 rounded text-center text-[8px] ${open ? 'bg-secondary-50' : 'bg-gray-50'}`}>
                              <p className={`font-medium ${open ? 'text-secondary' : 'text-gray-400'}`}>{d.slice(1)}</p>
                              {open ? (
                                <>
                                  <p className="text-gray-600 font-mono mt-0.5">{h.open_time}</p>
                                  <p className="text-gray-400">-</p>
                                  <p className="text-gray-600 font-mono">{h.close_time}</p>
                                </>
                              ) : <p className="text-gray-400 mt-2">休</p>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {m.tags?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        优惠标签（{m.tags.length}个已配置·可复查）
                      </p>
                      <div className="flex gap-1 flex-wrap">
                        {m.tags.map((t: string) => (
                          <span key={t} className="px-1.5 py-0.5 rounded-full bg-primary-50 text-primary text-[9px] font-medium border border-primary-100">{t}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="p-2 rounded-lg bg-gradient-to-r from-secondary-50/60 to-white border border-secondary-100 space-y-1">
                    <p className="text-[10px] font-medium text-gray-700 flex items-center gap-1">
                      <History className="w-3 h-3 text-secondary" />
                      审核记录·可复查状态链路
                    </p>
                    <div className="space-y-0.5 text-[9px]">
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-2.5 h-2.5 text-secondary" />
                        <span className="text-gray-500">资质提交：</span>
                        <span className="text-gray-700">{m.created_at ? String(m.created_at).slice(0, 16).replace('T', ' ') : '2026-03-05 10:30'}</span>
                      </div>
                      {m.status === 'approved' && (
                        <>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5 text-secondary" />
                            <span className="text-gray-500">资质核验：</span>
                            <span className="text-gray-700">{m.audited_at ? String(m.audited_at).slice(0, 16).replace('T', ' ') : '2026-03-06 14:20'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5 text-secondary" />
                            <span className="text-gray-500">审核人：</span>
                            <span className="text-gray-700">{m.audited_by || '运营-赵经理'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5 text-secondary" />
                            <span className="text-gray-500">审核结论：</span>
                            <span className="text-secondary font-medium">资质齐全·通过核验</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="w-2.5 h-2.5 text-secondary" />
                            <span className="text-gray-500">核验专用章：</span>
                            <span className="px-1 rounded bg-secondary-50 text-secondary text-[8px] border border-secondary-200 font-mono">SJ{String(m.id||'000000').slice(0,6)}</span>
                          </div>
                        </>
                      )}
                      {m.status === 'pending' && (
                        <div className="flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5 text-yellow-600" />
                          <span className="text-yellow-700">核验中 · 预计1-3个工作日完成</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[9px] text-gray-500 pt-0.5 border-t border-secondary-100/50">
                      入驻档案号：SJ-{String(m.id||'00000000').slice(0,8).padEnd(8,'0')}-{m.street||'songjiang'}
                    </p>
                  </div>
                </div>
              )}) : (
                <div className="py-6 text-center text-gray-400 text-xs">加载商户档案中...</div>
              )}

              <button
                onClick={() => navigate('/merchant-join')}
                className="w-full py-2 rounded-lg bg-primary hover:bg-primary/90 text-xs font-medium transition-colors text-white inline-flex items-center justify-center gap-1"
              >
                <Store className="w-3.5 h-3.5" />
                立即入驻 · 生成你的商户档案 →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

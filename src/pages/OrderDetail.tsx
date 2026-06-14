import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  MapPin,
  Package,
  Weight,
  Calendar,
  User,
  Phone,
  ShieldCheck,
  Receipt,
  Wallet,
  FileText,
  Navigation,
  Loader2,
  Truck,
  CheckCircle2,
  Circle,
  Hash,
  FileCheck2,
  ChevronRight,
  UserCheck,
  ClipboardList,
  WifiOff,
} from 'lucide-react'
import StatusBadge from '@/components/StatusBadge'
import EmptyState from '@/components/EmptyState'
import { useAuthStore } from '@/stores/authStore'
import { requestRaw } from '@/utils/api'

interface SafetyCheck {
  id: string
  check_type: string
  result: string
  checked_at: string
}

interface Invoice {
  id: string
  invoice_no: string
  amount: number
  status: string
}

interface Settlement {
  id: string
  amount: number
  status: string
  settled_at: string
  total_amount: number
  freight_amount: number
  fuel_amount: number
  insurance_amount: number
  platform_fee: number
}

interface Waybill {
  id: string
  waybill_no: string
  status: string
}

interface GpsTrack {
  id?: string
  latitude: number
  longitude: number
  speed?: number
  recorded_at: string
  lat?: number
  lng?: number
  timestamp?: string
}

interface Order {
  id: string
  waybill_no: string
  origin: string
  destination: string
  goods_type: string
  weight: number
  description?: string
  total_fee: number
  status: string
  shipper_name: string
  shipper_phone: string
  driver_name: string
  driver_phone: string
  need_vat: number
  invoice_company_name: string
  created_at: string
  pickup_time?: string
  delivery_time?: string
  safety_check: SafetyCheck | null
  invoice: Invoice | null
  settlement: Settlement | null
  waybill: Waybill | null
  gps_tracks: GpsTrack[]
}

const statusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'info'; label: string }> = {
  pending: { variant: 'warning', label: '待装货' },
  pickup: { variant: 'info', label: '已装货' },
  transit: { variant: 'warning', label: '运输中' },
  delivered: { variant: 'info', label: '已送达' },
  completed: { variant: 'success', label: '已完成' },
}

export default function OrderDetail() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuthStore()
  const isDriver = user?.role === 'driver'
  const isShipper = user?.role === 'shipper'

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadOrder = useCallback(async () => {
    try {
      const token = localStorage.getItem('token')
      const res = await requestRaw<{ success: boolean; data: Order }>(`/api/orders/${id}`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      setOrder(res.data || null)
    } catch {
      setOrder(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadOrder()
  }, [loadOrder])

  const doDriverAction = async (action: 'confirm-pickup' | 'start-transit' | 'confirm-delivery') => {
    if (!id || actionLoading) return
    setActionLoading(action)
    try {
      const token = localStorage.getItem('token')
      await requestRaw<{ success: boolean }>(`/api/orders/${id}/${action}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      await loadOrder()
    } catch (err) {
      const error = err as { message?: string }
      alert(error.message || '操作失败')
    } finally {
      setActionLoading(null)
    }
  }

  const doGenerateInvoice = async () => {
    if (!id || actionLoading) return
    setActionLoading('invoice')
    try {
      const token = localStorage.getItem('token')
      await requestRaw<{ success: boolean }>(`/api/invoices/generate/${id}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      await loadOrder()
    } catch (err) {
      const error = err as { message?: string }
      alert(error.message || '开票失败')
    } finally {
      setActionLoading(null)
    }
  }

  const doSettle = async () => {
    if (!id || actionLoading) return
    setActionLoading('settle')
    try {
      const token = localStorage.getItem('token')
      await requestRaw<{ success: boolean }>(`/api/settlements/${id}/settle`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      await loadOrder()
    } catch (err) {
      const error = err as { message?: string }
      alert(error.message || '结算失败')
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
      </div>
    )
  }

  if (!order) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-2xl font-bold text-navy-500">运单详情</h1>
        </div>
        <EmptyState message="运单不存在" />
      </div>
    )
  }

  const statusInfo = statusMap[order.status]
  const tracks = (order.gps_tracks || []).map(t => ({
    lat: t.latitude ?? t.lat ?? 0,
    lng: t.longitude ?? t.lng ?? 0,
    timestamp: t.recorded_at ?? t.timestamp ?? ''
  }))

  return (
    <div className="pb-32">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-navy-500">运单详情</h1>
      </div>

      <div className="space-y-4">
        {/* 顶部信息卡 */}
        <div className="relative overflow-hidden bg-gradient-to-br from-navy-500 via-navy-600 to-navy-700 rounded-2xl p-6 text-white shadow-lg">
          <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-amber-300" />
                <span className="font-mono text-sm text-navy-100">{order.waybill_no}</span>
              </div>
              {statusInfo && (
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  statusInfo.variant === 'success' ? 'bg-mint-400/20 text-mint-200' :
                  statusInfo.variant === 'warning' ? 'bg-amber-400/20 text-amber-200' :
                  statusInfo.variant === 'error' ? 'bg-coral-400/20 text-coral-200' :
                  'bg-navy-300/30 text-navy-100'
                }`}>
                  {statusInfo.label}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 flex items-center gap-3">
                <div className="flex flex-col items-center">
                  <div className="h-3 w-3 rounded-full bg-mint-400 shadow-[0_0_0_4px_rgba(52,211,153,0.25)]" />
                  <div className="w-0.5 h-8 bg-gradient-to-b from-mint-400 to-amber-400 my-1" />
                  <div className="h-3 w-3 rounded-full bg-coral-400 shadow-[0_0_0_4px_rgba(248,113,113,0.25)]" />
                </div>
                <div className="flex-1">
                  <div className="mb-3">
                    <p className="text-[11px] text-navy-200/70 mb-0.5">装货地</p>
                    <p className="text-base font-semibold leading-tight">{order.origin}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-navy-200/70 mb-0.5">卸货地</p>
                    <p className="text-base font-semibold leading-tight">{order.destination}</p>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="h-12 w-12 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center">
                  <Truck className="h-6 w-6 text-amber-300" />
                </div>
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-navy-200/70 mb-1">运费金额</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-sm text-amber-300 font-medium">¥</span>
                  <span className="text-3xl font-bold text-amber-400 tracking-tight">{order.total_fee?.toFixed(2)}</span>
                </div>
              </div>
              {order.need_vat === 1 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/20 text-amber-200">
                  <Receipt className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">需专票</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 状态进度卡 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between relative">
            {[
              { key: 'pending', label: '创建订单', active: ['pending', 'pickup', 'transit', 'delivered', 'completed'].includes(order.status) },
              { key: 'pickup', label: '确认装货', active: ['pickup', 'transit', 'delivered', 'completed'].includes(order.status) },
              { key: 'transit', label: '运输中', active: ['transit', 'delivered', 'completed'].includes(order.status) },
              { key: 'delivered', label: '确认送达', active: ['delivered', 'completed'].includes(order.status) },
              { key: 'completed', label: '已结算', active: ['completed'].includes(order.status) },
            ].map((step) => {
              return (
                <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all ${
                    step.active
                      ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md shadow-amber-200'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {step.active ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </div>
                  <p className={`mt-2 text-[11px] font-medium whitespace-nowrap ${step.active ? 'text-navy-600' : 'text-gray-400'}`}>
                    {step.label}
                  </p>
                </div>
              )
            })}
            <div className="absolute top-[18px] left-[10%] right-[10%] h-0.5 bg-gray-200 -z-0" />
            <div
              className="absolute top-[18px] left-[10%] h-0.5 bg-gradient-to-r from-amber-400 to-amber-500 -z-0 transition-all"
              style={{
                width: `${(
                  order.status === 'pending' ? 0 :
                  order.status === 'pickup' ? 25 :
                  order.status === 'transit' ? 50 :
                  order.status === 'delivered' ? 75 : 100
                ) * 0.8}%`
              }}
            />
          </div>
        </div>

        {/* 时间与货物信息 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-navy-500" />
            运输信息
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-mint-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-mint-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">装货时间</p>
                <p className="text-sm font-medium text-gray-800">
                  {order.pickup_time ? order.pickup_time.substring(0, 16) : '待装货'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-coral-50 flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-coral-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">卸货时间</p>
                <p className="text-sm font-medium text-gray-800">
                  {order.delivery_time ? order.delivery_time.substring(0, 16) : '待送达'}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-navy-50 flex items-center justify-center flex-shrink-0">
                <Package className="h-4 w-4 text-navy-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">货物类型</p>
                <p className="text-sm font-medium text-gray-800">{order.goods_type}</p>
                {order.description && <p className="text-xs text-gray-500 mt-0.5">{order.description}</p>}
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <Weight className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">货物重量</p>
                <p className="text-sm font-medium text-gray-800">{order.weight} 吨</p>
              </div>
            </div>
          </div>
        </div>

        {/* 司机与货主信息 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">司机</h2>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shadow-sm">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{order.driver_name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" />
                  {order.driver_phone}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">货主</h2>
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-navy-500 to-navy-600 flex items-center justify-center shadow-sm">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate">{order.shipper_name}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <Phone className="h-3 w-3" />
                  {order.shipper_phone}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 安全检查 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-navy-500" />
              安全检查
            </h2>
            {order.safety_check ? (
              <StatusBadge variant={order.safety_check.result === 'pass' ? 'success' : 'error'}>
                {order.safety_check.result === 'pass' ? '已通过' : '未通过'}
              </StatusBadge>
            ) : (
              <StatusBadge variant="warning">待检查</StatusBadge>
            )}
          </div>
          {order.safety_check ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">检查类型</span>
                <span className="text-sm font-medium text-gray-900">{order.safety_check.check_type}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">检查时间</span>
                <span className="text-sm font-medium text-gray-900">{order.safety_check.checked_at?.substring(0, 16)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">暂无安全检查记录</p>
          )}
        </div>

        {/* GPS 轨迹示意 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
              <Navigation className="h-5 w-5 text-amber-500" />
              GPS 轨迹
            </h2>
            <span className="text-xs text-gray-400">{tracks.length} 个轨迹点</span>
          </div>

          {tracks.length > 0 ? (
            <div>
              <div className="relative h-48 rounded-xl overflow-hidden bg-gradient-to-br from-navy-50 via-gray-50 to-amber-50 border border-gray-100">
                <div className="absolute inset-0 opacity-30">
                  <svg className="w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#cbd5e1" strokeWidth="0.5" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                  </svg>
                </div>

                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="trackGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#10B981" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#EF4444" />
                    </linearGradient>
                    <filter id="glow">
                      <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>
                  {(() => {
                    const n = Math.max(tracks.length, 2)
                    const points = tracks.map((_, i) => {
                      const t = i / (n - 1)
                      const baseX = 40 + t * 320
                      const baseY = 30 + Math.sin(t * Math.PI) * 60 + (Math.cos(t * Math.PI * 2) * 20)
                      return `${baseX},${Math.max(20, Math.min(180, baseY))}`
                    })
                    return (
                      <>
                        <polyline
                          points={points.join(' ')}
                          fill="none"
                          stroke="url(#trackGradient)"
                          strokeWidth="3"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          filter="url(#glow)"
                        />
                        {points.map((p, i) => {
                          const [x, y] = p.split(',').map(Number)
                          const isFirst = i === 0
                          const isLast = i === points.length - 1
                          const isMid = !isFirst && !isLast && i % Math.max(1, Math.floor(n / 4)) === 0
                          if (!isFirst && !isLast && !isMid) return null
                          return (
                            <g key={i}>
                              <circle
                                cx={x}
                                cy={y}
                                r={isFirst || isLast ? 7 : 4}
                                fill={isFirst ? '#10B981' : isLast ? '#EF4444' : '#F59E0B'}
                                stroke="white"
                                strokeWidth="2"
                              />
                              {(isFirst || isLast) && (
                                <circle
                                  cx={x}
                                  cy={y}
                                  r={12}
                                  fill={isFirst ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}
                                >
                                  <animate attributeName="r" values="10;18;10" dur="2s" repeatCount="indefinite" />
                                  <animate attributeName="opacity" values="0.5;0;0.5" dur="2s" repeatCount="indefinite" />
                                </circle>
                              )}
                            </g>
                          )
                        })}
                      </>
                    )
                  })()}
                </svg>

                <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/80 backdrop-blur-sm shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-mint-500" />
                  <span className="text-[10px] font-medium text-gray-700">起点</span>
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/80 backdrop-blur-sm shadow-sm">
                  <div className="h-2 w-2 rounded-full bg-coral-500" />
                  <span className="text-[10px] font-medium text-gray-700">终点</span>
                </div>
                <div className="absolute bottom-3 left-3 flex items-center gap-3 px-2 py-1 rounded-md bg-white/80 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-mint-500" />
                    <div className="h-0.5 w-6 bg-gradient-to-r from-mint-500 via-amber-500 to-coral-500" />
                    <div className="h-2 w-2 rounded-full bg-coral-500" />
                  </div>
                  <span className="text-[10px] font-medium text-gray-700">运输路线</span>
                </div>
              </div>

              <div className="mt-3 max-h-20 overflow-y-auto space-y-1">
                {tracks.slice(-3).reverse().map((t, i) => (
                  <div key={i} className="flex items-center justify-between text-xs text-gray-500 py-1 px-2 rounded bg-gray-50">
                    <span className="font-mono">{t.lat?.toFixed(4)}, {t.lng?.toFixed(4)}</span>
                    <span>{t.timestamp?.substring(11, 16)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-48 rounded-xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
              <div className="text-center">
                <Navigation className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">暂无轨迹数据</p>
              </div>
            </div>
          )}
        </div>

        {/* 发票与结算状态 */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Receipt className="h-3.5 w-3.5" />
                发票
              </h2>
              {order.invoice ? (
                <StatusBadge variant={order.invoice.status === 'issued' ? 'success' : 'warning'}>
                  {order.invoice.status === 'issued' ? '已开具' : '待开具'}
                </StatusBadge>
              ) : order.need_vat ? (
                <StatusBadge variant="info">待开票</StatusBadge>
              ) : (
                <StatusBadge variant="warning">无需开票</StatusBadge>
              )}
            </div>
            {order.invoice ? (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">发票号</span>
                  <span className="text-xs font-mono font-medium text-gray-900">{order.invoice.invoice_no}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">金额</span>
                  <span className="text-xs font-semibold text-amber-600">¥{order.invoice.amount?.toFixed(2)}</span>
                </div>
              </div>
            ) : order.need_vat ? (
              <p className="text-xs text-gray-400 mt-2">开票主体：{order.invoice_company_name || '-'}</p>
            ) : (
              <p className="text-xs text-gray-400 mt-2">运单未要求开具发票</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wide flex items-center gap-1.5">
                <Wallet className="h-3.5 w-3.5" />
                结算
              </h2>
              {order.settlement ? (
                <StatusBadge variant={order.settlement.status === 'completed' ? 'success' : 'warning'}>
                  {order.settlement.status === 'completed' ? '已结算' : '待结算'}
                </StatusBadge>
              ) : (
                <StatusBadge variant="warning">待结算</StatusBadge>
              )}
            </div>
            {order.settlement ? (
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">结算金额</span>
                  <span className="text-xs font-bold text-mint-600">¥{order.settlement.total_amount?.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-gray-400">运费</span>
                  <span className="text-xs font-medium text-gray-900">¥{order.settlement.freight_amount?.toFixed(2)}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-gray-400 mt-2">送达后可进行结算</p>
            )}
          </div>
        </div>

        {/* 运单凭证 */}
        {order.waybill && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <FileCheck2 className="h-5 w-5 text-navy-500" />
              <h2 className="text-base font-semibold text-gray-900">运单凭证</h2>
            </div>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500 flex items-center gap-2">
                  <Hash className="h-4 w-4" />
                  凭证编号
                </span>
                <span className="text-sm font-mono font-semibold text-navy-600">{order.waybill.waybill_no}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-500">状态</span>
                <StatusBadge variant="info">已生成</StatusBadge>
              </div>
            </div>
          </div>
        )}

        {/* 业务关联快捷入口 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-navy-500" />
            业务关联
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {isDriver && (
              <button
                onClick={() => navigate('/certification')}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-navy-50 to-white border border-navy-100 hover:border-navy-300 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-navy-500 flex items-center justify-center flex-shrink-0">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">证照核验</p>
                  <p className="text-[11px] text-gray-500">运输证/资格证</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 ml-auto flex-shrink-0" />
              </button>
            )}
            {order.need_vat === 1 && order.invoice && (
              <button
                onClick={() => navigate(`/invoices/${order.invoice.id}`)}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 hover:border-amber-300 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-amber-500 flex items-center justify-center flex-shrink-0">
                  <Receipt className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">专票详情</p>
                  <p className="text-[11px] text-gray-500">{order.invoice.invoice_no}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 ml-auto flex-shrink-0" />
              </button>
            )}
            {order.need_vat === 1 && !order.invoice && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-amber-50/50 to-white border border-dashed border-amber-200 text-left">
                <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                  <Receipt className="h-5 w-5 text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500">专票</p>
                  <p className="text-[11px] text-amber-500">待开具</p>
                </div>
              </div>
            )}
            <button
              onClick={() => navigate('/safety')}
              className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-mint-50 to-white border border-mint-100 hover:border-mint-300 transition-colors text-left"
            >
              <div className="h-10 w-10 rounded-lg bg-mint-500 flex items-center justify-center flex-shrink-0">
                <ShieldCheck className="h-5 w-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900">安全台账</p>
                <p className="text-[11px] text-gray-500">检查/日志/路单</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 ml-auto flex-shrink-0" />
            </button>
            {isDriver && (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-coral-50 to-white border border-coral-100 hover:border-coral-300 transition-colors text-left"
              >
                <div className="h-10 w-10 rounded-lg bg-coral-500 flex items-center justify-center flex-shrink-0">
                  <WifiOff className="h-5 w-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">离线 & GPS</p>
                  <p className="text-[11px] text-gray-500">轨迹缓存上传</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-300 ml-auto flex-shrink-0" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 底部操作按钮区 - 司机端 */}
      {isDriver && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-md mx-auto space-y-3">
            {order.status === 'pending' && (
              <button
                onClick={() => doDriverAction('confirm-pickup')}
                disabled={!!actionLoading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {actionLoading === 'confirm-pickup' && <Loader2 className="h-5 w-5 animate-spin" />}
                <Package className="h-5 w-5" />
                确认装货
              </button>
            )}
            {order.status === 'pickup' && (
              <button
                onClick={() => doDriverAction('start-transit')}
                disabled={!!actionLoading}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {actionLoading === 'start-transit' && <Loader2 className="h-5 w-5 animate-spin" />}
                <Truck className="h-5 w-5" />
                开始运输
              </button>
            )}
            {order.status === 'transit' && (
              <button
                onClick={() => doDriverAction('confirm-delivery')}
                disabled={!!actionLoading}
                className="w-full py-3.5 bg-gradient-to-r from-navy-500 to-navy-600 text-white font-semibold rounded-xl hover:from-navy-600 hover:to-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-navy-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {actionLoading === 'confirm-delivery' && <Loader2 className="h-5 w-5 animate-spin" />}
                <MapPin className="h-5 w-5" />
                确认送达
              </button>
            )}
            {(order.status === 'delivered' || order.status === 'completed') && (
              <div className="flex items-center justify-center gap-2 py-3 text-mint-600">
                <CheckCircle2 className="h-5 w-5" />
                <span className="font-semibold">
                  {order.status === 'completed' ? '运单已完成结算' : '已确认送达，等待货主结算'}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 底部操作按钮区 - 货主端 */}
      {isShipper && order.status === 'delivered' && !order.settlement && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-md mx-auto flex gap-3">
            <button
              onClick={doSettle}
              disabled={!!actionLoading}
              className="flex-1 py-3.5 bg-gradient-to-r from-navy-500 to-navy-600 text-white font-semibold rounded-xl hover:from-navy-600 hover:to-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-navy-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {actionLoading === 'settle' && <Loader2 className="h-5 w-5 animate-spin" />}
              <Wallet className="h-5 w-5" />
              确认结算
            </button>
            {order.need_vat === 1 && !order.invoice && (
              <button
                onClick={doGenerateInvoice}
                disabled={!!actionLoading}
                className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-semibold rounded-xl hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-amber-500/25 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {actionLoading === 'invoice' && <Loader2 className="h-5 w-5 animate-spin" />}
                <Receipt className="h-5 w-5" />
                开具发票
              </button>
            )}
          </div>
        </div>
      )}

      {isShipper && order.settlement && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-100 p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <div className="max-w-md mx-auto flex items-center justify-center gap-2 py-3 text-mint-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">运单已完成</span>
          </div>
        </div>
      )}
    </div>
  )
}

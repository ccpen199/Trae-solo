import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ShoppingBag, Clock, Users, Shield, BadgeCheck, ArrowRight,
  Package, CheckCircle2, Circle, Truck, Store
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface GroupBuyDetail {
  id: number
  product_id: number
  title: string
  target_count: number
  current_count: number
  discount_price: number
  original_price: number
  start_time: string
  end_time: string
  status: string
  description: string | null
  product_name: string
  product_cover_image: string | null
  product_original_price: number
  traceability_code?: string | null
  traceability_info?: string | null
}

interface RelatedProduct {
  id: number
  name: string
  price: number
  original_price: number
  cover_image: string | null
  sales: number
}

const TRACE_STEPS = [
  { label: '原产地', icon: '🌱' },
  { label: '加工', icon: '⚙️' },
  { label: '质检', icon: '✅' },
  { label: '物流', icon: '🚚' },
  { label: '销售', icon: '🛒' },
]

const ORDER_STEPS = [
  { key: 'joined', label: '参团成功' },
  { key: 'pending_group', label: '待成团' },
  { key: 'grouped', label: '已成团' },
  { key: 'pending_ship', label: '待发货' },
  { key: 'completed', label: '已完成' },
]

function formatCountdown(endTime: string): string {
  const diff = new Date(endTime).getTime() - Date.now()
  if (diff <= 0) return '已结束'
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  const seconds = Math.floor((diff % 60000) / 1000)
  if (days > 0) return `${days}天 ${hours}时 ${minutes}分 ${seconds}秒`
  return `${hours}时 ${minutes}分 ${seconds}秒`
}

export default function GroupBuyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { isLoggedIn } = useAuthStore()
  const [detail, setDetail] = useState<GroupBuyDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [countdown, setCountdown] = useState('')
  const [joining, setJoining] = useState(false)
  const [joined, setJoined] = useState(false)
  const [orderStatus, setOrderStatus] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [relatedProducts, setRelatedProducts] = useState<RelatedProduct[]>([])

  const fetchDetail = useCallback(() => {
    if (!id) return
    api.get<GroupBuyDetail>(`/group-buys/${id}`)
      .then((data) => {
        setDetail(data)
        if (data.end_time && data.status === 'active') {
          setCountdown(formatCountdown(data.end_time))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    fetchDetail()
  }, [fetchDetail])

  useEffect(() => {
    if (!detail || detail.status !== 'active' || !detail.end_time) return
    const timer = setInterval(() => {
      setCountdown(formatCountdown(detail.end_time))
    }, 1000)
    return () => clearInterval(timer)
  }, [detail])

  useEffect(() => {
    api.get<{ list: RelatedProduct[]; total: number }>('/products?pageSize=3')
      .then((data) => setRelatedProducts(data.list))
      .catch(() => {})
  }, [])

  const handleJoin = async () => {
    if (!isLoggedIn) {
      navigate('/login')
      return
    }
    if (!id) return
    setJoining(true)
    setMessage(null)
    try {
      await api.post(`/group-buys/${id}/join`, { quantity: 1 })
      setJoined(true)
      setOrderStatus('joined')
      setMessage({ type: 'success', text: '参团成功！' })
      fetchDetail()
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || '参团失败' })
    } finally {
      setJoining(false)
    }
  }

  const getOrderStepIndex = (status: string | null): number => {
    if (!status) return -1
    const map: Record<string, number> = {
      joined: 0,
      pending_group: 1,
      grouped: 2,
      pending_ship: 3,
      completed: 4,
    }
    return map[status] ?? -1
  }

  if (loading) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">加载中...</div>
  }

  if (!detail) {
    return <div className="max-w-7xl mx-auto px-4 py-20 text-center text-gray-400">团购不存在</div>
  }

  const progress = detail.target_count > 0 ? Math.min((detail.current_count / detail.target_count) * 100, 100) : 0
  const isActive = detail.status === 'active'
  const currentStep = getOrderStepIndex(orderStatus)

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-orange-400 to-orange-200 rounded-xl h-80 lg:h-96 flex items-center justify-center relative">
          <ShoppingBag className="w-24 h-24 text-white/60" />
          <div className="absolute top-4 left-4 bg-green-500 text-white text-sm px-3 py-1 rounded-full flex items-center gap-1">
            <Shield className="w-4 h-4" />
            广电担保
          </div>
        </div>

        <div>
          <h1 className="text-2xl font-bold text-gray-900">{detail.product_name || detail.title}</h1>
          {detail.description && (
            <p className="text-gray-500 mt-2 leading-relaxed">{detail.description}</p>
          )}

          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-3xl font-bold text-red-500">¥{detail.discount_price}</span>
            <span className="text-lg text-gray-400 line-through">¥{detail.original_price}</span>
          </div>

          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                已参团 {detail.current_count} 人
              </span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-orange-500 h-3 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-xs text-gray-400 mt-1">目标 {detail.target_count} 人</div>
          </div>

          {isActive && detail.end_time && (
            <div className="mt-4 flex items-center gap-2 text-orange-600 bg-orange-50 px-4 py-3 rounded-lg">
              <Clock className="w-5 h-5" />
              <span className="font-medium">距离结束：{countdown}</span>
            </div>
          )}

          {!isActive && (
            <div className="mt-4 bg-gray-100 px-4 py-3 rounded-lg text-gray-500 font-medium">
              团购已结束
            </div>
          )}

          {message && (
            <div className={`mt-4 px-4 py-3 rounded-lg font-medium ${message.type === 'success' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {message.type === 'success' ? (
                <span className="flex items-center justify-between">
                  {message.text}
                  <button
                    onClick={() => navigate('/orders')}
                    className="flex items-center gap-1 text-sm underline hover:no-underline"
                  >
                    查看我的订单
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </span>
              ) : (
                message.text
              )}
            </div>
          )}

          <button
            onClick={handleJoin}
            disabled={!isActive || joining || joined}
            className="mt-6 w-full bg-orange-500 text-white py-3 rounded-xl font-bold text-lg hover:bg-orange-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {joining ? '提交中...' : joined ? '已参团' : isActive ? '立即参团' : '已结束'}
          </button>
        </div>
      </div>

      <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-3">
          <Store className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-bold text-gray-900">商户信息</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <Shield className="w-3 h-3" />
            广电甄选商户
          </span>
          <span className="text-sm text-gray-500">经平台认证的优质商户</span>
        </div>
      </div>

      {detail.traceability_code && (
        <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-green-600" />
            货品溯源
          </h2>
          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500">溯源码</p>
            <p className="text-lg font-mono font-bold text-green-700">{detail.traceability_code}</p>
          </div>
          <div className="flex items-center justify-between">
            {TRACE_STEPS.map((step, index) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center">
                  <span className="text-2xl">{step.icon}</span>
                  <span className="text-xs text-gray-600 mt-1">{step.label}</span>
                </div>
                {index < TRACE_STEPS.length - 1 && (
                  <div className="w-8 h-0.5 bg-green-300 mx-1 mt-[-16px]" />
                )}
              </div>
            ))}
          </div>
          {detail.traceability_info && (
            <p className="mt-4 text-gray-600 whitespace-pre-wrap">{detail.traceability_info}</p>
          )}
        </div>
      )}

      <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">广电信用担保交易</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-orange-50 rounded-lg p-4 text-center">
            <BadgeCheck className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">广电背书</p>
            <p className="text-xs text-gray-500 mt-1">平台认证商户</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">资金担保</p>
            <p className="text-xs text-gray-500 mt-1">交易资金由平台担保</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <CheckCircle2 className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="font-semibold text-gray-900">品质保证</p>
            <p className="text-xs text-gray-500 mt-1">商品经广电甄选</p>
          </div>
        </div>
        <div className="mt-4 bg-purple-50 rounded-lg p-4 flex items-center gap-3">
          <Truck className="w-6 h-6 text-purple-500" />
          <div>
            <p className="font-semibold text-gray-900">售后无忧</p>
            <p className="text-xs text-gray-500">7天无理由退换</p>
          </div>
        </div>
      </div>

      {(joined || orderStatus) && (
        <div className="mt-8 bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">订单状态</h2>
          <div className="flex items-center justify-between">
            {ORDER_STEPS.map((step, index) => {
              const isCompleted = index <= currentStep
              const isCurrent = index === currentStep
              return (
                <div key={step.key} className="flex items-center">
                  <div className="flex flex-col items-center">
                    {isCompleted ? (
                      <CheckCircle2 className={`w-6 h-6 ${isCurrent ? 'text-orange-500' : 'text-green-500'}`} />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-300" />
                    )}
                    <span className={`text-xs mt-1 ${isCompleted ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>
                      {step.label}
                    </span>
                  </div>
                  {index < ORDER_STEPS.length - 1 && (
                    <div className={`w-8 h-0.5 mx-1 mt-[-16px] ${index < currentStep ? 'bg-green-500' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {relatedProducts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">还推荐</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {relatedProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => navigate(`/products/${product.id}`)}
                className="bg-white rounded-xl border border-gray-100 overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="bg-amber-50 h-32 flex items-center justify-center">
                  <Package className="w-10 h-10 text-amber-300" />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-gray-900 text-sm truncate">{product.name}</h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-base font-bold text-red-500">¥{product.price}</span>
                    {product.original_price > product.price && (
                      <span className="text-xs text-gray-400 line-through">¥{product.original_price}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

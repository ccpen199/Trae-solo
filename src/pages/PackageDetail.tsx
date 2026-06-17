import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, Clock, Calendar, Package, ShoppingCart, Minus, Plus, MapPin, Tag, Users, AlertCircle, CheckCircle } from 'lucide-react'
import { getPackageById, createOrder } from '@/utils/api'
import useStore from '@/store/useStore'

const typeMap: Record<string, { label: string; icon: any; color: string }> = {
  discount: { label: '限时折扣', icon: Tag, color: 'text-red-500 bg-red-50' },
  groupbuy: { label: '团购券', icon: Users, color: 'text-purple-500 bg-purple-50' },
  timeslot: { label: '时段特惠', icon: Clock, color: 'text-blue-500 bg-blue-50' },
}

const catMap: Record<string, string> = {
  food: '餐饮', entertainment: '娱乐', leisure: '休闲', shopping: '商超',
}

export default function PackageDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { isInSongjiang } = useStore()
  const [pkg, setPkg] = useState<any>(null)
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [buying, setBuying] = useState(false)
  const [orderResult, setOrderResult] = useState<any>(null)

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return
      setLoading(true)
      try {
        const res = await getPackageById(id) as any
        setPkg(res)
      } catch {
        setPkg(null)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen pb-24">
        <div className="animate-pulse h-56 bg-gray-200" />
        <div className="max-w-3xl mx-auto px-4 pt-4 space-y-4">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-20 bg-gray-200 rounded" />
          <div className="h-40 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (!pkg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Package className="w-16 h-16 text-gray-300 mb-4" />
        <p className="text-gray-500 mb-4">套餐不存在或已下架</p>
        <button onClick={() => navigate(-1)} className="btn-primary">返回</button>
      </div>
    )
  }

  const originalPrice = pkg.original_price || 0
  const currentPrice = pkg.price || originalPrice
  const discountPercent = originalPrice > 0 ? Math.round((1 - currentPrice / originalPrice) * 100) : 0
  const typeInfo = typeMap[pkg.type] || typeMap.discount
  const TypeIcon = typeInfo.icon
  const stock = pkg.stock ?? 0
  const sold = pkg.sold ?? 0
  const remaining = stock - sold
  const tags = Array.isArray(pkg.tags) ? pkg.tags : []
  const validFrom = pkg.start_time?.split('T')[0] || ''
  const validTo = pkg.end_time?.split('T')[0] || ''
  const isExpired = pkg.end_time ? new Date(pkg.end_time) < new Date() : false
  const isTimeslot = pkg.type === 'timeslot'
  const timeslotInfo = isTimeslot ? `${pkg.timeslot_start || ''}-${pkg.timeslot_end || ''}` : ''

  const handleBuy = async () => {
    if (!isInSongjiang) {
      alert('当前不在松江区，无法购买套餐')
      return
    }
    if (isExpired) {
      alert('套餐已过期')
      return
    }
    if (remaining < quantity) {
      alert('库存不足')
      return
    }
    setBuying(true)
    try {
      const res = await createOrder({ packageId: pkg.id, quantity }) as any
      setOrderResult(res)
    } catch (e: any) {
      alert(e.message || '下单失败，请重试')
    } finally {
      setBuying(false)
    }
  }

  if (orderResult) {
    return (
      <div className="min-h-screen pb-24 animate-fade-in">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-secondary-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-secondary" />
            </div>
            <h2 className="text-xl font-bold mb-2">下单成功</h2>
            <p className="text-gray-500 text-sm">请到店出示核销码进行消费</p>
          </div>

          <div className="card p-5 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">套餐</span>
              <span className="font-medium">{pkg.name || pkg.title}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">商户</span>
              <span className="font-medium">{pkg.merchant_name || '商户'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">实付金额</span>
              <span className="font-bold text-accent text-lg">¥{(currentPrice * quantity).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">核销码</span>
              <span className="font-mono font-bold text-primary text-lg tracking-widest">{orderResult.verification_code}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">有效期至</span>
              <span className={isExpired ? 'text-danger' : ''}>{orderResult.expires_at?.split('T')[0] || orderResult.expires_at?.split(' ')[0] || validTo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">库存变化</span>
              <span className="text-secondary">{remaining} → {remaining - quantity} (已扣减{quantity})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">订单状态</span>
              <span className="text-secondary font-medium">已支付 · 待核销</span>
            </div>
          </div>

          <div className="card p-4 mt-4">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">核销方式</h4>
            <ul className="space-y-1.5 text-xs text-gray-500">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-secondary flex-shrink-0 mt-0.5" />
                <span>到店出示6位动态核销码（每60秒自动刷新）</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-secondary flex-shrink-0 mt-0.5" />
                <span>商户扫码核销，核销后订单状态变更为"已使用"</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-3.5 h-3.5 text-secondary flex-shrink-0 mt-0.5" />
                <span>核销时自动校验有效期和松江区地理围栏</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 flex gap-3">
            <Link to={`/order/${orderResult.id}`} className="btn-primary flex-1 text-center text-sm">
              查看订单详情
            </Link>
            <Link to="/" className="btn-outline flex-1 text-center text-sm">
              返回首页
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen pb-24 animate-fade-in">
      <div className="relative">
        <div className="h-56 bg-gradient-to-br from-primary-50 to-primary/10 flex items-center justify-center">
          <span className="text-gray-400">套餐图片</span>
        </div>
        <Link to={-1 as unknown as string} className="absolute top-4 left-4 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white backdrop-blur">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div className={`absolute top-4 right-4 flex items-center gap-1 px-2 py-1 rounded-full text-xs ${typeInfo.color}`}>
          <TypeIcon className="w-3 h-3" />
          <span>{typeInfo.label}</span>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-4 relative z-10">
        {!isInSongjiang && (
          <div className="mb-4 p-3 bg-danger-50 text-danger text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">不在松江区范围内</p>
              <p className="text-xs mt-0.5 opacity-80">本平台服务仅限松江区内使用，当前无法购买</p>
            </div>
          </div>
        )}
        {isExpired && (
          <div className="mb-4 p-3 bg-gray-100 text-gray-600 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="font-medium">该套餐已过期</p>
          </div>
        )}
        {remaining <= 0 && !isExpired && (
          <div className="mb-4 p-3 bg-gray-100 text-gray-600 text-sm rounded-lg flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="font-medium">该套餐已售罄</p>
          </div>
        )}

        <div className="card p-5">
          <h1 className="font-serif-title text-xl font-bold">{pkg.name || pkg.title}</h1>
          <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {pkg.merchant_name} · {catMap[pkg.merchant_category || pkg.category] || pkg.category}
          </p>
          <div className="flex items-baseline gap-3 mt-3">
            <span className="text-2xl font-bold text-accent">¥{currentPrice}</span>
            <span className="text-sm text-gray-400 line-through">¥{originalPrice}</span>
            {discountPercent > 0 && <span className="badge-discount">{discountPercent}%OFF</span>}
          </div>
          <p className="mt-4 text-sm text-gray-600 leading-relaxed">{pkg.description}</p>
          <div className="mt-4 space-y-2 text-sm">
            {isTimeslot && timeslotInfo && (
              <div className="flex items-center gap-2 text-gray-500">
                <Clock className="w-4 h-4 text-gray-400" />
                <span>适用时段：{timeslotInfo}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-gray-500">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span>有效期：{validFrom} 至 {validTo}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <Package className="w-4 h-4 text-gray-400" />
              <span>剩余 {remaining} 份 · 已售 {sold} 份</span>
              {remaining > 0 && remaining <= 5 && (
                <span className="text-xs text-danger font-medium">库存紧张</span>
              )}
            </div>
          </div>
          {tags.length > 0 && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {tags.map((t: string) => <span key={t} className="badge-tag">{t}</span>)}
            </div>
          )}
        </div>

        <div className="card p-5 mt-4">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">购买与核销须知</h3>
          <ul className="space-y-2 text-xs text-gray-500">
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-secondary flex-shrink-0 mt-0.5" />
              <span>购买后生成6位动态核销码，到店出示给商户即可</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-secondary flex-shrink-0 mt-0.5" />
              <span>动态码每60秒自动刷新，也可手动刷新</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-secondary flex-shrink-0 mt-0.5" />
              <span>核销时自动校验有效期，过期订单无法核销</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-secondary flex-shrink-0 mt-0.5" />
              <span>核销成功后库存自动扣减，订单状态变更为"已使用"</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-secondary flex-shrink-0 mt-0.5" />
              <span>本服务仅限松江区范围内使用</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-8 text-center font-medium">{quantity}</span>
            <button
              onClick={() => setQuantity((q) => Math.min(remaining, q + 1))}
              disabled={quantity >= remaining}
              className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1">
            <p className="text-xs text-gray-400">合计</p>
            <p className="text-lg font-bold text-accent">¥{(currentPrice * quantity).toFixed(2)}</p>
          </div>
          <button
            onClick={handleBuy}
            disabled={buying || !isInSongjiang || isExpired || remaining <= 0}
            className="btn-accent flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4" />
            {buying ? '下单中...' : remaining <= 0 ? '已售罄' : '立即购买'}
          </button>
        </div>
      </div>
    </div>
  )
}

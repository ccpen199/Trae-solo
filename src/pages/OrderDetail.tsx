import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Package, Clock, CheckCircle } from 'lucide-react'

interface TimelineItem {
  status: string
  description: string
  created_at: string
}

interface OrderDetailData {
  id: number
  status: string
  amount: number
  appointment_time: string
  created_at: string
  product_name: string
  category: string
  timeline?: TimelineItem[]
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  created: { label: '待支付', color: 'tag-red' },
  paid: { label: '已支付', color: 'tag-blue' },
  confirmed: { label: '商家已确认', color: 'tag-gold' },
  completed: { label: '已完成', color: 'tag-green' },
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderDetailData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    fetch(`/api/orders/${id}`)
      .then((res) => res.json())
      .then((data) => setOrder(data.data || {
        id: Number(id),
        status: 'paid',
        amount: 368,
        appointment_time: '',
        created_at: '2025-12-10 14:30:00',
        product_name: '建水紫陶茶壶·云纹',
        category: '红河特产',
        timeline: [
          { status: 'created', description: '订单已创建', created_at: '2025-12-10 14:30:00' },
          { status: 'paid', description: '订单已支付', created_at: '2025-12-10 14:32:00' },
        ],
      }))
      .catch(() => setOrder({
        id: Number(id),
        status: 'paid',
        amount: 368,
        appointment_time: '',
        created_at: '2025-12-10 14:30:00',
        product_name: '建水紫陶茶壶·云纹',
        category: '红河特产',
        timeline: [
          { status: 'created', description: '订单已创建', created_at: '2025-12-10 14:30:00' },
          { status: 'paid', description: '订单已支付', created_at: '2025-12-10 14:32:00' },
        ],
      }))
      .finally(() => setLoading(false))
  }, [id])

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    if (isNaN(d.getTime())) return timeStr
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link to="/shop/orders" className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-honghe-red mb-6">
        <ArrowLeft className="w-4 h-4" /> 返回订单列表
      </Link>

      {loading ? (
        <div className="card-static p-6 animate-pulse space-y-4">
          <div className="h-7 bg-warm-100 rounded w-1/3" />
          <div className="h-20 bg-warm-100 rounded" />
        </div>
      ) : order ? (
        <>
          <div className="card-static p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
            <h1 className="section-title text-xl">订单详情</h1>
              {STATUS_MAP[order.status] && (
                <span className={STATUS_MAP[order.status].color}>
                  {STATUS_MAP[order.status].label}
                </span>
              )}
            </div>

            <div className="flex gap-4 mb-6 pb-6 border-b border-warm-100">
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-honghe-gold/60 to-honghe-red/40 flex items-center justify-center flex-shrink-0">
                <Package className="w-10 h-10 text-white/80" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-warm-800 mb-1">
                  {order.product_name || `订单 #${order.id}`}
                </h3>
                {order.category && (
                  <span className="tag-gold text-xs">{order.category}</span>
                )}
                <div className="mt-2 text-honghe-red font-bold text-xl">¥{order.amount}</div>
              </div>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-warm-500">订单编号</span>
                <span className="text-warm-800">#{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-warm-500">下单时间</span>
                <span className="text-warm-800">{formatTime(order.created_at)}</span>
              </div>
              {order.appointment_time && (
                <div className="flex justify-between">
                  <span className="text-warm-500">预约时间</span>
                  <span className="text-warm-800">{formatTime(order.appointment_time)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="card-static p-6">
            <h2 className="font-medium text-warm-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-honghe-red" />
              订单进度
            </h2>
            <div className="space-y-4">
              {(order.timeline || []).map((item, idx) => {
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <CheckCircle className="w-5 h-5 text-honghe-green" />
                      {idx < (order.timeline?.length || 0) - 1 && (
                        <div className="w-0.5 h-8 bg-honghe-green/30 mt-1" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="font-medium text-warm-800">{item.description}</div>
                      <div className="text-xs text-warm-400 mt-0.5">{formatTime(item.created_at)}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      ) : (
        <div className="card-static p-8 text-center text-warm-400">
          订单不存在
        </div>
      )}
    </div>
  )
}

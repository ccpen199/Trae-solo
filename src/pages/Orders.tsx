import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Package } from 'lucide-react'

interface OrderItem {
  id: number
  status: string
  amount: number
  appointment_time: string
  created_at: string
  product_name: string
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  created: { label: '待支付', color: 'tag-red' },
  paid: { label: '已支付', color: 'tag-blue' },
  confirmed: { label: '商家已确认', color: 'tag-gold' },
  completed: { label: '已完成', color: 'tag-green' },
}

const TABS = [
  { key: 'all', label: '全部' },
  { key: 'created', label: '待支付' },
  { key: 'pending', label: '待履约' },
  { key: 'completed', label: '已完成' },
]

export default function Orders() {
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => {
    fetch('/api/orders?user_id=1')
      .then((res) => res.json())
      .then((data) => {
        const items = data.data || []
        setOrders(items)
      })
      .catch(() => {
        setOrders([
          { id: 1, status: 'paid', amount: 368, appointment_time: '', created_at: '2025-12-10 14:30:00', product_name: '建水紫陶茶壶·云纹' },
          { id: 2, status: 'completed', amount: 68, appointment_time: '2025-12-22 12:00', created_at: '2025-12-08 10:15:00', product_name: '蒙自过桥米线·经典套餐' },
          { id: 3, status: 'created', amount: 458, appointment_time: '', created_at: '2025-12-12 16:45:00', product_name: '个旧锡制茶仓·松鹤延年' },
          { id: 4, status: 'confirmed', amount: 68, appointment_time: '2025-12-28 18:30', created_at: '2025-12-11 09:20:00', product_name: '蒙自过桥米线·经典套餐' },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    if (isNaN(d.getTime())) return timeStr
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const filteredOrders = orders.filter((order) => {
    if (activeTab === 'all') return true
    if (activeTab === 'created') return order.status === 'created'
    if (activeTab === 'pending') return order.status === 'paid' || order.status === 'confirmed'
    if (activeTab === 'completed') return order.status === 'completed'
    return true
  })

  return (
    <div className="container mx-auto px-4 py-6">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-honghe-red mb-6">
        <ArrowLeft className="w-4 h-4" /> 返回商城
      </Link>

      <h1 className="section-title mb-6">我的订单</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide pb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-honghe-red text-white'
                : 'bg-warm-100 text-warm-600 hover:bg-warm-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-static p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-warm-100 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-warm-100 rounded w-1/2" />
                  <div className="h-4 bg-warm-100 rounded w-1/4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = STATUS_MAP[order.status] || { label: order.status, color: 'tag-blue' }
            return (
              <Link
                key={order.id}
                to={`/shop/orders/${order.id}`}
                className="card p-4 flex gap-4"
              >
                <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-honghe-gold/60 to-honghe-red/40 flex items-center justify-center flex-shrink-0">
                  <Package className="w-8 h-8 text-white/80" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="font-medium text-warm-800 line-clamp-1 flex-1">
                      {order.product_name || `订单 #${order.id}`}
                    </h3>
                    <span className={status.color}>{status.label}</span>
                  </div>
                  <div className="text-sm text-warm-500 mb-1">
                    <span className="text-honghe-red font-bold">¥{order.amount}</span>
                    <span className="mx-2">·</span>
                    <span>{formatTime(order.created_at)}</span>
                  </div>
                  {order.appointment_time && (
                    <div className="text-xs text-warm-400">预约：{formatTime(order.appointment_time)}</div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card-static p-12 text-center text-warm-400">
          暂无订单
        </div>
      )}
    </div>
  )
}

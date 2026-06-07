import { useState, useEffect, useCallback } from 'react'
import { Package } from 'lucide-react'
import { api } from '@/lib/api'

interface Order {
  id: number
  order_no: string
  product_name: string
  quantity: number
  total_price: number
  status: string
  created_at: string
}

const TABS = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待付款' },
  { key: 'paid', label: '已付款' },
  { key: 'shipped', label: '已发货' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-blue-100 text-blue-700',
  shipped: 'bg-purple-100 text-purple-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-gray-100 text-gray-500',
}

const statusLabels: Record<string, string> = {
  pending: '待付款',
  paid: '已付款',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消',
}

export default function MyOrders() {
  const [activeTab, setActiveTab] = useState('')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const url = activeTab ? `/orders?status=${activeTab}` : '/orders'
      const data = await api.get<{ list: Order[]; total: number }>(url)
      setOrders(data.list)
    } catch {
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const handleAction = async (orderId: number, action: string) => {
    try {
      await api.put(`/orders/${orderId}/${action}`)
      fetchOrders()
    } catch (err: any) {
      alert(err.message || '操作失败')
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">我的订单</h1>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-red-600 text-red-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-400">加载中...</div>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-400">
          <Package className="w-16 h-16 mb-4" />
          <p>暂无订单</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-gray-500">订单号：{order.order_no}</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[order.status] || 'bg-gray-100 text-gray-700'}`}>
                  {statusLabels[order.status] || order.status}
                </span>
              </div>

              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-medium text-gray-800">{order.product_name}</p>
                  <p className="text-sm text-gray-500">x{order.quantity}</p>
                </div>
                <p className="text-lg font-semibold text-red-600">¥{order.total_price}</p>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">{new Date(order.created_at).toLocaleString()}</span>
                <div className="flex gap-2">
                  {order.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleAction(order.id, 'pay')}
                        className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                      >
                        付款
                      </button>
                      <button
                        onClick={() => handleAction(order.id, 'cancel')}
                        className="px-3 py-1 text-sm border border-gray-300 text-gray-600 rounded hover:bg-gray-50 transition-colors"
                      >
                        取消订单
                      </button>
                    </>
                  )}
                  {order.status === 'shipped' && (
                    <button
                      onClick={() => handleAction(order.id, 'confirm')}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                    >
                      确认收货
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

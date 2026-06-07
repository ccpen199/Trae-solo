import { useState, useEffect, useCallback } from 'react'
import { MapPin, AlertTriangle, Navigation, RefreshCw } from 'lucide-react'
import { orders } from '../../api'

export default function NearbyOrdersPage() {
  const [orderList, setOrderList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState<number | null>(null)

  const loadOrders = useCallback(async () => {
    try {
      const res: any = await orders.getNearbyOrders()
      setOrderList(Array.isArray(res) ? res : res?.list || [])
    } catch {
      setOrderList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadOrders()
    const interval = setInterval(loadOrders, 30000)
    return () => clearInterval(interval)
  }, [loadOrders])

  const handleAccept = async (id: number) => {
    setAccepting(id)
    try {
      await orders.acceptOrder(id)
      setOrderList((prev) => prev.filter((o) => o.id !== id))
    } catch {
    } finally {
      setAccepting(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold text-secondary">附近订单</h1>
        <button
          onClick={loadOrders}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <RefreshCw size={14} /> 刷新
        </button>
      </div>

      <p className="text-sm text-gray-500">每30秒自动刷新，发现身边好单</p>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : orderList.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <MapPin size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-400">附近暂无可接订单</p>
          <p className="text-sm text-gray-300 mt-1">请稍后再试或移动到其他区域</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orderList.map((order) => (
            <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-50">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-secondary">{order.order_no}</span>
                {order.time_sensitivity && (
                  <span className="flex items-center gap-1 text-xs text-warning bg-warning/10 px-2 py-0.5 rounded-full">
                    <AlertTriangle size={12} /> 急件
                  </span>
                )}
              </div>
              <div className="space-y-2 mb-3">
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-primary font-bold mt-0.5">取</span>
                  <span className="text-gray-700">{order.pickup_address}</span>
                </div>
                <div className="flex items-start gap-2 text-sm">
                  <span className="text-success font-bold mt-0.5">送</span>
                  <span className="text-gray-700">{order.delivery_address}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  {order.distance && (
                    <span className="flex items-center gap-1">
                      <Navigation size={12} /> {order.distance}km
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-primary">¥{order.total_price}</span>
                  <button
                    onClick={() => handleAccept(order.id)}
                    disabled={accepting === order.id}
                    className="px-5 py-1.5 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {accepting === order.id ? '接单中...' : '接单'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

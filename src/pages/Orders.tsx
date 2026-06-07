import { useState, useEffect } from 'react'
import { Search, Plus, Package, Truck, CheckCircle, XCircle, MapPin, Clock, User, Navigation, DollarSign, Award } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface Order {
  id: number
  order_no: string
  status: 'pending' | 'assigned' | 'picked_up' | 'delivered' | 'timeout' | 'cancelled'
  pickup_lat: number
  pickup_lng: number
  pickup_address: string
  delivery_lat: number
  delivery_lng: number
  delivery_address: string
  weight: number
  rider_id: number | null
  rider_name: string | null
  rider_phone: string | null
  estimated_pickup_time: string
  estimated_delivery_time: string
  delivery_time_window_start: string
  delivery_time_window_end: string
  base_fee: number
  reward: number
  subsidy: number
  timeout_penalty_tier: number
  timeout_penalty_amount: number
  created_at: string
  assigned_at: string
  picked_up_at: string
  delivered_at: string
}

interface Rider {
  id: number
  name: string
  phone: string
  latitude: number
  longitude: number
  current_load: number
  max_load: number
  performance_rate: number
  status: string
  total_orders: number
}

interface Track {
  id: number
  rider_id: number
  order_id: number
  latitude: number
  longitude: number
  speed: number
  heading: number
  recorded_at: string
}

interface DispatchLog {
  id: number
  order_id: number
  rider_id: number
  rider_name: string
  score: number
  dispatch_reason: string
  created_at: string
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  assigned: 'bg-blue-100 text-blue-800',
  picked_up: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  timeout: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}

const statusLabels: Record<string, string> = {
  pending: '待派单',
  assigned: '已派单',
  picked_up: '配送中',
  delivered: '已送达',
  timeout: '已超时',
  cancelled: '已取消',
}

const statusTabs = [
  { key: '', label: '全部' },
  { key: 'pending', label: '待派单' },
  { key: 'assigned', label: '已派单' },
  { key: 'picked_up', label: '配送中' },
  { key: 'delivered', label: '已送达' },
  { key: 'timeout', label: '已超时' },
  { key: 'cancelled', label: '已取消' },
]

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDateTime(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [stats, setStats] = useState({ pending: 0, assigned: 0, inDelivery: 0, deliveredToday: 0 })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderTracks, setOrderTracks] = useState<Track[]>([])
  const [dispatchLogs, setDispatchLogs] = useState<DispatchLog[]>([])
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null)
  const [riders, setRiders] = useState<Rider[]>([])
  const [ridersLoading, setRidersLoading] = useState(false)

  useEffect(() => {
    fetchOrders()
    fetchStats()
  }, [search, statusFilter])

  async function fetchOrders() {
    setLoading(true)
    try {
      const params: any = { pageSize: 50 }
      if (search) params.search = search
      if (statusFilter) params.status = statusFilter
      const data = await api.getOrders(params)
      setOrders(data.list || [])
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setLoading(false)
    }
  }

  async function fetchStats() {
    try {
      const [pending, assigned, pickedUp, delivered] = await Promise.all([
        api.getOrders({ status: 'pending', pageSize: 1 }),
        api.getOrders({ status: 'assigned', pageSize: 1 }),
        api.getOrders({ status: 'picked_up', pageSize: 1 }),
        api.getOrders({ status: 'delivered', pageSize: 100 }),
      ])

      const today = new Date().toISOString().split('T')[0]
      const deliveredToday = (delivered.list || []).filter(
        (o: Order) => o.delivered_at && o.delivered_at.startsWith(today)
      ).length

      setStats({
        pending: pending.total || 0,
        assigned: assigned.total || 0,
        inDelivery: pickedUp.total || 0,
        deliveredToday,
      })
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
  }

  async function fetchOrderDetail(orderId: number) {
    try {
      const data = await api.getOrder(orderId)
      setSelectedOrder(data)
      setOrderTracks(data.tracks || [])
    } catch (error) {
      console.error('Failed to fetch order detail:', error)
    }
  }

  async function fetchDispatchLogs(orderId: number) {
    try {
      const data = await api.getDispatchLogs({ pageSize: 10 })
      const logs = (data.list || []).filter((log: DispatchLog) => log.order_id === orderId)
      setDispatchLogs(logs)
    } catch (error) {
      console.error('Failed to fetch dispatch logs:', error)
    }
  }

  async function fetchOnlineRiders() {
    setRidersLoading(true)
    try {
      const data = await api.getRiders({ status: 'online', pageSize: 50 })
      setRiders(data.list || [])
    } catch (error) {
      console.error('Failed to fetch riders:', error)
    } finally {
      setRidersLoading(false)
    }
  }

  async function handleAutoDispatch(orderId: number) {
    try {
      await api.autoDispatch(orderId)
      fetchOrders()
      fetchStats()
    } catch (error) {
      console.error('Failed to auto dispatch:', error)
      alert(error instanceof Error ? error.message : '派单失败')
    }
  }

  async function handleManualDispatch(orderId: number, riderId: number) {
    try {
      await api.manualDispatch(orderId, riderId)
      setDispatchModalOpen(false)
      setDispatchOrder(null)
      fetchOrders()
      fetchStats()
    } catch (error) {
      console.error('Failed to manual dispatch:', error)
      alert(error instanceof Error ? error.message : '派单失败')
    }
  }

  async function handlePickup(orderId: number) {
    try {
      await api.pickupOrder(orderId)
      fetchOrders()
      fetchStats()
    } catch (error) {
      console.error('Failed to pickup order:', error)
      alert(error instanceof Error ? error.message : '操作失败')
    }
  }

  async function handleDeliver(orderId: number) {
    try {
      await api.deliverOrder(orderId)
      fetchOrders()
      fetchStats()
    } catch (error) {
      console.error('Failed to deliver order:', error)
      alert(error instanceof Error ? error.message : '操作失败')
    }
  }

  async function handleCancel(orderId: number) {
    if (!confirm('确定要取消此订单吗？')) return
    try {
      await api.cancelOrder(orderId)
      fetchOrders()
      fetchStats()
    } catch (error) {
      console.error('Failed to cancel order:', error)
      alert(error instanceof Error ? error.message : '操作失败')
    }
  }

  function openDetailModal(order: Order) {
    setSelectedOrder(order)
    fetchOrderDetail(order.id)
    fetchDispatchLogs(order.id)
    setDetailModalOpen(true)
  }

  function openDispatchModal(order: Order) {
    setDispatchOrder(order)
    fetchOnlineRiders()
    setDispatchModalOpen(true)
  }

  const sortedRiders = [...riders].map(rider => ({
    ...rider,
    distance: dispatchOrder
      ? haversineDistance(rider.latitude, rider.longitude, dispatchOrder.pickup_lat, dispatchOrder.pickup_lng)
      : 0,
  })).sort((a, b) => a.distance - b.distance)

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">订单管理与调度</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">待派单</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-full">
              <Package className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">已派单</p>
              <p className="text-3xl font-bold text-blue-600">{stats.assigned}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-full">
              <User className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">配送中</p>
              <p className="text-3xl font-bold text-purple-600">{stats.inDelivery}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-full">
              <Truck className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">今日送达</p>
              <p className="text-3xl font-bold text-green-600">{stats.deliveredToday}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-full">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="搜索订单号、地址..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              onClick={() => alert('新建订单功能待实现')}
            >
              <Plus className="w-4 h-4" />
              新建订单
            </button>
          </div>

          <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={cn(
                  'px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors',
                  statusFilter === tab.key
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">订单号</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">取货地址</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">送货地址</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">重量</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">骑手</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">预计送达</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">基础费</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">奖励</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">加载中...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-gray-500">暂无订单数据</td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4 text-sm font-medium text-gray-900">{order.order_no}</td>
                    <td className="px-4 py-4">
                      <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[order.status])}>
                        {statusLabels[order.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate" title={order.pickup_address}>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-green-500 flex-shrink-0" />
                        <span className="truncate">{order.pickup_address}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600 max-w-xs truncate" title={order.delivery_address}>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-red-500 flex-shrink-0" />
                        <span className="truncate">{order.delivery_address}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{order.weight}kg</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{order.rider_name || '-'}</td>
                    <td className="px-4 py-4 text-sm text-gray-600">{formatTime(order.estimated_delivery_time)}</td>
                    <td className="px-4 py-4 text-sm text-gray-900 font-medium">¥{order.base_fee.toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-orange-600 font-medium">+¥{order.reward.toFixed(2)}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {order.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleAutoDispatch(order.id)}
                              className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                              自动派单
                            </button>
                            <button
                              onClick={() => openDispatchModal(order)}
                              className="px-2 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700"
                            >
                              手动派单
                            </button>
                          </>
                        )}
                        {order.status === 'assigned' && (
                          <button
                            onClick={() => handlePickup(order.id)}
                            className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                          >
                            标记取货
                          </button>
                        )}
                        {order.status === 'picked_up' && (
                          <button
                            onClick={() => handleDeliver(order.id)}
                            className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            标记送达
                          </button>
                        )}
                        {!['delivered', 'cancelled'].includes(order.status) && (
                          <button
                            onClick={() => handleCancel(order.id)}
                            className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                          >
                            取消
                          </button>
                        )}
                        <button
                          onClick={() => openDetailModal(order)}
                          className="px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                        >
                          详情
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detailModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">订单详情 - {selectedOrder.order_no}</h2>
              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                    <span className={cn('inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium', statusColors[selectedOrder.status])}>
                      {statusLabels[selectedOrder.status]}
                    </span>
                  </h3>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">取货地址</p>
                      <p className="text-sm text-gray-900">{selectedOrder.pickup_address}</p>
                      <p className="text-xs text-gray-400">坐标: {selectedOrder.pickup_lat?.toFixed(6)}, {selectedOrder.pickup_lng?.toFixed(6)}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-red-500 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-500">送货地址</p>
                      <p className="text-sm text-gray-900">{selectedOrder.delivery_address}</p>
                      <p className="text-xs text-gray-400">坐标: {selectedOrder.delivery_lat?.toFixed(6)}, {selectedOrder.delivery_lng?.toFixed(6)}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" />
                    <div>
                      <p className="text-sm text-gray-500">配送骑手</p>
                      <p className="text-sm text-gray-900">{selectedOrder.rider_name || '未分配'}</p>
                      {selectedOrder.rider_phone && (
                        <p className="text-xs text-gray-400">{selectedOrder.rider_phone}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-orange-500" />
                    <div>
                      <p className="text-sm text-gray-500">时间窗口</p>
                      <p className="text-sm text-gray-900">
                        {formatDateTime(selectedOrder.delivery_time_window_start)} - {formatDateTime(selectedOrder.delivery_time_window_end)}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-sm text-gray-500">预计取货</p>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedOrder.estimated_pickup_time)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">预计送达</p>
                      <p className="text-sm text-gray-900">{formatDateTime(selectedOrder.estimated_delivery_time)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-green-500" />
                  费用明细
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">基础运费</p>
                    <p className="text-lg font-bold text-gray-900">¥{selectedOrder.base_fee.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">订单奖励</p>
                    <p className="text-lg font-bold text-orange-600">+¥{selectedOrder.reward.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">补贴</p>
                    <p className="text-lg font-bold text-blue-600">+¥{selectedOrder.subsidy.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">总计</p>
                    <p className="text-lg font-bold text-green-600">
                      ¥{(selectedOrder.base_fee + selectedOrder.reward + selectedOrder.subsidy).toFixed(2)}
                    </p>
                  </div>
                </div>
                {selectedOrder.timeout_penalty_amount > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-red-600">
                      超时罚款等级 {selectedOrder.timeout_penalty_tier}: -¥{selectedOrder.timeout_penalty_amount.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-purple-500" />
                  GPS 轨迹记录
                </h3>
                {orderTracks.length === 0 ? (
                  <p className="text-sm text-gray-500">暂无轨迹数据</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">时间</th>
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">纬度</th>
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">经度</th>
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">速度</th>
                          <th className="text-left py-2 px-3 text-gray-500 font-medium">方向</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderTracks.map((track) => (
                          <tr key={track.id} className="border-b border-gray-100">
                            <td className="py-2 px-3 text-gray-900">{formatDateTime(track.recorded_at)}</td>
                            <td className="py-2 px-3 text-gray-600">{track.latitude.toFixed(6)}</td>
                            <td className="py-2 px-3 text-gray-600">{track.longitude.toFixed(6)}</td>
                            <td className="py-2 px-3 text-gray-600">{track.speed.toFixed(1)} km/h</td>
                            <td className="py-2 px-3 text-gray-600">{track.heading.toFixed(0)}°</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {dispatchLogs.length > 0 && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-500" />
                    派单记录
                  </h3>
                  <div className="space-y-3">
                    {dispatchLogs.map((log) => (
                      <div key={log.id} className="bg-white rounded p-3 border border-gray-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-900">{log.rider_name}</span>
                          <span className="text-xs text-gray-400">{formatDateTime(log.created_at)}</span>
                        </div>
                        <p className="text-sm text-gray-600">派单评分: {log.score.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 mt-1">{log.dispatch_reason}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-400 space-y-1">
                <p>创建时间: {formatDateTime(selectedOrder.created_at)}</p>
                {selectedOrder.assigned_at && <p>派单时间: {formatDateTime(selectedOrder.assigned_at)}</p>}
                {selectedOrder.picked_up_at && <p>取货时间: {formatDateTime(selectedOrder.picked_up_at)}</p>}
                {selectedOrder.delivered_at && <p>送达时间: {formatDateTime(selectedOrder.delivered_at)}</p>}
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setDetailModalOpen(false)}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      {dispatchModalOpen && dispatchOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">手动派单 - {dispatchOrder.order_no}</h2>
              <button
                onClick={() => { setDispatchModalOpen(false); setDispatchOrder(null); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="p-4 bg-blue-50 border-b border-blue-100">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-blue-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">取货地址</p>
                  <p className="text-sm text-blue-700">{dispatchOrder.pickup_address}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              <h3 className="font-semibold text-gray-900 mb-4">选择在线骑手</h3>

              {ridersLoading ? (
                <div className="text-center py-8 text-gray-500">加载骑手列表中...</div>
              ) : sortedRiders.length === 0 ? (
                <div className="text-center py-8 text-gray-500">暂无在线骑手</div>
              ) : (
                <div className="space-y-3">
                  {sortedRiders.map((rider) => (
                    <div
                      key={rider.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{rider.name}</p>
                          <p className="text-sm text-gray-500">{rider.phone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600">{rider.distance.toFixed(1)}</p>
                          <p className="text-xs text-gray-500">距离(km)</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-purple-600">{rider.current_load}/{rider.max_load}</p>
                          <p className="text-xs text-gray-500">当前负载</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{(rider.performance_rate * 100).toFixed(0)}%</p>
                          <p className="text-xs text-gray-500">绩效评分</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-gray-700">{rider.total_orders}</p>
                          <p className="text-xs text-gray-500">总订单</p>
                        </div>

                        <button
                          onClick={() => handleManualDispatch(dispatchOrder.id, rider.id)}
                          disabled={rider.current_load >= rider.max_load}
                          className={cn(
                            'px-4 py-2 text-sm font-medium rounded-lg',
                            rider.current_load >= rider.max_load
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          )}
                        >
                          {rider.current_load >= rider.max_load ? '满载' : '指派'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => { setDispatchModalOpen(false); setDispatchOrder(null); }}
                className="px-4 py-2 text-sm text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

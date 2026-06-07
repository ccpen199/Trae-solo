import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clock, AlertTriangle } from 'lucide-react'
import StatusBadge from '../../components/StatusBadge'
import { orders } from '../../api'

const tabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待接单' },
  { key: 'in_progress', label: '进行中' },
  { key: 'completed', label: '已完成' },
  { key: 'appealing', label: '申诉中' },
]

const inProgressStatuses = ['accepted', 'picking_up', 'delivering']

export default function OrdersPage() {
  const [activeTab, setActiveTab] = useState('all')
  const [orderList, setOrderList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    loadOrders()
  }, [activeTab])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params: any = {}
      if (activeTab === 'pending') params.status = 'pending'
      else if (activeTab === 'in_progress') params.status = 'accepted,picking_up,delivering'
      else if (activeTab === 'completed') params.status = 'completed'
      else if (activeTab === 'appealing') params.status = 'appealing'
      const res: any = await orders.listOrders(params)
      setOrderList(Array.isArray(res) ? res : res?.list || [])
    } catch {
      setOrderList([])
    } finally {
      setLoading(false)
    }
  }

  const getFilteredOrders = () => {
    if (activeTab === 'all') return orderList
    if (activeTab === 'in_progress') return orderList.filter((o) => inProgressStatuses.includes(o.status))
    return orderList.filter((o) => o.status === activeTab)
  }

  const filteredOrders = getFilteredOrders()

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-secondary">订单管理</h1>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-lg p-1 shadow-sm overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-primary text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="bg-white rounded-xl p-12 text-center text-gray-400">
          暂无订单
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              onClick={() => navigate(`/rider/orders/${order.id}`)}
              className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-gray-50"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-secondary">{order.order_no}</span>
                  <StatusBadge status={order.status} />
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>
              <div className="space-y-1.5 text-sm">
                <div className="text-gray-600">
                  <span className="text-primary font-medium">取</span> {order.pickup_address}
                </div>
                <div className="text-gray-600">
                  <span className="text-success font-medium">送</span> {order.delivery_address}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  {order.time_sensitivity && (
                    <span className="flex items-center gap-1 text-warning">
                      <AlertTriangle size={12} /> 急件
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {order.created_at?.slice(5, 16) || '--'}
                  </span>
                </div>
                <span className="text-lg font-bold text-primary">¥{order.total_price}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

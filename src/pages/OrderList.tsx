import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'
import { requestRaw } from '@/utils/api'

interface Order {
  id: string
  origin: string
  destination: string
  total_fee: number
  status: string
  created_at: string
  waybill_no: string
  goods_type: string
  need_vat: number
  driver_name: string
  shipper_name: string
}

type TabKey = 'all' | 'pending' | 'transit' | 'done'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待出发' },
  { key: 'transit', label: '运输中' },
  { key: 'done', label: '已完成' },
]

const statusMap: Record<string, { variant: 'success' | 'warning' | 'error' | 'info'; label: string; color: string }> = {
  pending: { variant: 'warning', label: '待出发', color: 'border-l-amber-400' },
  pickup: { variant: 'info', label: '已装货', color: 'border-l-navy-400' },
  transit: { variant: 'warning', label: '运输中', color: 'border-l-amber-500' },
  delivered: { variant: 'success', label: '已送达', color: 'border-l-mint-400' },
  completed: { variant: 'success', label: '已结算', color: 'border-l-mint-500' },
}

export default function OrderList() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabKey>('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadOrders()
  }, [activeTab])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      let url = '/api/orders?pageSize=100'
      if (activeTab === 'pending') url += '&status=pending'
      if (activeTab === 'transit') url += '&status=transit'
      const res = await requestRaw<{ success: boolean; list: Order[]; total: number }>(url, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      })
      let list = res.list || []
      if (activeTab === 'done') {
        list = list.filter(o => o.status === 'delivered' || o.status === 'completed')
      }
      setOrders(list)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader title="运单中心" />

      <div className="flex gap-2 mb-4 bg-white rounded-xl p-1.5 shadow-sm border border-gray-100">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab.key
                ? 'bg-amber-500 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading && <div className="text-center py-8 text-gray-400">加载中...</div>}

      <div className="space-y-3">
        {!loading && orders.length === 0 && (
          <div className="text-center py-16 text-gray-400">暂无运单记录</div>
        )}
        {orders.map((order) => {
          const s = statusMap[order.status] || statusMap.pending
          return (
            <div
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
              className={`bg-white rounded-xl shadow-sm border border-gray-100 border-l-4 ${s.color} p-4 hover:shadow-md cursor-pointer transition-shadow`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-navy-50 flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-navy-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {order.origin} → {order.destination}
                    </p>
                    <p className="text-xs text-gray-500">
                      {order.waybill_no} · {order.goods_type}
                    </p>
                    {order.need_vat ? (
                      <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[10px] rounded-full bg-amber-50 text-amber-600">专票</span>
                    ) : null}
                  </div>
                </div>
                <div className="text-right flex flex-col items-end gap-1.5">
                  <span className="text-sm font-bold text-gray-900">¥{order.total_fee?.toFixed(2)}</span>
                  {s && <StatusBadge variant={s.variant}>{s.label}</StatusBadge>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

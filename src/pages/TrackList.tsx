import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Package,
  Truck,
  CheckCircle,
  AlertTriangle,
  Clock,
  ChevronRight,
  Filter,
  Calendar,
  Phone,
  User,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAppStore } from '@/store/useAppStore'
import type { Order } from '../../api/types'

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待揽收' },
  { value: 'in_transit', label: '运输中' },
  { value: 'out_for_delivery', label: '派送中' },
  { value: 'delivered', label: '已签收' },
  { value: 'exception', label: '异常' },
]

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: '待揽收', color: 'text-sf-yellow', icon: Clock },
  in_transit: { label: '运输中', color: 'text-sf-blue', icon: Truck },
  out_for_delivery: { label: '派送中', color: 'text-sf-yellow', icon: Truck },
  delivered: { label: '已签收', color: 'text-sf-green', icon: CheckCircle },
  exception: { label: '异常', color: 'text-sf-red', icon: AlertTriangle },
}

const TrackList: React.FC = () => {
  const navigate = useNavigate()
  const { addNotification } = useAppStore()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })

  useEffect(() => {
    fetchOrders()
  }, [statusFilter])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const params: Record<string, any> = {}
      if (statusFilter) params.status = statusFilter
      const result = await api.orders.list(params)
      if (result.success && result.data) {
        setOrders(result.data as Order[])
      }
    } catch (error) {
      addNotification({ type: 'error', message: '获取运单列表失败' })
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      (order.tracking_no || order.order_no)?.toLowerCase().includes(query) ||
      order.sender_name?.toLowerCase().includes(query) ||
      order.receiver_name?.toLowerCase().includes(query) ||
      order.sender_phone?.includes(query) ||
      order.receiver_phone?.includes(query)
    )
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-sf-red" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display text-sf-light">运单管理</h1>
          <p className="text-sf-light/50 text-sm mt-1">查询和追踪所有运单状态</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-sf-blue/10 border border-sf-blue/30 rounded-lg">
            <span className="text-sf-light/70 text-sm">共 </span>
            <span className="text-sf-blue font-display text-lg">{orders.length}</span>
            <span className="text-sf-light/70 text-sm"> 条运单</span>
          </div>
        </div>
      </div>

      <div className="glass rounded-xl p-6 border border-sf-blue/30">
        <form onSubmit={handleSearch} className="flex items-center gap-4">
          <div className="flex-1 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sf-light/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="输入运单号、收件人姓名、手机号搜索..."
              className="w-full h-11 pl-12 pr-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light placeholder:text-sf-light/40 focus:outline-none focus:border-sf-red/50 transition-colors"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-sf-light/50" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Calendar size={18} className="text-sf-light/50" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
            />
            <span className="text-sf-light/50">至</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="h-11 px-4 bg-sf-dark/50 border border-sf-blue/20 rounded-lg text-sf-light focus:outline-none focus:border-sf-red/50 transition-colors"
            />
          </div>
        </form>
      </div>

      <div className="glass rounded-xl border border-sf-blue/30 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-sf-dark/50 border-b border-sf-blue/20">
              <th className="text-left px-6 py-4 text-sf-light/70 text-sm font-medium">运单号</th>
              <th className="text-left px-6 py-4 text-sf-light/70 text-sm font-medium">寄件人</th>
              <th className="text-left px-6 py-4 text-sf-light/70 text-sm font-medium">收件人</th>
              <th className="text-left px-6 py-4 text-sf-light/70 text-sm font-medium">物品信息</th>
              <th className="text-left px-6 py-4 text-sf-light/70 text-sm font-medium">状态</th>
              <th className="text-left px-6 py-4 text-sf-light/70 text-sm font-medium">运费</th>
              <th className="text-left px-6 py-4 text-sf-light/70 text-sm font-medium">创建时间</th>
              <th className="text-left px-6 py-4 text-sf-light/70 text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const status = statusConfig[order.status] || statusConfig.pending
              const StatusIcon = status.icon
              return (
                <tr
                  key={order.id}
                  className="border-b border-sf-blue/10 hover:bg-sf-dark/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-sf-red/10 rounded-lg flex items-center justify-center">
                        <Package size={14} className="text-sf-red" />
                      </div>
                      <div>
                        <div className="text-sf-light font-mono text-sm">{order.tracking_no || order.order_no}</div>
                        <div className="text-sf-light/50 text-xs">{order.carrier || '标准快递'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-sf-light/50" />
                      <div>
                        <div className="text-sf-light text-sm">{order.sender_name}</div>
                        <div className="flex items-center gap-1 text-sf-light/50 text-xs">
                          <Phone size={12} />
                          <span>{order.sender_phone}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User size={14} className="text-sf-blue/70" />
                      <div>
                        <div className="text-sf-light text-sm">{order.receiver_name}</div>
                        <div className="flex items-center gap-1 text-sf-light/50 text-xs">
                          <Phone size={12} />
                          <span>{order.receiver_phone}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sf-light text-sm">{order.goods_type}</div>
                    <div className="text-sf-light/50 text-xs">重量: {order.weight}kg</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`flex items-center gap-2 ${status.color}`}>
                      <StatusIcon size={16} />
                      <span className="text-sm">{status.label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sf-red font-display text-sm">¥{(order.cost || 0).toFixed(2)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sf-light/70 text-sm">
                      {order.created_at ? new Date(order.created_at).toLocaleDateString('zh-CN') : '-'}
                    </div>
                    <div className="text-sf-light/50 text-xs">
                      {order.created_at ? new Date(order.created_at).toLocaleTimeString('zh-CN') : ''}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(`/track/${order.id}`)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-sf-blue/10 text-sf-blue rounded-lg text-sm hover:bg-sf-blue/20 transition-colors"
                    >
                      查看轨迹
                      <ChevronRight size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-16 text-center">
                  <div className="text-sf-light/50">暂无匹配的运单记录</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TrackList

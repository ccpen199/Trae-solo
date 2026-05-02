import { useEffect, useState } from 'react'
import { adminApi } from '../../services/api'

interface Order {
  id: string
  user_name: string
  order_type: string
  product_name: string
  product_code: string
  amount: number
  shares: number
  status: string
  created_at: string
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ order_type: '', status: '' })

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    try {
      const params: Record<string, string> = {}
      if (filter.order_type) params.order_type = filter.order_type
      if (filter.status) params.status = filter.status
      
      const response = await adminApi.getAllOrders(params)
      setOrders(response.data || [])
    } catch (error) {
      console.error('获取订单列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; text: string }> = {
      pending: { class: 'badge-warning', text: '待处理' },
      locked: { class: 'badge-info', text: '已锁定' },
      confirmed: { class: 'badge-info', text: '已确认' },
      completed: { class: 'badge-success', text: '已完成' },
      rejected: { class: 'badge-danger', text: '已拒绝' },
      closed: { class: 'badge-gray', text: '已关闭' },
    }
    return map[status] || { class: 'badge-gray', text: status }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">订单管理</h1>
        <p className="text-gray-500 mt-1">查看和管理所有用户订单</p>
      </div>

      <div className="card">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">订单类型</label>
            <select
              value={filter.order_type}
              onChange={(e) => setFilter({ ...filter, order_type: e.target.value })}
              className="select-field w-32"
            >
              <option value="">全部类型</option>
              <option value="purchase">申购</option>
              <option value="redemption">赎回</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">订单状态</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="select-field w-32"
            >
              <option value="">全部状态</option>
              <option value="pending">待处理</option>
              <option value="locked">已锁定</option>
              <option value="confirmed">已确认</option>
              <option value="completed">已完成</option>
              <option value="rejected">已拒绝</option>
              <option value="closed">已关闭</option>
            </select>
          </div>
        </div>
      </div>

      <div className="card">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-4xl mb-2">📋</p>
            <p className="text-gray-500">暂无订单记录</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">用户</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">产品</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">金额/份额</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const badge = getStatusBadge(order.status)
                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{order.user_name || '未知用户'}</p>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{order.product_name}</p>
                          <p className="text-xs text-gray-500">{order.product_code}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-sm ${order.order_type === 'purchase' ? 'text-primary-600' : 'text-orange-600'}`}>
                          {order.order_type === 'purchase' ? '申购' : '赎回'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {order.amount ? (
                          <p className="font-medium text-gray-900">¥{order.amount.toFixed(2)}</p>
                        ) : order.shares ? (
                          <p className="font-medium text-gray-900">{order.shares.toFixed(4)} 份</p>
                        ) : '-'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`badge ${badge.class}`}>{badge.text}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString('zh-CN')}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

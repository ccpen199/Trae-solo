import { useEffect, useState } from 'react'
import { orderApi, assetApi } from '../services/api'

interface Order {
  id: string
  order_type: string
  product_name: string
  product_code: string
  amount: number
  shares: number
  nav: number
  fee_amount: number
  status: string
  payment_status: string
  created_at: string
  submitted_at: string
  confirmed_at: string
  completed_at: string
  rejected_at: string
  rejected_reason: string
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState({ order_type: '', status: '' })
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [filter])

  const fetchOrders = async () => {
    try {
      const filters: Record<string, string> = {}
      if (filter.order_type) filters.order_type = filter.order_type
      if (filter.status) filters.status = filter.status
      
      const response = await orderApi.getAll(filters)
      setOrders(response.data || [])
    } catch (error) {
      console.error('获取订单列表失败', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { class: string; text: string }> = {
      pending: { class: 'badge-warning', text: '待处理' },
      locked: { class: 'badge-info', text: '已锁定' },
      confirmed: { class: 'badge-info', text: '已确认' },
      completed: { class: 'badge-success', text: '已完成' },
      rejected: { class: 'badge-danger', text: '已拒绝' },
      failed: { class: 'badge-danger', text: '失败' },
      closed: { class: 'badge-gray', text: '已关闭' },
    }
    return statusMap[status] || { class: 'badge-gray', text: status }
  }

  const handleConfirmPayment = async (order: Order) => {
    setActionLoading(true)
    setActionError('')
    try {
      await orderApi.confirmPayment(order.id)
      await fetchOrders()
      setSelectedOrder(null)
    } catch (error: any) {
      setActionError(error.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleConfirmRedemption = async (order: Order) => {
    setActionLoading(true)
    setActionError('')
    try {
      await orderApi.confirmRedemption(order.id)
      await fetchOrders()
      setSelectedOrder(null)
    } catch (error: any) {
      setActionError(error.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleComplete = async (order: Order) => {
    setActionLoading(true)
    setActionError('')
    try {
      await orderApi.complete(order.id)
      await fetchOrders()
      setSelectedOrder(null)
    } catch (error: any) {
      setActionError(error.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReject = async (order: Order, reason: string = '用户取消') => {
    setActionLoading(true)
    setActionError('')
    try {
      await orderApi.reject(order.id, reason)
      await fetchOrders()
      setSelectedOrder(null)
    } catch (error: any) {
      setActionError(error.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
  }

  const handleRetry = async (order: Order) => {
    setActionLoading(true)
    setActionError('')
    try {
      await orderApi.retry(order.id)
      await fetchOrders()
      setSelectedOrder(null)
    } catch (error: any) {
      setActionError(error.response?.data?.error || '操作失败')
    } finally {
      setActionLoading(false)
    }
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">我的订单</h1>
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

      {orders.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-4xl mb-2">📋</p>
          <p className="text-gray-500">暂无订单记录</p>
        </div>
      ) : (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">产品名称</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">类型</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">金额/份额</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">手续费</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">创建时间</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const badge = getStatusBadge(order.status)
                  return (
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
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
                      <td className="py-3 px-4">
                        <div>
                          {order.amount && <p className="text-sm font-medium text-gray-900">¥{order.amount.toFixed(2)}</p>}
                          {order.shares && <p className="text-xs text-gray-500">{order.shares.toFixed(4)} 份</p>}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {order.fee_amount ? `¥${order.fee_amount.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`badge ${badge.class}`}>{badge.text}</span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {new Date(order.created_at).toLocaleString('zh-CN')}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="text-primary-600 hover:text-primary-700 text-sm"
                        >
                          详情
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">订单详情</h2>
              <button
                onClick={() => {
                  setSelectedOrder(null)
                  setActionError('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">产品名称</p>
                  <p className="font-medium text-gray-900">{selectedOrder.product_name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">产品代码</p>
                  <p className="font-medium text-gray-900">{selectedOrder.product_code}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">订单类型</p>
                  <p className="font-medium text-gray-900">
                    {selectedOrder.order_type === 'purchase' ? '申购' : '赎回'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">订单状态</p>
                  <span className={`badge ${getStatusBadge(selectedOrder.status).class}`}>
                    {getStatusBadge(selectedOrder.status).text}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">金额</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.amount ? `¥${selectedOrder.amount.toFixed(2)}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">份额</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.shares ? `${selectedOrder.shares.toFixed(4)} 份` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">单位净值</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.nav ? `¥${selectedOrder.nav.toFixed(4)}` : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">手续费</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.fee_amount ? `¥${selectedOrder.fee_amount.toFixed(2)}` : '-'}
                    </p>
                  </div>
                </div>
              </div>

              {selectedOrder.rejected_reason && (
                <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                  <p className="text-sm text-danger-700">拒绝原因: {selectedOrder.rejected_reason}</p>
                </div>
              )}

              {actionError && (
                <div className="p-3 bg-danger-50 border border-danger-200 rounded-lg">
                  <p className="text-sm text-danger-700">{actionError}</p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              {selectedOrder.order_type === 'purchase' && selectedOrder.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleConfirmPayment(selectedOrder)}
                    disabled={actionLoading}
                    className="btn-primary"
                  >
                    {actionLoading ? '处理中...' : '确认支付'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedOrder)}
                    disabled={actionLoading}
                    className="btn-outline"
                  >
                    取消订单
                  </button>
                </>
              )}

              {selectedOrder.order_type === 'purchase' && selectedOrder.status === 'locked' && (
                <button
                  onClick={() => handleComplete(selectedOrder)}
                  disabled={actionLoading}
                  className="btn-primary"
                >
                  {actionLoading ? '处理中...' : '完成确认（T+1模拟）'}
                </button>
              )}

              {selectedOrder.order_type === 'redemption' && selectedOrder.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleConfirmRedemption(selectedOrder)}
                    disabled={actionLoading}
                    className="btn-primary"
                  >
                    {actionLoading ? '处理中...' : '确认赎回'}
                  </button>
                  <button
                    onClick={() => handleReject(selectedOrder)}
                    disabled={actionLoading}
                    className="btn-outline"
                  >
                    取消赎回
                  </button>
                </>
              )}

              {selectedOrder.order_type === 'redemption' && selectedOrder.status === 'confirmed' && (
                <button
                  onClick={() => handleComplete(selectedOrder)}
                  disabled={actionLoading}
                  className="btn-primary"
                >
                  {actionLoading ? '处理中...' : '完成赎回（入账）'}
                </button>
              )}

              {(selectedOrder.status === 'rejected' || selectedOrder.status === 'failed') && (
                <button
                  onClick={() => handleRetry(selectedOrder)}
                  disabled={actionLoading}
                  className="btn-primary"
                >
                  {actionLoading ? '处理中...' : '重试订单'}
                </button>
              )}

              <button
                onClick={() => {
                  setSelectedOrder(null)
                  setActionError('')
                }}
                className="btn-secondary"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

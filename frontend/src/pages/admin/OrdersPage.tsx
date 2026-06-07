import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import StatusBadge from '../../components/StatusBadge'
import { orders } from '../../api'

export default function OrdersPage() {
  const [orderList, setOrderList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [searchNo, setSearchNo] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const pageSize = 20

  useEffect(() => {
    loadOrders()
  }, [statusFilter, page])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const params: any = { page, page_size: pageSize }
      if (statusFilter) params.status = statusFilter
      if (searchNo) params.order_no = searchNo
      const res: any = await orders.listOrders(params)
      setOrderList(Array.isArray(res) ? res : res?.list || [])
      setTotal(res?.total || 0)
    } catch {
      setOrderList([])
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadOrders()
  }

  const totalPages = Math.ceil(total / pageSize) || 1

  return (
    <div className="space-y-4">
      <h1 className="font-display text-2xl font-bold text-secondary">订单管理</h1>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <form onSubmit={handleSearch} className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchNo}
            onChange={(e) => setSearchNo(e.target.value)}
            placeholder="搜索订单号"
            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm"
          />
        </form>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm bg-white"
        >
          <option value="">全部状态</option>
          <option value="pending">待接单</option>
          <option value="accepted">已接单</option>
          <option value="picking_up">取件中</option>
          <option value="delivering">配送中</option>
          <option value="completed">已完成</option>
          <option value="appealing">申诉中</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left p-3 font-medium text-gray-500">订单号</th>
                  <th className="text-left p-3 font-medium text-gray-500">客户</th>
                  <th className="text-left p-3 font-medium text-gray-500">取件</th>
                  <th className="text-left p-3 font-medium text-gray-500">配送</th>
                  <th className="text-left p-3 font-medium text-gray-500">骑手</th>
                  <th className="text-right p-3 font-medium text-gray-500">金额</th>
                  <th className="text-center p-3 font-medium text-gray-500">状态</th>
                  <th className="text-left p-3 font-medium text-gray-500">创建时间</th>
                </tr>
              </thead>
              <tbody>
                {orderList.map((order) => (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="p-3 font-medium text-secondary">{order.order_no}</td>
                    <td className="p-3 text-gray-600">{order.customer_name || '--'}</td>
                    <td className="p-3 text-gray-600 max-w-[120px] truncate">{order.pickup_address}</td>
                    <td className="p-3 text-gray-600 max-w-[120px] truncate">{order.delivery_address}</td>
                    <td className="p-3 text-gray-600">{order.rider_name || '--'}</td>
                    <td className="p-3 text-right font-medium text-primary">¥{order.total_price}</td>
                    <td className="p-3 text-center"><StatusBadge status={order.status} /></td>
                    <td className="p-3 text-gray-500">{order.created_at?.slice(0, 16)}</td>
                  </tr>
                ))}
                {orderList.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-gray-400">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-3 border-t border-gray-100">
              <span className="text-xs text-gray-500">共 {total} 条</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="px-3 py-1 text-sm text-gray-600">{page}/{totalPages}</span>
                <button
                  onClick={() => setPage(Math.min(totalPages, page + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1 text-sm border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

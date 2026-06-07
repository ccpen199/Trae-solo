import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Eye, Plus } from 'lucide-react'
import { api, buildQuery } from '@/utils/api'

interface Order {
  id: number
  order_no: string
  type: string
  merchant_name: string
  pickup_address: string
  delivery_address: string
  status: string
  rider_name: string | null
  created_at: string
}

interface Merchant {
  id: number
  name: string
}

const typeMap: Record<string, string> = {
  instant: '即时单',
  scheduled: '预约单',
  batch: '批量单',
}

const statusMap: Record<string, { label: string; cls: string }> = {
  pending: { label: '待调度', cls: 'badge-pending' },
  dispatched: { label: '已派单', cls: 'badge-dispatched' },
  picking_up: { label: '取餐中', cls: 'badge-picking_up' },
  delivering: { label: '配送中', cls: 'badge-delivering' },
  completed: { label: '已完成', cls: 'badge-completed' },
  cancelled: { label: '已取消', cls: 'badge-cancelled' },
}

export default function OrderList() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<Order[]>([])
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ type: '', status: '', merchant_id: '', search: '' })
  const pageSize = 15

  useEffect(() => {
    api<{ list: Merchant[] }>('/api/merchants?page_size=100').then((r) => {
      if (r.success) setMerchants(r.data!.list)
    })
  }, [])

  useEffect(() => {
    setLoading(true)
    const q = buildQuery({ ...filters, page, page_size: pageSize })
    api<{ list: Order[]; total: number }>(`/api/orders${q}`).then((r) => {
      if (r.success) {
        setOrders(r.data!.list)
        setTotal(r.data!.total)
      }
      setLoading(false)
    })
  }, [filters, page])

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">搜索结果与订单筛选</h1>
          <p className="text-sm text-gray-500 mt-1">按订单号、商户、状态和配送类型查询结果</p>
        </div>
        <button onClick={() => navigate('/orders/create')} className="btn-accent flex items-center gap-1">
          <Plus size={16} /> 创建订单
        </button>
      </div>

      <div className="card p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <select
            className="select-base"
            value={filters.type}
            onChange={(e) => { setFilters((f) => ({ ...f, type: e.target.value })); setPage(1) }}
          >
            <option value="">全部类型</option>
            <option value="instant">即时单</option>
            <option value="scheduled">预约单</option>
            <option value="batch">批量单</option>
          </select>
          <select
            className="select-base"
            value={filters.status}
            onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1) }}
          >
            <option value="">全部状态</option>
            <option value="pending">待调度</option>
            <option value="dispatched">已派单</option>
            <option value="picking_up">取餐中</option>
            <option value="delivering">配送中</option>
            <option value="completed">已完成</option>
            <option value="cancelled">已取消</option>
          </select>
          <select
            className="select-base"
            value={filters.merchant_id}
            onChange={(e) => { setFilters((f) => ({ ...f, merchant_id: e.target.value })); setPage(1) }}
          >
            <option value="">全部商户</option>
            {merchants.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              className="input-base w-full pl-9"
              placeholder="搜索订单号"
              value={filters.search}
              onChange={(e) => { setFilters((f) => ({ ...f, search: e.target.value })); setPage(1) }}
            />
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">订单号</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">类型</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">商户</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">取货地址</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">送达地址</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">状态</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">骑手</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">创建时间</th>
              <th className="text-left text-xs font-medium text-gray-500 px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-10 text-gray-400">加载中...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-10 text-gray-400">暂无数据</td></tr>
            ) : (
              orders.map((order) => {
                const s = statusMap[order.status] || { label: order.status, cls: 'badge-pending' }
                return (
                  <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                    <td className="px-4 py-3 text-sm font-medium text-primary">{order.order_no}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{typeMap[order.type] || order.type}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.merchant_name || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">{order.pickup_address}</td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-[150px] truncate">{order.delivery_address}</td>
                    <td className="px-4 py-3"><span className={s.cls}>{s.label}</span></td>
                    <td className="px-4 py-3 text-sm text-gray-600">{order.rider_name || '-'}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{order.created_at?.slice(0, 16)}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => navigate(`/orders/${order.id}`)} className="text-primary hover:text-primary-light text-sm flex items-center gap-1">
                        <Eye size={14} /> 查看
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">共 {total} 条</span>
          <div className="flex items-center gap-2">
            <button className="btn-outline px-3 py-1.5 text-xs" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>上一页</button>
            <span className="text-sm text-gray-600">{page} / {totalPages}</span>
            <button className="btn-outline px-3 py-1.5 text-xs" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>下一页</button>
          </div>
        </div>
      )}
    </div>
  )
}

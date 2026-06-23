import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  ShoppingCart,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  CalendarDays,
  User,
  Package,
  MapPin,
  Clock,
  CreditCard,
  Zap,
  Eye,
} from 'lucide-react'
import { StatusBadge } from '@shared/components/StatusBadge'
import { mockOrders } from '@mock/data'
import { cn, formatDate, formatNumber } from '@shared/utils'
import type { SwapOrder } from '@shared/types'

const statusFilters = [
  { value: 'all', label: '全部状态' },
  { value: 'completed', label: '已完成' },
  { value: 'processing', label: '进行中' },
  { value: 'pending', label: '待处理' },
  { value: 'failed', label: '失败' },
  { value: 'cancelled', label: '已取消' },
]

const paymentFilters = [
  { value: 'all', label: '全部支付方式' },
  { value: 'wechat', label: '微信支付' },
  { value: 'alipay', label: '支付宝' },
  { value: 'package', label: '套餐抵扣' },
  { value: 'mixed', label: '混合支付' },
]

export default function OrdersPage() {
  const [searchText, setSearchText] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<SwapOrder | null>(null)
  const pageSize = 6

  const orders = mockOrders

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.order_id.toLowerCase().includes(searchText.toLowerCase()) ||
        order.rider_id.toLowerCase().includes(searchText.toLowerCase()) ||
        order.cabinet_id.toLowerCase().includes(searchText.toLowerCase())
      const matchesStatus =
        statusFilter === 'all' || order.status === statusFilter
      const matchesPayment =
        paymentFilter === 'all' || order.pay_method === paymentFilter
      return matchesSearch && matchesStatus && matchesPayment
    })
  }, [orders, searchText, statusFilter, paymentFilter])

  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize
    return filteredOrders.slice(start, start + pageSize)
  }, [filteredOrders, currentPage])

  const totalPages = Math.ceil(filteredOrders.length / pageSize)

  const stats = useMemo(() => {
    const total = orders.length
    const today = orders.filter((o) => {
      const orderDate = new Date(o.created_at).toDateString()
      return orderDate === new Date().toDateString()
    }).length
    const revenue = orders
      .filter((o) => o.status === 'completed')
      .reduce((sum, o) => sum + o.amount, 0)
    const successRate =
      total > 0
        ? Math.round(
            (orders.filter((o) => o.status === 'completed').length / total) * 100
          )
        : 0
    return { total, today, revenue, successRate }
  }, [orders])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success'
      case 'processing':
        return 'info'
      case 'failed':
        return 'danger'
      case 'cancelled':
        return 'warning'
      case 'pending':
        return 'warning'
      default:
        return 'muted'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return '已完成'
      case 'processing':
        return '进行中'
      case 'failed':
        return '失败'
      case 'cancelled':
        return '已取消'
      case 'pending':
        return '待处理'
      default:
        return status
    }
  }

  const getPaymentText = (method: string) => {
    switch (method) {
      case 'wechat':
        return '微信支付'
      case 'alipay':
        return '支付宝'
      case 'package':
        return '套餐抵扣'
      case 'mixed':
        return '混合支付'
      default:
        return method
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-rajdhani text-white">订单管理</h1>
          <p className="text-cyber-muted text-sm mt-1">
            共 {orders.length} 条订单，{filteredOrders.length} 条符合筛选条件
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-cyber-accent/10 border border-cyber-accent/50 text-cyber-accent rounded-lg hover:bg-cyber-accent/20 transition-colors font-medium text-sm">
            导出数据
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShoppingCart className="w-4 h-4 text-cyber-accent" />
            <span className="text-xs text-cyber-muted">总订单数</span>
          </div>
          <div className="text-2xl font-bold font-rajdhani text-white">
            {stats.total}
          </div>
        </div>
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays className="w-4 h-4 text-cyber-success" />
            <span className="text-xs text-cyber-muted">今日订单</span>
          </div>
          <div className="text-2xl font-bold font-rajdhani text-white">
            {stats.today}
          </div>
        </div>
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CreditCard className="w-4 h-4 text-cyber-warning" />
            <span className="text-xs text-cyber-muted">累计营收</span>
          </div>
          <div className="text-2xl font-bold font-rajdhani text-white">
            ¥{formatNumber(stats.revenue)}
          </div>
        </div>
        <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-cyber-success" />
            <span className="text-xs text-cyber-muted">成功率</span>
          </div>
          <div className="text-2xl font-bold font-rajdhani text-white">
            {stats.successRate}%
          </div>
        </div>
      </div>

      <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg p-4 backdrop-blur">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-cyber-muted" />
            <input
              type="text"
              placeholder="搜索订单号、骑士ID、柜体ID..."
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value)
                setCurrentPage(1)
              }}
              className="w-full h-10 pl-10 pr-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white placeholder-cyber-muted focus:outline-none focus:border-cyber-accent/50 focus:ring-1 focus:ring-cyber-accent/30 transition-all"
            />
          </div>

          {[
            {
              show: showStatusDropdown,
              setShow: setShowStatusDropdown,
              value: statusFilter,
              setValue: setStatusFilter,
              filters: statusFilters,
            },
            {
              show: showPaymentDropdown,
              setShow: setShowPaymentDropdown,
              value: paymentFilter,
              setValue: setPaymentFilter,
              filters: paymentFilters,
            },
          ].map((dropdown, idx) => (
            <div key={idx} className="relative">
              <button
                onClick={() => {
                  dropdown.setShow(!dropdown.show)
                }}
                className="h-10 px-4 bg-cyber-darker/50 border border-cyber-border rounded-lg text-sm text-white flex items-center gap-2 hover:border-cyber-accent/50 transition-colors"
              >
                <Filter className="w-4 h-4 text-cyber-muted" />
                <span>
                  {dropdown.filters.find((f) => f.value === dropdown.value)?.label}
                </span>
                {dropdown.show ? (
                  <ChevronUp className="w-4 h-4 text-cyber-muted" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-cyber-muted" />
                )}
              </button>
              {dropdown.show && (
                <div className="absolute top-full left-0 mt-1 w-36 bg-cyber-dark border border-cyber-border rounded-lg shadow-xl z-10 overflow-hidden">
                  {dropdown.filters.map((filter) => (
                    <button
                      key={filter.value}
                      onClick={() => {
                        dropdown.setValue(filter.value)
                        setCurrentPage(1)
                        dropdown.setShow(false)
                      }}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm hover:bg-cyber-light/30 transition-colors',
                        dropdown.value === filter.value
                          ? 'text-cyber-accent bg-cyber-accent/10'
                          : 'text-gray-300'
                      )}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-cyber-dark/50 border border-cyber-border rounded-lg overflow-hidden backdrop-blur">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-cyber-border">
                <th className="px-5 py-3 text-left text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  订单信息
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  骑士
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  换电柜
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  支付方式
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  金额
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  状态
                </th>
                <th className="px-5 py-3 text-center text-xs font-rajdhani font-semibold text-cyber-muted uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/50">
              {paginatedOrders.map((order, index) => (
                <motion.tr
                  key={order.order_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-cyber-light/20 transition-colors"
                >
                  <td className="px-5 py-4">
                    <div>
                      <p className="font-mono text-sm text-white">
                        {order.order_id}
                      </p>
                      <p className="text-xs text-cyber-muted mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(order.created_at, 'MM-DD HH:mm')}
                      </p>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-white font-mono text-sm">
                      {order.rider_id}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-white font-mono text-sm">
                      {order.cabinet_id}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="text-sm text-white">
                      {getPaymentText(order.pay_method)}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className="font-rajdhani font-bold text-white">
                      ¥{order.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <StatusBadge
                        status={getStatusText(order.status)}
                        color={getStatusColor(order.status)}
                        size="sm"
                        pulse={order.status === 'processing'}
                      />
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-center">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="p-2 text-cyber-muted hover:text-cyber-accent hover:bg-cyber-light/30 rounded-lg transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-5 py-4 border-t border-cyber-border flex items-center justify-between">
            <span className="text-sm text-cyber-muted">
              共 {filteredOrders.length} 条记录，第 {currentPage} / {totalPages} 页
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-cyber-border rounded hover:border-cyber-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    'w-8 h-8 text-sm rounded transition-colors',
                    currentPage === page
                      ? 'bg-cyber-accent text-cyber-darker font-medium'
                      : 'text-gray-300 hover:bg-cyber-light/30'
                  )}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-cyber-border rounded hover:border-cyber-accent/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedOrder && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-lg bg-cyber-dark border-l border-cyber-border z-50 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-cyber-border flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold font-rajdhani text-white">
                  订单详情
                </h2>
                <p className="text-sm text-cyber-muted font-mono">
                  {selectedOrder.order_id}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-2 rounded-lg text-cyber-muted hover:text-white hover:bg-cyber-light/30 transition-colors"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="bg-cyber-darker/50 rounded-lg p-4 text-center">
                <StatusBadge
                  status={getStatusText(selectedOrder.status)}
                  color={getStatusColor(selectedOrder.status)}
                  size="md"
                  pulse={selectedOrder.status === 'processing'}
                />
                <p className="text-2xl font-bold font-rajdhani text-white mt-3">
                  ¥{selectedOrder.amount.toFixed(2)}
                </p>
                <p className="text-xs text-cyber-muted mt-1">
                  {formatDate(selectedOrder.created_at, 'YYYY-MM-DD HH:mm:ss')}
                </p>
              </div>

              <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent flex items-center gap-2">
                  <User className="w-4 h-4" />
                  骑士信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-cyber-muted">骑士ID</span>
                    <p className="text-white mt-0.5 font-mono">
                      {selectedOrder.rider_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-cyber-muted">骑士姓名</span>
                    <p className="text-white mt-0.5">
                      {selectedOrder.rider_name || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  换电柜信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-cyber-muted">柜体ID</span>
                    <p className="text-white mt-0.5 font-mono">
                      {selectedOrder.cabinet_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-cyber-muted">柜体名称</span>
                    <p className="text-white mt-0.5">{selectedOrder.cabinet_name}
                  </p>
                  </div>
                </div>
              </div>

              <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  电池信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-cyber-muted">旧电池</span>
                    <p className="text-white mt-0.5 font-mono">
                      {selectedOrder.old_battery_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-cyber-muted">新电池</span>
                    <p className="text-white mt-0.5 font-mono">
                      {selectedOrder.new_battery_id}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-cyber-muted">换入前电量</span>
                    <p className="text-cyber-warning mt-0.5 font-rajdhani font-bold">
                      {selectedOrder.old_soc}%
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-cyber-muted">换入后电量</span>
                    <p className="text-cyber-success mt-0.5 font-rajdhani font-bold">
                      {selectedOrder.new_soc}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  支付信息
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-xs text-cyber-muted">支付方式</span>
                    <p className="text-white mt-0.5">
                      {getPaymentText(selectedOrder.pay_method)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-cyber-muted">订单金额</span>
                    <p className="text-cyber-accent mt-0.5 font-rajdhani font-bold">
                      ¥{selectedOrder.amount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {selectedOrder.completed_at && (
                <div className="bg-cyber-darker/50 rounded-lg p-4 space-y-3">
                  <h3 className="text-sm font-rajdhani font-semibold text-cyber-accent flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    完成时间
                  </h3>
                  <p className="text-white text-sm">
                    {formatDate(selectedOrder.completed_at, 'YYYY-MM-DD HH:mm:ss')}
                  </p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-cyber-border flex gap-3">
              <button className="flex-1 py-2.5 bg-cyber-accent/10 border border-cyber-accent/50 text-cyber-accent rounded-lg hover:bg-cyber-accent/20 transition-colors font-medium text-sm">
                打印订单
              </button>
              <button className="flex-1 py-2.5 bg-cyber-accent text-cyber-darker rounded-lg hover:bg-cyber-accent/90 transition-colors font-medium text-sm">
                查看完整信息
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ChevronLeft, Ticket, Clock, MapPin, QrCode, RefreshCw } from 'lucide-react'
import useOrderStore from '@/stores/orderStore'
import useAuthStore from '@/stores/authStore'
import { apiPost } from '@/utils/api'

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'paid', label: '已支付' },
  { key: 'credit_held', label: '先看后付' },
  { key: 'refunded', label: '已退款' },
]

const statusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待支付', color: 'text-yellow-400' },
  paid: { label: '已支付', color: 'text-green-400' },
  credit_held: { label: '先看后付', color: 'text-blue-400' },
  refunded: { label: '已退款', color: 'text-carbon-400' },
  failed: { label: '支付失败', color: 'text-wine-500' },
}

const refundCategories = [
  { key: 'schedule_change', label: '日程变更' },
  { key: 'personal', label: '个人原因' },
  { key: 'health', label: '健康原因' },
  { key: 'duplicate', label: '重复购票' },
  { key: 'other', label: '其他' },
]

export default function Orders() {
  const navigate = useNavigate()
  const { user, isLoggedIn } = useAuthStore()
  const { orders, fetchOrders, requestRefund, loading } = useOrderStore()
  const [activeTab, setActiveTab] = useState('all')
  const [refundTicketId, setRefundTicketId] = useState<number | null>(null)
  const [refundReason, setRefundReason] = useState('')
  const [refundCategory, setRefundCategory] = useState('personal')

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders(activeTab === 'all' ? undefined : activeTab)
    }
  }, [isLoggedIn, activeTab, fetchOrders])

  const handleRefund = async () => {
    if (!refundTicketId || !refundReason.trim()) return
    const order = orders.find((o) => o.tickets?.some((t: any) => t.id === refundTicketId))
    if (!order) return
    try {
      await requestRefund(order.id, refundTicketId, refundReason, refundCategory)
      setRefundTicketId(null)
      setRefundReason('')
      fetchOrders(activeTab === 'all' ? undefined : activeTab)
    } catch (e: any) {
      alert(e.message)
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-dark flex items-center justify-center">
        <div className="glass-card p-10 text-center">
          <Ticket size={48} className="mx-auto text-gold-500 mb-4" />
          <p className="text-white mb-6">请先登录查看订单</p>
          <Link to="/login" className="wine-gradient-btn">前往登录</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-dark pb-16">
      <nav className="sticky top-0 z-50 glass-card border-b border-carbon-700/50">
        <div className="container mx-auto px-6 py-4 flex items-center gap-6">
          <button onClick={() => navigate(-1)} className="text-white hover:text-gold-400 transition">
            <ChevronLeft size={24} />
          </button>
          <Link to="/" className="font-display text-xl text-gold-500 tracking-wider">
            TICKET VAULT
          </Link>
          <div className="flex-1" />
          <span className="text-gold-400 text-sm">{user?.realName}</span>
        </div>
      </nav>

      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <h1 className="font-display text-3xl text-gold-400 mb-8">我的订单</h1>

        <div className="flex gap-2 mb-8 overflow-x-auto">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2 rounded-lg text-sm whitespace-nowrap transition ${
                activeTab === tab.key
                  ? 'bg-wine-700 text-white font-medium'
                  : 'bg-carbon-800/50 text-carbon-400 hover:text-white hover:bg-carbon-700/50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center text-carbon-400 py-12">加载中...</div>
        ) : orders.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Ticket size={48} className="mx-auto text-carbon-600 mb-4" />
            <p className="text-carbon-500 mb-6">暂无订单记录</p>
            <Link to="/" className="wine-gradient-btn">去看看演出</Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order: any) => (
              <div key={order.id} className="glass-card overflow-hidden">
                <div className="px-6 py-4 bg-carbon-800/30 flex items-center justify-between border-b border-carbon-700/50">
                  <div className="flex items-center gap-4">
                    <span className="text-carbon-400 text-sm">订单号: {order.orderNo}</span>
                    <span className={`text-sm font-medium ${statusLabels[order.paymentStatus]?.color || 'text-white'}`}>
                      {statusLabels[order.paymentStatus]?.label || order.paymentStatus}
                    </span>
                  </div>
                  <div className="font-display text-2xl text-gold-500">¥{order.totalAmount}</div>
                </div>

                {order.showtime && (
                  <div className="px-6 py-3 border-b border-carbon-700/30">
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-white font-medium">{order.showtime.title}</div>
                      <div className="flex items-center gap-1 text-carbon-400">
                        <MapPin size={14} />
                        {order.showtime.venue}
                      </div>
                      <div className="flex items-center gap-1 text-carbon-400">
                        <Clock size={14} />
                        {new Date(order.showtime.startTime).toLocaleString('zh-CN')}
                      </div>
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.tickets?.map((ticket: any) => {
                      const statusInfo = (
                        <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">有效</span>
                      )
                      return (
                        <div key={ticket.id} className="bg-carbon-800/30 rounded-xl p-4 flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-gold-500 to-wine-700 rounded-lg flex items-center justify-center flex-shrink-0">
                            <QrCode size={24} className="text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-white font-medium">{ticket.zone_name} - {ticket.seat_label}</div>
                            <div className="text-xs text-carbon-500 mt-1 truncate">防伪码: {ticket.antiFakeCode}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {ticket.status === 'valid' ? statusInfo :
                              ticket.status === 'used' ? (
                                <span className="text-xs px-2 py-1 rounded bg-carbon-600 text-carbon-300">已使用</span>
                              ) : ticket.status === 'refunded' ? (
                                <span className="text-xs px-2 py-1 rounded bg-wine-500/20 text-wine-400">已退票</span>
                              ) : null}
                            {ticket.status === 'valid' && order.paymentStatus !== 'refunded' && (
                              <div className="flex gap-2">
                                <Link
                                  to={`/ticket/${ticket.id}`}
                                  className="text-xs px-3 py-1.5 rounded-lg bg-gold-500/20 text-gold-400 hover:bg-gold-500/30 transition"
                                >
                                  电子票
                                </Link>
                                <button
                                  onClick={() => setRefundTicketId(ticket.id)}
                                  className="text-xs px-3 py-1.5 rounded-lg border border-wine-700/50 text-wine-400 hover:bg-wine-800/30 transition"
                                >
                                  退票
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="px-6 py-3 bg-carbon-800/20 border-t border-carbon-700/30 text-xs text-carbon-500 flex items-center gap-4">
                  <RefreshCw size={14} />
                  <span>下单时间: {new Date(order.createdAt).toLocaleString('zh-CN')}</span>
                  {order.paymentMethod === 'credit' && (
                    <span className="text-blue-400">先看后付 · 观演后自动扣款</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {refundTicketId && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="glass-card p-8 w-full max-w-md">
            <h3 className="font-display text-2xl text-gold-400 mb-6">申请退票</h3>
            <div className="mb-6">
              <label className="block text-sm text-carbon-300 mb-2">退票原因</label>
              <select
                value={refundCategory}
                onChange={(e) => setRefundCategory(e.target.value)}
                className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white focus:border-gold-500 outline-none"
              >
                {refundCategories.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className="mb-6">
              <label className="block text-sm text-carbon-300 mb-2">详细说明</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="请详细说明退票原因..."
                rows={4}
                className="w-full bg-carbon-800/50 border border-carbon-600 rounded-lg px-4 py-3 text-white placeholder-carbon-500 focus:border-gold-500 outline-none resize-none"
              />
            </div>
            <div className="bg-carbon-800/30 rounded-lg p-4 mb-6 text-sm">
              <div className="text-carbon-400 mb-2">退款规则</div>
              <div className="flex justify-between text-white mb-1">
                <span>演出前 48 小时以上</span>
                <span>全额退款</span>
              </div>
              <div className="flex justify-between text-white mb-1">
                <span>演出前 24-48 小时</span>
                <span>收取 20% 手续费</span>
              </div>
              <div className="flex justify-between text-wine-400">
                <span>演出前 24 小时内</span>
                <span>不可退票</span>
              </div>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setRefundTicketId(null)}
                className="flex-1 py-3 rounded-lg border border-carbon-600 text-carbon-400 hover:text-white transition"
              >
                取消
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundReason.trim()}
                className="flex-1 wine-gradient-btn disabled:opacity-50"
              >
                确认退票
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState } from 'react'
import { MessageSquare, Clock, AlertCircle, CheckCircle2, XCircle } from 'lucide-react'

type TicketStatus = 'pending' | 'processing' | 'resolved' | 'closed'

interface Ticket {
  id: string
  orderId: string
  title: string
  reporter: string
  reporterRole: 'user' | 'rider' | 'merchant'
  status: TicketStatus
  slaHours: number
  elapsedHours: number
  createdAt: string
}

const tabs: { key: TicketStatus; label: string }[] = [
  { key: 'pending', label: '待处理' },
  { key: 'processing', label: '处理中' },
  { key: 'resolved', label: '已解决' },
  { key: 'closed', label: '已关闭' },
]

const mockTickets: Ticket[] = [
  { id: '1', orderId: 'ORD20240115001', title: '配送超时导致餐品凉了', reporter: '张三', reporterRole: 'user', status: 'pending', slaHours: 4, elapsedHours: 2.5, createdAt: '2024-01-15 14:00' },
  { id: '2', orderId: 'ORD20240115002', title: '骑手态度恶劣', reporter: '李四', reporterRole: 'user', status: 'pending', slaHours: 4, elapsedHours: 3.8, createdAt: '2024-01-15 12:00' },
  { id: '3', orderId: 'ORD20240115003', title: '商家出餐太慢', reporter: '王骑手', reporterRole: 'rider', status: 'processing', slaHours: 8, elapsedHours: 4.2, createdAt: '2024-01-15 10:00' },
  { id: '4', orderId: 'ORD20240114004', title: '配送费计算错误', reporter: '赵商家', reporterRole: 'merchant', status: 'processing', slaHours: 8, elapsedHours: 6.5, createdAt: '2024-01-14 16:00' },
  { id: '5', orderId: 'ORD20240114005', title: '餐品撒漏', reporter: '孙七', reporterRole: 'user', status: 'resolved', slaHours: 4, elapsedHours: 2.0, createdAt: '2024-01-14 14:00' },
  { id: '6', orderId: 'ORD20240113006', title: '取消订单退款未到账', reporter: '周八', reporterRole: 'user', status: 'closed', slaHours: 4, elapsedHours: 3.5, createdAt: '2024-01-13 09:00' },
]

const roleLabels: Record<Ticket['reporterRole'], { label: string; color: string }> = {
  user: { label: '用户', color: '#3B82F6' },
  rider: { label: '骑手', color: '#10B981' },
  merchant: { label: '商户', color: '#F59E0B' },
}

const statusIcons: Record<TicketStatus, typeof Clock> = {
  pending: AlertCircle,
  processing: Clock,
  resolved: CheckCircle2,
  closed: XCircle,
}

const statusColors: Record<TicketStatus, string> = {
  pending: '#F59E0B',
  processing: '#3B82F6',
  resolved: '#10B981',
  closed: '#6B7280',
}

export default function Tickets() {
  const [activeTab, setActiveTab] = useState<TicketStatus>('pending')

  const filtered = mockTickets.filter((t) => t.status === activeTab)

  const getSlaStatus = (ticket: Ticket): 'safe' | 'warning' | 'danger' => {
    const ratio = ticket.elapsedHours / ticket.slaHours
    if (ratio >= 1) return 'danger'
    if (ratio >= 0.75) return 'warning'
    return 'safe'
  }

  return (
    <div className="space-y-6" style={{ backgroundColor: '#0F172A', minHeight: '100vh', padding: '1.5rem' }}>
      <h1 className="text-2xl font-bold text-white">申诉工单</h1>

      <div className="flex items-center gap-2">
        {tabs.map((tab) => {
          const Icon = statusIcons[tab.key]
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'bg-blue-600 text-white' : 'bg-slate-800 text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              <span className={`ml-1 px-1.5 py-0.5 rounded text-xs ${
                activeTab === tab.key ? 'bg-blue-500' : 'bg-slate-700'
              }`}>
                {mockTickets.filter((t) => t.status === tab.key).length}
              </span>
            </button>
          )
        })}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-500">暂无工单</div>
        )}
        {filtered.map((ticket) => {
          const slaStatus = getSlaStatus(ticket)
          const slaPercent = Math.min(100, (ticket.elapsedHours / ticket.slaHours) * 100)
          const StatusIcon = statusIcons[ticket.status]

          return (
            <div key={ticket.id} className="bg-slate-800 rounded-2xl p-5 border border-slate-700/50">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-mono text-gray-400">{ticket.orderId}</span>
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{ backgroundColor: roleLabels[ticket.reporterRole].color + '20', color: roleLabels[ticket.reporterRole].color }}
                    >
                      {roleLabels[ticket.reporterRole].label}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-white">{ticket.title}</h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {ticket.reporter} · {ticket.createdAt}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusIcon className="w-4 h-4" style={{ color: statusColors[ticket.status] }} />
                  <span className="text-sm font-medium" style={{ color: statusColors[ticket.status] }}>
                    {tabs.find((t) => t.key === ticket.status)?.label}
                  </span>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">SLA 响应时效</span>
                  <span className={
                    slaStatus === 'danger' ? 'text-red-400' : slaStatus === 'warning' ? 'text-amber-400' : 'text-green-400'
                  }>
                    {ticket.elapsedHours.toFixed(1)}h / {ticket.slaHours}h
                  </span>
                </div>
                <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${slaPercent}%`,
                      backgroundColor: slaStatus === 'danger' ? '#EF4444' : slaStatus === 'warning' ? '#F59E0B' : '#10B981',
                    }}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4">
                {ticket.status === 'pending' && (
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-colors">
                    开始处理
                  </button>
                )}
                {ticket.status === 'processing' && (
                  <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600/20 text-green-400 hover:bg-green-600/30 transition-colors">
                    标记解决
                  </button>
                )}
                <button className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-700/50 text-gray-400 hover:bg-slate-700 transition-colors">
                  查看详情
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

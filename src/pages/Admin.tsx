import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getDeclarations, getTaxpayers, getTickets, getUsers, getPayments, getAuditLogs } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import { Users, FileText, CreditCard, MessageSquare, Clock, AlertTriangle, CheckCircle, Eye } from 'lucide-react'

export default function Admin() {
  const { user } = useAppStore()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ users: 0, taxpayers: 0, declarations: 0, pendingReview: 0, tickets: 0 })
  const [pendingDeclarations, setPendingDeclarations] = useState<any[]>([])
  const [pendingTickets, setPendingTickets] = useState<any[]>([])
  const [auditLogs, setAuditLogs] = useState<any[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [declRes, taxRes, ticketRes, payRes, logsRes] = await Promise.all([
        getDeclarations(),
        getTaxpayers(),
        getTickets(),
        getPayments(),
        getAuditLogs(),
      ])
      
      if (declRes.success && declRes.data) {
        const decls = declRes.data as any[]
        setStats(s => ({ ...s, declarations: decls.length, pendingReview: decls.filter((d: any) => d.status === 'submitted').length }))
        setPendingDeclarations(decls.filter((d: any) => d.status === 'submitted' || d.status === 'draft').slice(0, 5))
      }
      if (taxRes.success && taxRes.data) setStats(s => ({ ...s, taxpayers: (taxRes.data as any[]).length }))
      if (ticketRes.success && ticketRes.data) {
        const tickets = ticketRes.data as any[]
        setStats(s => ({ ...s, tickets: tickets.length }))
        setPendingTickets(tickets.filter((t: any) => t.status === 'open' || t.status === 'processing').slice(0, 5))
      }
      if (logsRes.success && logsRes.data) setAuditLogs((logsRes.data as any[]).slice(0, 10))
    } catch {}
  }

  const statusLabels: Record<string, { text: string; color: string }> = {
    draft: { text: '草稿', color: 'bg-gray-100 text-gray-600' },
    submitted: { text: '待审核', color: 'bg-amber-100 text-amber-700' },
    approved: { text: '已审核', color: 'bg-green-100 text-green-700' },
    sealed: { text: '已签章', color: 'bg-emerald-100 text-emerald-700' },
    rejected: { text: '已驳回', color: 'bg-red-100 text-red-700' },
  }

  const adminStats = [
    { label: '注册用户', value: stats.taxpayers + 1, icon: Users, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: '纳税人主体', value: stats.taxpayers, icon: FileText, color: 'bg-purple-500', bg: 'bg-purple-50' },
    { label: '待审申报', value: stats.pendingReview, icon: Clock, color: 'bg-amber-500', bg: 'bg-amber-50' },
    { label: '待处理工单', value: stats.tickets, icon: AlertTriangle, color: 'bg-red-500', bg: 'bg-red-50' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            管理后台
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            系统管理员：{user?.real_name}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {adminStats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-5`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-600">{label}</span>
              <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center`}>
                <Icon size={18} className="text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900">{value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">待审核申报</h2>
            <button
              onClick={() => navigate('/declarations')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              全部申报
            </button>
          </div>
          <div className="space-y-3">
            {pendingDeclarations.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                    <FileText size={18} className="text-amber-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900">{d.tax_type_name}</div>
                    <div className="text-xs text-gray-500">{d.period}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">¥{(d.tax_amount || 0).toLocaleString()}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${statusLabels[d.status]?.color}`}>
                    {statusLabels[d.status]?.text}
                  </span>
                  <button
                    onClick={() => navigate(`/declarations/${d.id}`)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            ))}
            {pendingDeclarations.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无待审核申报</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">待处理工单</h2>
            <button
              onClick={() => navigate('/tickets')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              全部工单
            </button>
          </div>
          <div className="space-y-3">
            {pendingTickets.map((t: any) => (
              <div key={t.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                    <MessageSquare size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-gray-900 line-clamp-1">{t.title}</div>
                    <div className="text-xs text-gray-500">{t.category} · {new Date(t.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/tickets`)}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-700"
                >
                  <Eye size={14} />
                </button>
              </div>
            ))}
            {pendingTickets.length === 0 && (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">暂无待处理工单</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">审计日志</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-gray-500">
                <th className="text-left py-2.5 px-3 font-medium">操作时间</th>
                <th className="text-left py-2.5 px-3 font-medium">操作用户</th>
                <th className="text-left py-2.5 px-3 font-medium">操作类型</th>
                <th className="text-left py-2.5 px-3 font-medium">操作详情</th>
                <th className="text-left py-2.5 px-3 font-medium">IP地址</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map((log: any) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="py-2.5 px-3 text-gray-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="py-2.5 px-3 font-medium">{log.username}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs">{log.action}</span>
                  </td>
                  <td className="py-2.5 px-3 text-gray-600 max-w-xs truncate">{log.details}</td>
                  <td className="py-2.5 px-3 text-gray-500 font-mono text-xs">{log.ip_address}</td>
                </tr>
              ))}
              {auditLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">暂无审计日志</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useAppStore } from '@/lib/store'
import { getDeclarations, getPayments, getPolicyRecommendations, getInvoices, getTickets } from '@/lib/api'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  CreditCard,
  FileCheck,
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Shield,
  Users,
  Clock,
} from 'lucide-react'

export default function Dashboard() {
  const { user, currentTaxpayer } = useAppStore()
  const navigate = useNavigate()
  const role = user?.role || 'taxpayer'
  const [stats, setStats] = useState({ declarations: 0, payments: 0, invoices: 0, pending: 0, tickets: 0 })
  const [recommendations, setRecommendations] = useState<any[]>([])
  const [recentDeclarations, setRecentDeclarations] = useState<any[]>([])

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [declRes, payRes, invRes, policyRes, ticketRes] = await Promise.all([
        getDeclarations(),
        getPayments('status=pending'),
        getInvoices(),
        getPolicyRecommendations(),
        getTickets(),
      ])
      if (declRes.success && declRes.data) {
        const decls = declRes.data as any[]
        setStats(s => ({ ...s, declarations: decls.length }))
        setRecentDeclarations(decls.slice(0, 5))
        const pending = decls.filter((d: any) => d.status === 'draft' || d.status === 'submitted').length
        setStats(s => ({ ...s, pending }))
      }
      if (payRes.success && payRes.data) setStats(s => ({ ...s, payments: (payRes.data as any[]).length }))
      if (invRes.success && invRes.data) setStats(s => ({ ...s, invoices: (invRes.data as any[]).length }))
      if (policyRes.success && policyRes.data) setRecommendations((policyRes.data as any[]).slice(0, 3))
      if (ticketRes.success && ticketRes.data) setStats(s => ({ ...s, tickets: (ticketRes.data as any[]).length }))
    } catch {}
  }

  const statusLabels: Record<string, { text: string; color: string }> = {
    draft: { text: '草稿', color: 'bg-gray-100 text-gray-600' },
    submitted: { text: '已提交', color: 'bg-blue-100 text-blue-700' },
    approved: { text: '已审核', color: 'bg-green-100 text-green-700' },
    sealed: { text: '已签章', color: 'bg-emerald-100 text-emerald-700' },
    rejected: { text: '已驳回', color: 'bg-red-100 text-red-700' },
  }

  const roleLabels: Record<string, string> = { taxpayer: '纳税人', admin: '税务管理员', agent: '第三方代理' }
  const roleDescLabels: Record<string, string> = {
    taxpayer: '办理申报、缴款、发票等涉税业务',
    admin: '审核申报、发票，处理工单，管理政策',
    agent: '代理纳税人办理各项涉税业务',
  }

  const taxpayerStats = [
    { label: '申报记录', value: stats.declarations, icon: FileText, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: '待缴税款', value: stats.payments, icon: CreditCard, color: 'bg-amber-500', bg: 'bg-amber-50' },
    { label: '发票数量', value: stats.invoices, icon: FileCheck, color: 'bg-purple-500', bg: 'bg-purple-50' },
    { label: '待办事项', value: stats.pending, icon: AlertTriangle, color: 'bg-red-500', bg: 'bg-red-50' },
  ]

  const adminStats = [
    { label: '待审申报', value: stats.pending, icon: FileText, color: 'bg-blue-500', bg: 'bg-blue-50' },
    { label: '待缴税款', value: stats.payments, icon: CreditCard, color: 'bg-amber-500', bg: 'bg-amber-50' },
    { label: '互动工单', value: stats.tickets, icon: Clock, color: 'bg-purple-500', bg: 'bg-purple-50' },
    { label: '待办事项', value: stats.pending + stats.tickets, icon: AlertTriangle, color: 'bg-red-500', bg: 'bg-red-50' },
  ]

  const displayStats = role === 'admin' ? adminStats : taxpayerStats

  const quickActions = role === 'admin'
    ? [
        { label: '审核申报', icon: FileText, color: 'bg-blue-500 hover:bg-blue-600', path: '/declarations' },
        { label: '处理工单', icon: Clock, color: 'bg-purple-500 hover:bg-purple-600', path: '/tickets' },
        { label: '政策管理', icon: BookOpen, color: 'bg-emerald-500 hover:bg-emerald-600', path: '/policies' },
      ]
    : role === 'agent'
    ? [
        { label: '代办申报', icon: FileText, color: 'bg-blue-500 hover:bg-blue-600', path: '/declarations' },
        { label: '代开发票', icon: FileCheck, color: 'bg-purple-500 hover:bg-purple-600', path: '/invoices' },
        { label: '代申请证明', icon: CheckCircle2, color: 'bg-emerald-500 hover:bg-emerald-600', path: '/certificates' },
      ]
    : [
        { label: '新建申报', icon: FileText, color: 'bg-blue-500 hover:bg-blue-600', path: '/declarations' },
        { label: '申请发票', icon: FileCheck, color: 'bg-purple-500 hover:bg-purple-600', path: '/invoices' },
        { label: '申请证明', icon: CheckCircle2, color: 'bg-emerald-500 hover:bg-emerald-600', path: '/certificates' },
      ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.real_name}，您好
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
              role === 'admin' ? 'bg-blue-100 text-blue-700' : role === 'agent' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {role === 'admin' && <Shield size={10} />}
              {roleLabels[role]}
            </span>
            <span className="ml-2">{roleDescLabels[role]}</span>
          </p>
        </div>
        {currentTaxpayer && (
          <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg text-sm">
            <Users size={14} />
            <span>当前主体：{currentTaxpayer.name}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {displayStats.map(({ label, value, icon: Icon, color, bg }) => (
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {role === 'admin' ? '待审申报' : '最近申报'}
            </h2>
            <button
              onClick={() => navigate('/declarations')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              查看全部 <ArrowRight size={14} />
            </button>
          </div>
          {recentDeclarations.length > 0 ? (
            <div className="space-y-3">
              {recentDeclarations.map((d: any) => (
                <div key={d.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                      <FileText size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-900">{d.tax_type_name}</div>
                      <div className="text-xs text-gray-500">{d.period} · {d.decl_type === 'regular' ? '定期申报' : d.decl_type === 'zero' ? '零申报' : '更正申报'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-900">¥{(d.tax_amount || 0).toLocaleString()}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${statusLabels[d.status]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {statusLabels[d.status]?.text || d.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <FileText size={32} className="mx-auto mb-2 opacity-50" />
              <p className="text-sm">暂无申报记录</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">政策推荐</h2>
            <button
              onClick={() => navigate('/policies')}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              更多 <ArrowRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {recommendations.map((p: any) => (
              <div key={p.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-start gap-2">
                  <BookOpen size={14} className="text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-gray-900 line-clamp-1">{p.title}</div>
                    <div className="text-xs text-gray-500 mt-1">{p.match_reason || p.source}</div>
                  </div>
                </div>
              </div>
            ))}
            {recommendations.length === 0 && (
              <div className="text-center py-6 text-gray-400 text-sm">暂无推荐政策</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {quickActions.map(({ label, icon: Icon, color, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`${color} text-white rounded-xl p-5 flex items-center gap-3 transition-colors`}
          >
            <Icon size={20} />
            <span className="font-medium">{label}</span>
            <ArrowRight size={16} className="ml-auto" />
          </button>
        ))}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Droplets, Zap, Car, Home, Wrench, CreditCard } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import StatusBadge from '@/components/StatusBadge'

const typeIcons: Record<string, React.ElementType> = {
  '物业费': Home, '水费': Droplets, '电费': Zap, '停车费': Car, '维修基金': Wrench,
}

const typeColors: Record<string, string> = {
  '物业费': 'bg-emerald-50 text-emerald-600', '水费': 'bg-blue-50 text-blue-600',
  '电费': 'bg-amber-50 text-amber-600', '停车费': 'bg-purple-50 text-purple-600', '维修基金': 'bg-red-50 text-red-600',
}

const mockPayments = [
  { id: '1', type: '物业费', amount: 1280.00, period: '2026年6月', dueDate: '2026-06-30', status: 'unpaid' as const },
  { id: '2', type: '水费', amount: 85.60, period: '2026年5月', dueDate: '2026-06-15', status: 'unpaid' as const },
  { id: '3', type: '电费', amount: 234.80, period: '2026年5月', dueDate: '2026-06-15', status: 'overdue' as const },
  { id: '4', type: '停车费', amount: 350.00, period: '2026年6月', dueDate: '2026-06-30', status: 'unpaid' as const },
  { id: '5', type: '物业费', amount: 1280.00, period: '2026年5月', dueDate: '2026-05-31', status: 'paid' as const },
  { id: '6', type: '水费', amount: 72.30, period: '2026年4月', dueDate: '2026-05-15', status: 'paid' as const },
  { id: '7', type: '维修基金', amount: 200.00, period: '2026年Q2', dueDate: '2026-06-30', status: 'unpaid' as const },
]

export default function PaymentList() {
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const navigate = useNavigate()

  const filtered = mockPayments.filter((p) => {
    if (statusFilter && p.status !== statusFilter) return false
    if (typeFilter && p.type !== typeFilter) return false
    return true
  })

  const handlePay = (id: string) => {
    navigate(`/payments/${id}/receipt`)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="物业缴费" subtitle="查看和管理物业账单" />

      <div className="flex flex-wrap gap-3">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">全部状态</option>
          <option value="unpaid">未缴</option>
          <option value="paid">已缴</option>
          <option value="overdue">逾期</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 px-3 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
          <option value="">全部类型</option>
          <option value="物业费">物业费</option>
          <option value="水费">水费</option>
          <option value="电费">电费</option>
          <option value="停车费">停车费</option>
          <option value="维修基金">维修基金</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const Icon = typeIcons[p.type] || CreditCard
          return (
            <div key={p.id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeColors[p.type]}`}>
                  <Icon size={20} />
                </div>
                <StatusBadge status={p.status} />
              </div>
              <div className="mb-1">
                <span className="text-2xl font-bold text-slate-800">¥{p.amount.toFixed(2)}</span>
              </div>
              <div className="text-sm text-slate-500">{p.type} · {p.period}</div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                <span className="text-xs text-slate-400">截止 {p.dueDate}</span>
                {p.status !== 'paid' && (
                  <button
                    onClick={() => handlePay(p.id)}
                    className="h-8 px-4 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors flex items-center gap-1"
                  >
                    <CreditCard size={14} />缴费
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

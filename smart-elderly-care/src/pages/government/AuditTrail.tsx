import { useState } from 'react'
import { ChevronDown, ChevronRight, ShieldCheck, Clock, AlertTriangle } from 'lucide-react'
import StatusBadge from '../../components/StatusBadge'
import { subsidyRecords } from '../../data/mockData'
import type { SubsidyRecord, AuditEntry } from '../../types'

const typeOptions = [
  { value: '', label: '全部类型' },
  { value: 'pension', label: '养老金' },
  { value: 'disability', label: '失能补贴' },
  { value: 'nursing', label: '护理补贴' },
  { value: 'medical', label: '医疗救助' },
]

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'approved', label: '已批准' },
  { value: 'pending', label: '审核中' },
  { value: 'disbursed', label: '已发放' },
  { value: 'rejected', label: '已拒绝' },
]

const subsidyTypeMap: Record<string, string> = {
  pension: '养老金',
  disability: '失能补贴',
  nursing: '护理补贴',
  medical: '医疗救助',
}

function AuditTimeline({ entries }: { entries: AuditEntry[] }) {
  return (
    <div className="ml-6 pl-6 border-l-2 border-slate-200 space-y-4 py-2">
      {entries.map((entry) => (
        <div key={entry.id} className="relative">
          <div className="absolute -left-[1.85rem] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-white shadow-sm" />
          <div className="bg-slate-50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-slate-800">{entry.action}</span>
              <span className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString('zh-CN')}</span>
            </div>
            <div className="text-xs text-slate-500">操作人: {entry.operator}</div>
            <div className="text-xs text-slate-400 mt-0.5">{entry.details}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AuditTrail() {
  const [typeFilter, setTypeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const filtered = subsidyRecords.filter((r: SubsidyRecord) => {
    if (typeFilter && r.type !== typeFilter) return false
    if (statusFilter && r.status !== statusFilter) return false
    if (dateFrom && r.appliedDate < dateFrom) return false
    if (dateTo && r.appliedDate > dateTo) return false
    return true
  })

  const totalDisbursed = subsidyRecords
    .filter((r) => r.status === 'disbursed')
    .reduce((sum, r) => sum + r.amount, 0)
  const pendingCount = subsidyRecords.filter((r) => r.status === 'pending').length
  const anomalyCount = subsidyRecords.filter(
    (r) => r.auditTrail.some((e) => e.details.includes('驳回') || e.details.includes('补正'))
  ).length

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">补贴资金穿透式审计</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-slate-500 font-medium">总发放金额</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">¥{totalDisbursed.toLocaleString()}</span>
        </div>
        <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <span className="text-sm text-slate-500 font-medium">待审核数</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{pendingCount}</span>
        </div>
        <div className="bg-red-50 border border-red-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <span className="text-sm text-slate-500 font-medium">异常记录数</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{anomalyCount}</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {typeOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {statusOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
          <span className="text-sm text-slate-400">至</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium w-8"></th>
                <th className="px-4 py-3 font-medium">编号</th>
                <th className="px-4 py-3 font-medium">申请人</th>
                <th className="px-4 py-3 font-medium">金额</th>
                <th className="px-4 py-3 font-medium">类型</th>
                <th className="px-4 py-3 font-medium">状态</th>
                <th className="px-4 py-3 font-medium">申请日期</th>
                <th className="px-4 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r: SubsidyRecord) => (
                <>
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-25">
                    <td className="px-4 py-3">
                      <button onClick={() => toggleExpand(r.id)} className="text-slate-400 hover:text-slate-600">
                        {expandedIds.has(r.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600 font-mono">{r.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{r.elderName}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 font-medium">¥{r.amount.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{subsidyTypeMap[r.type]}</td>
                    <td className="px-4 py-3"><StatusBadge status={r.status} type="subsidy" /></td>
                    <td className="px-4 py-3 text-sm text-slate-400">{r.appliedDate}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleExpand(r.id)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                      >
                        审计详情
                      </button>
                    </td>
                  </tr>
                  {expandedIds.has(r.id) && (
                    <tr key={`${r.id}-detail`}>
                      <td colSpan={8} className="px-4 py-3 bg-slate-25">
                        <AuditTimeline entries={r.auditTrail} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

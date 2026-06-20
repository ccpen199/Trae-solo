import { useState } from 'react'
import { MessageSquareWarning, Loader, CheckCircle2, X } from 'lucide-react'
import StatusBadge from '../../components/StatusBadge'
import { complaintRecords } from '../../data/mockData'
import type { ComplaintRecord } from '../../types'

const statusFilterOptions = [
  { value: '', label: '全部状态' },
  { value: 'submitted', label: '已提交' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已闭环' },
]

const complaintTypeMap: Record<string, string> = {
  service_quality: '服务质量',
  subsidy: '补贴问题',
  facility: '设施问题',
  personnel: '人员问题',
}

export default function ComplaintManagement() {
  const [statusFilter, setStatusFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedComplaint, setSelectedComplaint] = useState<ComplaintRecord | null>(null)
  const [resolutionText, setResolutionText] = useState('')

  const filtered = complaintRecords.filter((c: ComplaintRecord) => {
    if (statusFilter && c.status !== statusFilter) return false
    return true
  })

  const totalComplaints = complaintRecords.length
  const processingCount = complaintRecords.filter((c) => c.status === 'processing' || c.status === 'submitted').length
  const closedRate = Math.round(
    (complaintRecords.filter((c) => c.status === 'resolved' || c.status === 'closed').length / complaintRecords.length) * 100
  )

  const handleProcess = (complaint: ComplaintRecord) => {
    setSelectedComplaint(complaint)
    setResolutionText(complaint.resolution || '')
    setModalOpen(true)
  }

  const handleSubmit = () => {
    if (!resolutionText.trim()) return
    setModalOpen(false)
    setResolutionText('')
    setSelectedComplaint(null)
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-800">服务质量投诉闭环管理</h2>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-orange-50 border border-orange-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquareWarning className="w-5 h-5 text-orange-600" />
            <span className="text-sm text-slate-500 font-medium">本月投诉数</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{totalComplaints}</span>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Loader className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-slate-500 font-medium">处理中</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{processingCount}</span>
        </div>
        <div className="bg-green-50 border border-green-100 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <span className="text-sm text-slate-500 font-medium">已闭环率</span>
          </div>
          <span className="text-2xl font-bold text-slate-800">{closedRate}%</span>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="p-5 border-b border-slate-100">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-200 rounded-lg bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            {statusFilterOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs text-slate-500 border-b border-slate-100">
                <th className="px-5 py-3 font-medium">编号</th>
                <th className="px-5 py-3 font-medium">投诉人</th>
                <th className="px-5 py-3 font-medium">类型</th>
                <th className="px-5 py-3 font-medium">内容摘要</th>
                <th className="px-5 py-3 font-medium">状态</th>
                <th className="px-5 py-3 font-medium">提交时间</th>
                <th className="px-5 py-3 font-medium">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c: ComplaintRecord) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-25">
                  <td className="px-5 py-3 text-sm text-slate-600 font-mono">{c.id}</td>
                  <td className="px-5 py-3 text-sm text-slate-700">{c.elderName}</td>
                  <td className="px-5 py-3 text-sm text-slate-600">{complaintTypeMap[c.type]}</td>
                  <td className="px-5 py-3 text-sm text-slate-500 max-w-xs truncate">{c.content}</td>
                  <td className="px-5 py-3"><StatusBadge status={c.status} type="complaint" /></td>
                  <td className="px-5 py-3 text-sm text-slate-400">{c.createdAt.slice(0, 10)}</td>
                  <td className="px-5 py-3">
                    {(c.status === 'submitted' || c.status === 'processing') && (
                      <button
                        onClick={() => handleProcess(c)}
                        className="text-xs text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-md bg-blue-50 hover:bg-blue-100 transition-colors"
                      >
                        处理
                      </button>
                    )}
                    {(c.status === 'resolved' || c.status === 'closed') && c.resolution && (
                      <span className="text-xs text-green-600 cursor-help" title={c.resolution}>
                        已回复
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && selectedComplaint && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">处理投诉 - {selectedComplaint.id}</h3>
              <button
                onClick={() => { setModalOpen(false); setSelectedComplaint(null); setResolutionText('') }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <div className="text-sm text-slate-500 mb-1">投诉人</div>
                <div className="text-sm text-slate-800">{selectedComplaint.elderName}</div>
              </div>
              <div>
                <div className="text-sm text-slate-500 mb-1">投诉内容</div>
                <div className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">{selectedComplaint.content}</div>
              </div>
              <div>
                <label className="text-sm text-slate-500 mb-1 block">处理意见</label>
                <textarea
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
                  placeholder="请输入处理意见..."
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
              <button
                onClick={() => { setModalOpen(false); setSelectedComplaint(null); setResolutionText('') }}
                className="px-4 py-2 text-sm text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={!resolutionText.trim()}
              >
                提交处理
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

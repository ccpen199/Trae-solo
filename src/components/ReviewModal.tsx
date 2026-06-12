import React from 'react'
import { X, Loader2, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useToastStore } from '@/store'

interface PendingJob { id: string; title: string; institution_name: string; salary: string; risk_score: number; risk_reasons: string[] }
interface ReviewModalProps { open: boolean; onClose: () => void; jobs: PendingJob[]; loading: boolean; onAction?: () => void }

const riskColor = (score: number) => {
  if (score >= 80) return 'text-red-600 bg-red-100'
  if (score >= 50) return 'text-amber-600 bg-amber-100'
  return 'text-green-600 bg-green-100'
}

export default function ReviewModal({ open, onClose, jobs, loading, onAction }: ReviewModalProps) {
  const { toast } = useToastStore()
  const [actionId, setActionId] = React.useState<string | null>(null)
  const [localJobs, setLocalJobs] = React.useState<PendingJob[]>([])

  React.useEffect(() => { if (jobs) setLocalJobs(jobs) }, [jobs])

  if (!open) return null

  const handleApprove = async (id: string) => {
    setActionId(id)
    try {
      await apiFetch(`/admin/jobs/${id}/review`, { method: 'PUT', body: JSON.stringify({ status: 'active', review_note: '审核通过，信息真实有效' }) })
      toast('success', '岗位已通过审核')
      setLocalJobs(prev => prev.filter(j => j.id !== id))
      if (onAction) onAction()
    } catch (err: any) { toast('error', err.message || '操作失败') } finally { setActionId(null) }
  }

  const handleReject = async (id: string) => {
    setActionId(id)
    try {
      await apiFetch(`/admin/jobs/${id}/review`, { method: 'PUT', body: JSON.stringify({ status: 'rejected', review_note: '信息存在虚假风险，不予通过' }) })
      toast('success', '岗位已驳回')
      setLocalJobs(prev => prev.filter(j => j.id !== id))
      if (onAction) onAction()
    } catch (err: any) { toast('error', err.message || '操作失败') } finally { setActionId(null) }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-lg font-bold">虚假岗位复核</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-teal-600" /></div>
          ) : localJobs.length === 0 ? (
            <div className="text-center py-12 text-stone-500"><CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-2" />暂无待复核岗位</div>
          ) : (
            <div className="space-y-3">
              {localJobs.map((job) => (
                <div key={job.id} className="p-4 bg-stone-50 rounded-lg border border-stone-200">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-stone-800">{job.title}</span>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${riskColor(job.risk_score)}`}>风险分 {job.risk_score}</span>
                      </div>
                      <div className="text-sm text-stone-500 mb-2">{job.institution_name} · {job.salary}</div>
                      <div className="flex flex-wrap gap-1">
                        {job.risk_reasons.map((reason, i) => (
                          <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-red-50 text-red-600 rounded text-xs">
                            <AlertTriangle className="w-3 h-3" /> {reason}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button onClick={() => handleApprove(job.id)} disabled={actionId === job.id} className="px-3 py-1.5 bg-green-100 text-green-700 rounded text-sm font-medium hover:bg-green-200 disabled:opacity-50 flex items-center gap-1 transition-colors">
                        {actionId === job.id && actionId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />} 通过
                      </button>
                      <button onClick={() => handleReject(job.id)} disabled={actionId === job.id} className="px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm font-medium hover:bg-red-200 disabled:opacity-50 flex items-center gap-1 transition-colors">
                        {actionId === job.id && actionId === job.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />} 驳回
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-2 border border-stone-300 rounded-lg text-sm font-medium hover:bg-stone-50 transition-colors">关闭</button>
      </div>
    </div>
  )
}

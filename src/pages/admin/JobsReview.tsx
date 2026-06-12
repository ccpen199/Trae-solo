import { useState, useEffect } from 'react'
import { apiFetch } from '@/lib/api'
import { Check, X, AlertTriangle, Shield, Loader2 } from 'lucide-react'

interface JobReview {
  id: string
  title: string
  department: string
  institution: string
  riskScore: number
  status: '待审核' | '已通过' | '已拒绝'
  submittedAt: string
}

function mapStatus(s: string): JobReview['status'] {
  if (s === 'active') return '已通过'
  if (s === 'pending') return '待审核'
  return '已拒绝'
}

function RiskBadge({ score }: { score: number }) {
  const style = score >= 70
    ? 'bg-red-100 text-red-700'
    : score >= 40
      ? 'bg-amber-100 text-amber-700'
      : 'bg-green-100 text-green-700'
  const label = score >= 70 ? '高风险' : score >= 40 ? '中风险' : '低风险'
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-medium ${style}`}>
      {label} ({score})
    </span>
  )
}

export default function JobsReview() {
  const [jobs, setJobs] = useState<JobReview[]>([])
  const [filterStatus, setFilterStatus] = useState<string>('全部')
  const [loading, setLoading] = useState(true)

  const fetchJobs = async () => {
    setLoading(true)
    try {
      const res = await apiFetch<{ success: boolean; data: any[] }>('/admin/jobs/review')
      if (res.success && res.data) {
        setJobs(
          res.data.map((item) => ({
            id: String(item.id),
            title: item.title,
            department: item.department,
            institution: item.institution_name,
            riskScore: item.ai_risk_score ?? 0,
            status: mapStatus(item.status),
            submittedAt: item.created_at ? item.created_at.split('T')[0] : '-',
          }))
        )
      }
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchJobs()
  }, [])

  const filtered = filterStatus === '全部'
    ? jobs
    : jobs.filter((j) => j.status === filterStatus)

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const status = action === 'approve' ? 'active' : 'rejected'
    try {
      await apiFetch(`/admin/jobs/${id}/review`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      })
      setJobs((prev) =>
        prev.map((j) => j.id === id ? { ...j, status: action === 'approve' ? '已通过' : '已拒绝' } : j)
      )
    } catch {
    }
  }

  return (
    <div>
      <h1 className="font-heading text-2xl font-bold mb-6">岗位审核</h1>

      <div className="flex gap-2 mb-6">
        {['全部', '待审核', '已通过', '已拒绝'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterStatus === status ? 'bg-teal-700 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">岗位名称</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">科室</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">机构</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">AI风险评分</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">审核状态</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">提交时间</th>
                <th className="text-left px-5 py-3 text-sm font-medium text-stone-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((job) => (
                <tr key={job.id} className="border-b border-stone-100 hover:bg-stone-50">
                  <td className="px-5 py-3 text-sm font-medium text-stone-800">{job.title}</td>
                  <td className="px-5 py-3 text-sm text-stone-600">{job.department}</td>
                  <td className="px-5 py-3 text-sm text-stone-600">{job.institution}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-1.5">
                      {job.riskScore >= 70 && <AlertTriangle className="w-4 h-4 text-red-500" />}
                      {job.riskScore < 40 && <Shield className="w-4 h-4 text-green-500" />}
                      <RiskBadge score={job.riskScore} />
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      job.status === '已通过' ? 'bg-green-100 text-green-700' :
                      job.status === '已拒绝' ? 'bg-red-100 text-red-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {job.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-stone-500">{job.submittedAt}</td>
                  <td className="px-5 py-3">
                    {job.status === '待审核' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleAction(job.id, 'approve')} className="p-1.5 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors" title="通过">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleAction(job.id, 'reject')} className="p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors" title="拒绝">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                    {job.status !== '待审核' && (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

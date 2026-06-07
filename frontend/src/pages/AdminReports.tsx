import { useState, useEffect } from 'react'
import { getContentReports, reviewContentReport } from '../api/client'
import { formatTime } from '../hooks'

const statusOptions = [
  { value: 'pending', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
]

interface ReportItem {
  id: string
  content_type: 'news' | 'video' | 'comment'
  content_preview: string
  reason: string
  status: string
  ai_screening_result?: string
  ai_risk_score?: number
  created_at: string
  reporter?: string
}

export default function AdminReports() {
  const [reports, setReports] = useState<ReportItem[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState('pending')
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({})

  const loadReports = async () => {
    setLoading(true)
    try {
      const res = await getContentReports({ status, limit: 50 })
      setReports(res.data?.items ?? res.data ?? [])
    } catch {
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadReports() }, [status])

  const handleReview = async (id: string, action: 'approve' | 'reject') => {
    try {
      await reviewContentReport(id, {
        action,
        note: reviewNote[id] || '',
      })
      setReports((prev) => prev.filter((r) => r.id !== id))
    } catch {}
  }

  const getRiskBadge = (score?: number) => {
    if (score == null) return null
    if (score >= 0.8) return <span className="badge-hot">高风险</span>
    if (score >= 0.5) return <span className="badge-pending">中风险</span>
    return <span className="badge-verified">低风险</span>
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'news': return '📰 资讯'
      case 'video': return '🎬 视频'
      case 'comment': return '💬 评论'
      default: return type
    }
  }

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">内容审核</h2>

      <div className="flex gap-2 mb-6">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setStatus(opt.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              status === opt.value
                ? 'bg-primary text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : reports.length > 0 ? (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="card p-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">{getTypeLabel(report.content_type)}</span>
                  {getRiskBadge(report.ai_risk_score)}
                  {report.ai_screening_result && (
                    <span className="badge bg-purple-50 text-purple-700">🤖 AI筛选</span>
                  )}
                </div>
                <span className="text-xs text-gray-400">{formatTime(report.created_at)}</span>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-1">内容预览</p>
                <p className="text-sm text-gray-800 bg-gray-50 p-3 rounded-lg line-clamp-3">
                  {report.content_preview}
                </p>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-500 mb-1">举报原因</p>
                <p className="text-sm text-red-600">{report.reason}</p>
              </div>

              {report.ai_screening_result && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 mb-1">AI筛选结果</p>
                  <p className="text-sm text-purple-700 bg-purple-50 p-2 rounded">{report.ai_screening_result}</p>
                </div>
              )}

              {report.status === 'pending' && (
                <div className="pt-3 border-t border-gray-100">
                  <input
                    value={reviewNote[report.id] || ''}
                    onChange={(e) => setReviewNote((prev) => ({ ...prev, [report.id]: e.target.value }))}
                    placeholder="审核备注（可选）"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm mb-3 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReview(report.id, 'approve')}
                      className="btn-secondary text-sm flex-1"
                    >
                      ✓ 通过
                    </button>
                    <button
                      onClick={() => handleReview(report.id, 'reject')}
                      className="bg-red-500 hover:bg-red-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-all flex-1"
                    >
                      ✗ 拒绝
                    </button>
                  </div>
                </div>
              )}

              {report.status !== 'pending' && (
                <div className="pt-3 border-t border-gray-100">
                  <span className={`badge ${report.status === 'approved' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {report.status === 'approved' ? '✓ 已通过' : '✗ 已拒绝'}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="card p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">📋</p>
          <p>暂无{statusOptions.find((s) => s.value === status)?.label}的举报</p>
        </div>
      )}
    </div>
  )
}

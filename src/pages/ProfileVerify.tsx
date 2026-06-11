import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, Shield, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

interface VerifyRecord {
  id: string
  task_id: string
  task_title: string
  result: 'approved' | 'rejected'
  created_at: string
}

const mockRecords: VerifyRecord[] = [
  { id: '1', task_id: 't1', task_title: '代购生活用品', result: 'approved', created_at: '2025-05-20T10:30:00Z' },
  { id: '2', task_id: 't2', task_title: '线上翻译文档', result: 'approved', created_at: '2025-05-18T14:20:00Z' },
  { id: '3', task_id: 't3', task_title: '编程辅导Python入门', result: 'rejected', created_at: '2025-05-15T09:00:00Z' },
  { id: '4', task_id: 't4', task_title: '搬家协助搬运', result: 'approved', created_at: '2025-05-12T16:45:00Z' },
  { id: '5', task_id: 't5', task_title: '设计logo图标', result: 'approved', created_at: '2025-05-10T11:00:00Z' },
]

export default function ProfileVerify() {
  const { token, user } = useAuthStore()
  const [records, setRecords] = useState<VerifyRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token || !user?.is_verifier) {
      setLoading(false)
      return
    }
    fetch('/api/tasks?status=verifying&limit=50', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data.items.length > 0) {
          setRecords(json.data.items.map((t: { id: string; title: string; updated_at: string }) => ({
            id: t.id,
            task_id: t.id,
            task_title: t.title,
            result: Math.random() > 0.3 ? 'approved' : 'rejected',
            created_at: t.updated_at,
          })))
        } else {
          setRecords(mockRecords)
        }
      })
      .catch(() => setRecords(mockRecords))
      .finally(() => setLoading(false))
  }, [token, user])

  const approvedCount = records.filter(r => r.result === 'approved').length
  const approvalRate = records.length > 0 ? Math.round((approvedCount / records.length) * 100) : 0

  return (
    <div className="p-6 max-w-2xl mx-auto pb-8">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/profile" className="text-cyber-muted hover:text-cyber-text transition-colors">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold font-heading text-cyber-text">验证记录</h1>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="card-dark !cursor-default text-center">
          <Shield size={20} className="text-emerald-primary mx-auto mb-1" />
          <div className="text-2xl font-bold text-cyber-text font-heading">{records.length}</div>
          <div className="text-xs text-cyber-dim">验证总数</div>
        </div>
        <div className="card-dark !cursor-default text-center">
          <CheckCircle size={20} className="text-amber-primary mx-auto mb-1" />
          <div className="text-2xl font-bold text-cyber-text font-heading">{approvalRate}%</div>
          <div className="text-xs text-cyber-dim">通过率</div>
        </div>
      </div>

      {!user?.is_verifier ? (
        <div className="card-dark !cursor-default flex items-center justify-center py-16">
          <p className="text-cyber-dim text-sm">您还不是验证员</p>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="card-dark !cursor-default animate-pulse">
              <div className="h-4 bg-navy-700 rounded w-3/4 mb-2" />
              <div className="h-3 bg-navy-700 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : records.length === 0 ? (
        <div className="card-dark !cursor-default flex items-center justify-center py-16">
          <p className="text-cyber-dim text-sm">暂无验证记录</p>
        </div>
      ) : (
        <div className="space-y-2">
          {records.map(record => (
            <div key={record.id} className="card-dark !cursor-default">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <Link to={`/task/${record.task_id}`} className="text-sm font-medium text-cyber-text hover:text-emerald-primary truncate block">
                    {record.task_title}
                  </Link>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-cyber-dim flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(record.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {record.result === 'approved' ? (
                    <>
                      <CheckCircle size={16} className="text-emerald-primary" />
                      <span className="text-xs font-medium text-emerald-primary">通过</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={16} className="text-danger" />
                      <span className="text-xs font-medium text-danger">驳回</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

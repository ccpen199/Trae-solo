import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Eye, Loader2 } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import api from '../../utils/api'

dayjs.locale('zh-cn')

export default function AdminReviewPage() {
  const [contents, setContents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending')
  const [rejectReason, setRejectReason] = useState('')
  const [rejectingId, setRejectingId] = useState<number | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchPending = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/contents', { params: { review_status: 'pending', limit: 20 } })
      if (res.data.code === 0) {
        setContents(res.data.data.list || res.data.data || [])
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  const fetchHistory = async () => {
    setLoading(true)
    try {
      const res = await api.get('/api/admin/contents', { params: { review_status: 'approved,rejected', limit: 20 } })
      if (res.data.code === 0) {
        setContents(res.data.data.list || res.data.data || [])
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'pending') fetchPending()
    else fetchHistory()
  }, [activeTab])

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/api/admin/contents/${id}/review`, { action: 'approve' })
      showToast('已通过审核', 'success')
      fetchPending()
    } catch { showToast('操作失败', 'error') }
  }

  const handleReject = async (id: number) => {
    if (!rejectReason.trim()) {
      showToast('请输入拒绝原因', 'error')
      return
    }
    try {
      await api.put(`/api/admin/contents/${id}/review`, { action: 'reject', reason: rejectReason.trim() })
      showToast('已拒绝', 'success')
      setRejectingId(null)
      setRejectReason('')
      fetchPending()
    } catch { showToast('操作失败', 'error') }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div>
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">审核管理</h1>

      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'pending' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          待审核
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'history' ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-100'
          }`}
        >
          审核历史
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      ) : contents.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {activeTab === 'pending' ? '没有待审核的内容' : '暂无审核记录'}
        </div>
      ) : (
        <div className="space-y-4">
          {contents.map(content => (
            <div key={content.id} className="card p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="badge bg-gray-100 text-gray-600">
                      {content.content_type === 'article' ? '文章' : content.content_type === 'note' ? '笔记' : '动态'}
                    </span>
                    {content.city && <span className="badge bg-orange-50 text-orange-600">{content.city}</span>}
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{content.title}</h3>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-2">{content.summary || ''}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{content.author_nickname}</span>
                    <span>{dayjs(content.created_at).format('YYYY-MM-DD HH:mm')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  {activeTab === 'pending' ? (
                    <>
                      <button onClick={() => handleApprove(content.id)} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors">
                        <CheckCircle className="w-5 h-5" />
                      </button>
                      <button onClick={() => setRejectingId(rejectingId === content.id ? null : content.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <XCircle className="w-5 h-5" />
                      </button>
                    </>
                  ) : (
                    <span className={`badge ${
                      content.review_status === 'approved' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                    }`}>
                      {content.review_status === 'approved' ? '已通过' : '已拒绝'}
                    </span>
                  )}
                </div>
              </div>
              {rejectingId === content.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="请输入拒绝原因..."
                    className="input-field resize-none mb-2"
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleReject(content.id)} className="btn-danger text-xs">确认拒绝</button>
                    <button onClick={() => { setRejectingId(null); setRejectReason('') }} className="btn-secondary text-xs">取消</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

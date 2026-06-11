import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'
import type { CommunityPost } from '@/types'

export default function CommunityReview() {
  const [selected, setSelected] = useState<CommunityPost | null>(null)
  const [items, setItems] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
    total: 0,
  })

  const fetchData = async () => {
    try {
      const [pendingRes, allRes] = await Promise.all([
        api.community.reviewList({ pageSize: 50 }),
        api.community.posts({ pageSize: 1 }),
      ])
      setItems(pendingRes.list || [])
      if (pendingRes.list && pendingRes.list.length > 0) {
        setSelected(pendingRes.list[0])
      }
      setStats({
        pending: pendingRes.total || 0,
        approved: 0,
        rejected: 0,
        total: allRes.total || 0,
      })
    } catch (err) {
      console.error('Failed to fetch review data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.community.review(id, {
        review_status: action === 'approve' ? 'approved' : 'rejected',
      })
      setItems((prev) => prev.filter((i) => i.id !== id))
      if (selected?.id === id) {
        const remaining = items.filter((i) => i.id !== id)
        setSelected(remaining.length > 0 ? remaining[0] : null)
      }
      setStats((prev) => ({
        ...prev,
        pending: prev.pending - 1,
        [action === 'approve' ? 'approved' : 'rejected']: prev[action === 'approve' ? 'approved' : 'rejected'] + 1,
      }))
    } catch (err) {
      console.error('Failed to review post:', err)
    }
  }

  const statCards = [
    { label: '待审核', value: stats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
    { label: '已通过', value: stats.approved, icon: CheckCircle, color: 'text-emerald-600 bg-emerald-50' },
    { label: '已拒绝', value: stats.rejected, icon: XCircle, color: 'text-red-600 bg-red-50' },
    { label: '总数量', value: stats.total, icon: AlertTriangle, color: 'text-blue-600 bg-blue-50' },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="内容审核" subtitle="审核社区动态内容" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', s.color)}>
              <s.icon size={20} />
            </div>
            <div>
              <div className="text-xl font-bold text-slate-800">{loading ? '...' : s.value}</div>
              <div className="text-xs text-slate-500">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-800">待审核 ({items.length})</h3>
          </div>
          <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            {loading ? (
              <div className="p-8 text-center text-slate-400 text-sm">加载中...</div>
            ) : items.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-sm">暂无待审核内容</div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelected(item)}
                  className={cn(
                    'px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors',
                    selected?.id === item.id ? 'bg-emerald-50 border-l-2 border-l-emerald-500' : 'hover:bg-slate-50'
                  )}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-slate-700">{item.author_name || '匿名用户'}</span>
                    <span className="text-xs text-slate-400">{item.created_at?.slice(0, 16) || ''}</span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2">{item.content}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6">
          {selected ? (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium">
                  {(selected.author_name || 'U')[0]}
                </div>
                <div>
                  <div className="font-medium text-slate-800">{selected.author_name || '匿名用户'}</div>
                  <div className="text-xs text-slate-400">{selected.created_at?.slice(0, 16) || ''}</div>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{selected.content}</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleAction(selected.id, 'approve')}
                  className="h-10 px-6 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors flex items-center gap-2"
                >
                  <CheckCircle size={16} />通过
                </button>
                <button
                  onClick={() => handleAction(selected.id, 'reject')}
                  className="h-10 px-6 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors flex items-center gap-2"
                >
                  <XCircle size={16} />拒绝
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-slate-400 text-sm">请选择待审核内容</div>
          )}
        </div>
      </div>
    </div>
  )
}

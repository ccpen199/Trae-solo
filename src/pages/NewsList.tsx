import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { api, apiPut } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { Plus, Search, Send } from 'lucide-react'

interface NewsItem {
  id: number
  title: string
  category: string
  source: string
  status: string
  view_count: number
  created_at: string
}

const statusMap: Record<string, { label: string; cls: string }> = {
  draft: { label: '草稿', cls: 'bg-slate-100 text-slate-600' },
  pending: { label: '待审核', cls: 'bg-yellow-100 text-yellow-700' },
  published: { label: '已发布', cls: 'bg-green-100 text-green-700' },
  rejected: { label: '已驳回', cls: 'bg-red-100 text-red-700' },
}

const categories = ['交通', '文旅', '教育', '科技', '环保', '民生', '其他']
const statuses = [
  { value: '', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'pending', label: '待审核' },
  { value: 'published', label: '已发布' },
  { value: 'rejected', label: '已驳回' },
]

export default function NewsList() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [list, setList] = useState<NewsItem[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(10)
  const [category, setCategory] = useState('')
  const [status, setStatus] = useState('')
  const [keyword, setKeyword] = useState('')
  const [loading, setLoading] = useState(true)
  const [auditModal, setAuditModal] = useState<{ id: number; open: boolean }>({ id: 0, open: false })
  const [auditStatus, setAuditStatus] = useState('published')
  const [auditComment, setAuditComment] = useState('')
  const [auditLoading, setAuditLoading] = useState(false)
  const [submitReviewLoading, setSubmitReviewLoading] = useState<number | null>(null)

  const fetchNews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) })
      if (category) params.set('category', category)
      if (status) params.set('status', status)
      if (keyword) params.set('keyword', keyword)
      const res = await api<{ list: NewsItem[]; total: number }>(`/news?${params}`)
      if (res.success) {
        setList(res.data.list)
        setTotal(res.data.total)
      }
    } catch { void 0 } finally {
      setLoading(false)
    }
  }, [page, pageSize, category, status, keyword])

  useEffect(() => { fetchNews() }, [fetchNews])

  const handleSearch = () => {
    setPage(1)
    fetchNews()
  }

  const handleSubmitReview = async (id: number) => {
    setSubmitReviewLoading(id)
    try {
      const res = await apiPut(`/news/${id}/submit-review`, {})
      if (res.success) {
        fetchNews()
      }
    } catch { void 0 } finally {
      setSubmitReviewLoading(null)
    }
  }

  const handleAudit = async () => {
    if (!user) return
    setAuditLoading(true)
    try {
      const res = await apiPut(`/news/${auditModal.id}/status`, {
        status: auditStatus,
        auditor_id: user.id,
        comment: auditComment,
      })
      if (res.success) {
        setAuditModal({ id: 0, open: false })
        setAuditComment('')
        fetchNews()
      }
    } catch { void 0 } finally {
      setAuditLoading(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  if (loading && list.length === 0) {
    return <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">全部分类</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1) }}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {statuses.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索标题或内容..."
              className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
            <button onClick={handleSearch} className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              <Search size={18} />
            </button>
          </div>

          <button
            onClick={() => navigate('/news/create')}
            className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
          >
            <Plus size={16} />
            新建资讯
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="text-left py-3 px-4">ID</th>
              <th className="text-left py-3 px-4">标题</th>
              <th className="text-left py-3 px-4">分类</th>
              <th className="text-left py-3 px-4">来源</th>
              <th className="text-left py-3 px-4">状态</th>
              <th className="text-right py-3 px-4">浏览量</th>
              <th className="text-left py-3 px-4">创建时间</th>
              <th className="text-left py-3 px-4">操作</th>
            </tr>
          </thead>
          <tbody>
            {list.map((item) => (
              <tr key={item.id} className="border-t hover:bg-slate-50">
                <td className="py-3 px-4 text-slate-500">{item.id}</td>
                <td className="py-3 px-4 text-slate-800 font-medium max-w-[240px] truncate">{item.title}</td>
                <td className="py-3 px-4 text-slate-600">{item.category}</td>
                <td className="py-3 px-4 text-slate-600">{item.source}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusMap[item.status]?.cls || 'bg-slate-100 text-slate-600'}`}>
                    {statusMap[item.status]?.label || item.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-slate-600">{item.view_count}</td>
                <td className="py-3 px-4 text-slate-500 text-xs">{item.created_at?.slice(0, 16)?.replace('T', ' ')}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigate(`/news/edit/${item.id}`)}
                      className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                    >
                      编辑
                    </button>
                    {item.status === 'draft' && (
                      <button
                        onClick={() => handleSubmitReview(item.id)}
                        disabled={submitReviewLoading === item.id}
                        className="flex items-center gap-1 text-green-600 hover:text-green-800 text-xs font-medium disabled:opacity-50"
                      >
                        <Send size={12} />
                        {submitReviewLoading === item.id ? '提交中' : '提交审核'}
                      </button>
                    )}
                    {(item.status === 'pending' || user?.role === 'admin') && (
                      <button
                        onClick={() => setAuditModal({ id: item.id, open: true })}
                        className="text-orange-600 hover:text-orange-800 text-xs font-medium"
                      >
                        审核
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-400">暂无数据</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-lg shadow p-4">
          <span className="text-sm text-slate-500">共 {total} 条</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-slate-100"
            >
              上一页
            </button>
            <span className="text-sm text-slate-600">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 border rounded text-sm disabled:opacity-40 hover:bg-slate-100"
            >
              下一页
            </button>
          </div>
        </div>
      )}

      {auditModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">审核资讯 #{auditModal.id}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">审核结果</label>
                <select
                  value={auditStatus}
                  onChange={(e) => setAuditStatus(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="published">通过</option>
                  <option value="rejected">驳回</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">备注</label>
                <textarea
                  value={auditComment}
                  onChange={(e) => setAuditComment(e.target.value)}
                  rows={3}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setAuditModal({ id: 0, open: false })} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-100">取消</button>
              <button onClick={handleAudit} disabled={auditLoading} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
                {auditLoading ? '提交中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

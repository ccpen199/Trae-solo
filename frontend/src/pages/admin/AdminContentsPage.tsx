import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Star, Pin, Trash2, Eye, Loader2 } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import api from '../../utils/api'

dayjs.locale('zh-cn')

export default function AdminContentsPage() {
  const [contents, setContents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: '',
    review_status: '',
    content_type: '',
    q: '',
  })
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchContents = async (p = 1) => {
    setLoading(true)
    try {
      const params: any = { page: p, pageSize: 20 }
      if (filters.status) params.status = filters.status
      if (filters.review_status) params.review_status = filters.review_status
      if (filters.content_type) params.content_type = filters.content_type
      if (filters.q) params.q = filters.q
      const res = await api.get('/api/admin/contents', { params })
      if (res.data.code === 0) {
        setContents(res.data.data.list || res.data.data || [])
        setTotal(res.data.data.total || 0)
      }
      setPage(p)
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchContents() }, [])

  const handleFeature = async (id: number, featured: boolean) => {
    try {
      await api.put(`/api/admin/contents/${id}`, { is_featured: !featured })
      showToast(featured ? '已取消推荐' : '已推荐', 'success')
      fetchContents(page)
    } catch { showToast('操作失败', 'error') }
  }

  const handlePin = async (id: number, pinned: boolean) => {
    try {
      await api.put(`/api/admin/contents/${id}`, { is_pinned: !pinned })
      showToast(pinned ? '已取消置顶' : '已置顶', 'success')
      fetchContents(page)
    } catch { showToast('操作失败', 'error') }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除此内容吗？')) return
    try {
      await api.delete(`/api/admin/contents/${id}`)
      showToast('已删除', 'success')
      fetchContents(page)
    } catch { showToast('删除失败', 'error') }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const statusLabels: Record<string, string> = {
    published: '已发布', draft: '草稿', archived: '已归档',
  }
  const reviewLabels: Record<string, string> = {
    pending: '待审核', approved: '已通过', rejected: '已拒绝',
  }

  return (
    <div>
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">内容管理</h1>

      <div className="card mb-4">
        <div className="p-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="搜索标题或作者..."
              className="input-field pl-9"
              onKeyDown={(e) => e.key === 'Enter' && fetchContents()}
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="input-field w-auto"
          >
            <option value="">全部状态</option>
            <option value="published">已发布</option>
            <option value="draft">草稿</option>
            <option value="archived">已归档</option>
          </select>
          <select
            value={filters.review_status}
            onChange={(e) => setFilters({ ...filters, review_status: e.target.value })}
            className="input-field w-auto"
          >
            <option value="">全部审核</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>
          <select
            value={filters.content_type}
            onChange={(e) => setFilters({ ...filters, content_type: e.target.value })}
            className="input-field w-auto"
          >
            <option value="">全部类型</option>
            <option value="article">文章</option>
            <option value="note">笔记</option>
            <option value="post">动态</option>
          </select>
          <button onClick={() => fetchContents()} className="btn-primary">搜索</button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">标题</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">作者</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">类型</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">审核</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">日期</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {contents.map(content => (
                  <tr key={content.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <Link to={`/content/${content.id}`} className="text-primary-600 hover:underline font-medium line-clamp-1">
                        {content.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{content.author_nickname}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-gray-100 text-gray-600">
                        {content.content_type === 'article' ? '文章' : content.content_type === 'note' ? '笔记' : '动态'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${content.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
                        {statusLabels[content.status] || content.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${
                        content.review_status === 'approved' ? 'bg-green-50 text-green-600' :
                        content.review_status === 'rejected' ? 'bg-red-50 text-red-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>
                        {reviewLabels[content.review_status] || content.review_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{dayjs(content.created_at).format('MM-DD HH:mm')}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Link to={`/content/${content.id}`} className="p-1 text-gray-400 hover:text-primary-600"><Eye className="w-4 h-4" /></Link>
                        <button onClick={() => handleFeature(content.id, content.is_featured)} className={`p-1 ${content.is_featured ? 'text-yellow-500' : 'text-gray-400 hover:text-yellow-500'}`}><Star className="w-4 h-4" /></button>
                        <button onClick={() => handlePin(content.id, content.is_pinned)} className={`p-1 ${content.is_pinned ? 'text-primary-600' : 'text-gray-400 hover:text-primary-600'}`}><Pin className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(content.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {contents.length === 0 && (
            <div className="p-8 text-center text-gray-400 text-sm">暂无内容</div>
          )}
        </div>
      )}
    </div>
  )
}

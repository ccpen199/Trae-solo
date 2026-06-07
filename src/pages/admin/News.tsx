import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { api } from '@/lib/api'
import AdminLayout from './AdminLayout'

interface Category {
  id: number
  name: string
}

interface NewsItem {
  id: number
  title: string
  content: string
  summary: string
  category_id: number
  author: string
  is_published: number
  view_count: number
  published_at: string
  created_at: string
}

interface NewsList {
  list: NewsItem[]
  total: number
  page: number
  pageSize: number
}

const emptyForm = { title: '', content: '', summary: '', category_id: 0, author: '', is_published: 1 }

export default function News() {
  const [newsList, setNewsList] = useState<NewsList>({ list: [], total: 0, page: 1, pageSize: 10 })
  const [categories, setCategories] = useState<Category[]>([])
  const [page, setPage] = useState(1)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(false)

  const fetchNews = async (p = 1) => {
    try {
      const data = await api.get<NewsList>(`/news?page=${p}&pageSize=10&include_unpublished=1`)
      setNewsList(data)
      setPage(p)
    } catch {}
  }

  const fetchCategories = async () => {
    try {
      const data = await api.get<Category[]>('/categories?type=news')
      setCategories(data)
    } catch {}
  }

  useEffect(() => {
    fetchNews()
    fetchCategories()
  }, [])

  const handleCreate = async () => {
    if (!form.title.trim()) return
    setLoading(true)
    try {
      await api.post('/news', form)
      setShowForm(false)
      setForm(emptyForm)
      fetchNews(page)
    } catch {} finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除此新闻？')) return
    try {
      await api.del(`/news/${id}`)
      fetchNews(page)
    } catch {}
  }

  const totalPages = Math.ceil(newsList.total / newsList.pageSize)

  const categoryName = (cid: number) => categories.find(c => c.id === cid)?.name ?? '-'

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">新闻管理</h1>
        <button
          onClick={() => { setForm(emptyForm); setShowForm(true) }}
          className="flex items-center gap-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          <Plus className="w-4 h-4" /> 创建新闻
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">创建新闻</h2>
              <button onClick={() => setShowForm(false)}><X className="w-5 h-5 text-gray-400" /></button>
            </div>
            <div className="space-y-3">
              <input
                placeholder="标题"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                placeholder="内容"
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                rows={6}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <input
                placeholder="摘要"
                value={form.summary}
                onChange={e => setForm(f => ({ ...f, summary: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <select
                value={form.category_id}
                onChange={e => setForm(f => ({ ...f, category_id: Number(e.target.value) }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value={0}>选择分类</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <input
                placeholder="作者"
                value={form.author}
                onChange={e => setForm(f => ({ ...f, author: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.is_published === 1}
                  onChange={e => setForm(f => ({ ...f, is_published: e.target.checked ? 1 : 0 }))}
                  className="rounded"
                />
                发布
              </label>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowForm(false)} className="px-4 py-2 border rounded-lg text-sm">取消</button>
                <button onClick={handleCreate} disabled={loading} className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:opacity-50">
                  {loading ? '提交中...' : '创建'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3">标题</th>
              <th className="text-left px-4 py-3">分类</th>
              <th className="text-left px-4 py-3">作者</th>
              <th className="text-left px-4 py-3">状态</th>
              <th className="text-right px-4 py-3">浏览量</th>
              <th className="text-left px-4 py-3">发布时间</th>
              <th className="text-left px-4 py-3">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {newsList.list.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800 max-w-xs truncate">{item.title}</td>
                <td className="px-4 py-3 text-gray-600">{categoryName(item.category_id)}</td>
                <td className="px-4 py-3 text-gray-600">{item.author || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    item.is_published ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {item.is_published ? '已发布' : '草稿'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">{item.view_count}</td>
                <td className="px-4 py-3 text-gray-600">{item.published_at ? new Date(item.published_at).toLocaleDateString() : '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button className="text-blue-600 hover:text-blue-800"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {newsList.list.length === 0 && <p className="text-center text-gray-400 py-8">暂无数据</p>}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-4">
          <button onClick={() => fetchNews(page - 1)} disabled={page <= 1} className="px-3 py-1.5 border rounded text-sm disabled:opacity-40">上一页</button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button onClick={() => fetchNews(page + 1)} disabled={page >= totalPages} className="px-3 py-1.5 border rounded text-sm disabled:opacity-40">下一页</button>
        </div>
      )}
    </AdminLayout>
  )
}

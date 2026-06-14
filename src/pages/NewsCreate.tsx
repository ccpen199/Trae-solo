import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { api, apiPost, apiPut } from '@/lib/api'
import { useAuth } from '@/stores/auth'
import { ArrowLeft } from 'lucide-react'

const categories = ['交通', '文旅', '教育', '科技', '环保', '民生', '其他']
const sourceOptions = [
  { value: 'manual', label: '手动录入' },
  { value: 'crawl', label: '爬虫采集' },
]

interface NewsData {
  title: string
  summary: string | null
  content: string | null
  category: string
  source: string
  tags: string | null
}

export default function NewsCreate() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { user } = useAuth()
  const isEdit = Boolean(id)

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('其他')
  const [source, setSource] = useState('manual')
  const [tags, setTags] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isEdit && id) {
      setLoading(true)
      api<NewsData>(`/news/${id}`).then((res) => {
        if (res.success) {
          const d = res.data
          setTitle(d.title || '')
          setSummary(d.summary || '')
          setContent(d.content || '')
          setCategory(d.category || '其他')
          setSource(d.source || 'manual')
          setTags(d.tags || '')
        }
      }).finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      const payload = {
        title,
        summary: summary || undefined,
        content: content || undefined,
        category,
        source,
        tags: tags || undefined,
        author_id: user?.id,
      }
      const res = isEdit
        ? await apiPut(`/news/${id}`, payload)
        : await apiPost('/news', payload)
      if (res.success) {
        navigate('/news')
      }
    } catch { void 0 } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-slate-500">加载中...</div>
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/news')} className="p-2 hover:bg-slate-200 rounded-lg">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <h2 className="text-lg font-semibold text-slate-800">{isEdit ? '编辑资讯' : '新建资讯'}</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">标题 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="请输入标题"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">摘要</label>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="请输入摘要"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">内容</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="请输入内容"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">分类</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {categories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">来源</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {sourceOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-600 mb-1">标签</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            placeholder="多个标签用逗号分隔"
          />
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <button type="button" onClick={() => navigate('/news')} className="px-4 py-2 text-sm text-slate-600 border rounded-lg hover:bg-slate-100">取消</button>
          <button type="submit" disabled={saving || !title.trim()} className="px-6 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {saving ? '提交中...' : '提交'}
          </button>
        </div>
      </form>
    </div>
  )
}

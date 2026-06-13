import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'
import { apiFetch } from '@/lib/api'

const categories = [
  { value: 'policy', label: '政策解读' },
  { value: 'education', label: '继续教育' },
  { value: 'news', label: '行业动态' },
]

export default function CommunityNew() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('医疗行业交流新帖')
  const [category, setCategory] = useState('policy')
  const [tags, setTags] = useState('医聘通,经验分享')
  const [content, setContent] = useState('分享一条医疗招聘、执业成长或机构管理相关经验。')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setMessage('')
    setSubmitting(true)
    try {
      const res = await apiFetch<{ success: boolean; data: any }>('/community/posts', {
        method: 'POST',
        body: JSON.stringify({
          title,
          category,
          content,
          tags: tags.split(',').map((tag) => tag.trim()).filter(Boolean),
        }),
      })
      if (res.success && res.data?.id) {
        setMessage('发布成功')
        navigate(`/community/${res.data.id}`)
        return
      }
      setMessage('发布已提交')
    } catch (error: any) {
      setMessage(error.message || '发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <button
        type="button"
        onClick={() => navigate('/community')}
        className="mb-6 flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-teal-700"
      >
        <ArrowLeft className="h-4 w-4" /> 返回社区
      </button>

      <form onSubmit={handleSubmit} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h1 className="font-heading text-2xl font-bold text-stone-800">发布帖子</h1>
          <p className="mt-1 text-sm text-stone-500">提交后会进入社区资讯列表和详情页</p>
        </div>

        <label className="mb-4 block">
          <span className="mb-1 block text-sm font-medium text-stone-700">标题</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="h-11 w-full rounded-lg border border-stone-300 px-3 text-sm focus:ring-2 focus:ring-teal-500"
            placeholder="请输入帖子标题"
          />
        </label>

        <div className="mb-4 grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">分类</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="h-11 w-full rounded-lg border border-stone-300 px-3 text-sm focus:ring-2 focus:ring-teal-500"
            >
              {categories.map((item) => (
                <option key={item.value} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-700">标签</span>
            <input
              value={tags}
              onChange={(event) => setTags(event.target.value)}
              className="h-11 w-full rounded-lg border border-stone-300 px-3 text-sm focus:ring-2 focus:ring-teal-500"
              placeholder="用英文逗号分隔"
            />
          </label>
        </div>

        <label className="mb-5 block">
          <span className="mb-1 block text-sm font-medium text-stone-700">正文</span>
          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={8}
            className="w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm focus:ring-2 focus:ring-teal-500"
            placeholder="请输入正文内容"
          />
        </label>

        {message && <div className="mb-4 rounded-lg bg-stone-50 px-3 py-2 text-sm text-stone-600">{message}</div>}

        <button
          type="submit"
          disabled={submitting || !title.trim() || !content.trim()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:opacity-50"
        >
          <Send className="h-4 w-4" /> {submitting ? '发布中...' : '提交发布'}
        </button>
      </form>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send, Tag, FileText, Check } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useAuthStore, useToastStore } from '@/store'

const categories = [
  { value: 'policy', label: '政策解读', icon: '🏥' },
  { value: 'education', label: '继续教育', icon: '📚' },
  { value: 'news', label: '行业动态', icon: '🔬' },
]

const hotTags = ['职称评审', '多点执业', '医患关系', '规培', '科研', '薪酬', '科室管理', '护理', '医技', '药学']

const MAX_TITLE_LENGTH = 50
const MAX_CONTENT_LENGTH = 2000
const MAX_TAGS = 5

export default function CommunityCreate() {
  const { user } = useAuthStore()
  const { toast } = useToastStore()
  const navigate = useNavigate()

  const [category, setCategory] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  const handleTagToggle = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else if (selectedTags.length < MAX_TAGS) {
      setSelectedTags([...selectedTags, tag])
    }
  }

  const handleSubmit = async () => {
    if (!user) {
      toast('error', '登录后可发布帖子')
      return
    }
    if (!category) {
      toast('error', '请选择分类')
      return
    }
    if (!title.trim()) {
      toast('error', '请输入标题')
      return
    }
    if (!content.trim()) {
      toast('error', '请输入正文内容')
      return
    }

    setSubmitting(true)
    try {
      const res = await apiFetch<{ success: boolean; data: { id: string } }>('/community/posts', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          content: content.trim(),
          category,
          tags: selectedTags,
        }),
      })
      if (res.success && res.data?.id) {
        toast('success', '发布成功')
        setTimeout(() => {
          navigate(`/community/${res.data.id}`)
        }, 2000)
      }
    } catch (error: any) {
      toast('error', error.message || '发布失败')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user) {
    return (
      <div className="container mx-auto max-w-3xl px-4 py-16 text-center">
        <FileText className="mx-auto mb-4 h-16 w-16 text-stone-300" />
        <h2 className="mb-2 font-heading text-xl font-bold text-stone-600">登录后可发布帖子</h2>
        <p className="mb-6 text-stone-500">请先登录后再发布内容</p>
        <Link
          to="/login"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-teal-700 px-6 text-sm font-medium text-white transition-colors hover:bg-teal-800"
        >
          去登录
        </Link>
      </div>
    )
  }

  if (showPreview) {
    const categoryLabel = categories.find((c) => c.value === category)?.label || ''
    return (
      <div className="container mx-auto max-w-3xl px-4 py-8">
        <button
          type="button"
          onClick={() => setShowPreview(false)}
          className="mb-6 flex items-center gap-1 text-sm text-stone-500 transition-colors hover:text-teal-700"
        >
          <ArrowLeft className="h-4 w-4" /> 返回编辑
        </button>

        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <span className="rounded bg-teal-50 px-2 py-1 text-xs font-medium text-teal-700">
              {categoryLabel}
            </span>
            {selectedTags.map((tag) => (
              <span key={tag} className="rounded bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700">
                #{tag}
              </span>
            ))}
          </div>
          <h1 className="mb-4 font-heading text-2xl font-bold text-stone-800">{title || '无标题'}</h1>
          <div className="whitespace-pre-wrap text-stone-600">{content || '无内容'}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate('/community')}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-stone-500 transition-colors hover:bg-stone-100 hover:text-teal-700"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="font-heading text-2xl font-bold text-stone-800">发布帖子</h1>
      </div>

      <div className="rounded-lg border border-stone-200 bg-white p-6">
        <div className="mb-6">
          <label className="mb-2 block text-sm font-medium text-stone-700">
            选择分类 <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            {categories.map((cat) => {
              const active = category === cat.value
              return (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-all ${
                    active
                      ? 'border-teal-500 bg-teal-50 text-teal-700'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-sm font-medium">{cat.label}</span>
                  {active && <Check className="h-4 w-4" />}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="flex items-center gap-1 text-sm font-medium text-stone-700">
              <Tag className="h-4 w-4" /> 话题标签
            </label>
            <span className="text-xs text-stone-400">
              {selectedTags.length}/{MAX_TAGS}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {hotTags.map((tag) => {
              const active = selectedTags.includes(tag)
              const disabled = !active && selectedTags.length >= MAX_TAGS
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  disabled={disabled}
                  className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? 'bg-teal-600 text-white'
                      : disabled
                      ? 'cursor-not-allowed bg-stone-100 text-stone-300'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  #{tag}
                </button>
              )
            })}
          </div>
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-stone-700">
              标题 <span className="text-red-500">*</span>
            </label>
            <span className={`text-xs ${title.length > MAX_TITLE_LENGTH ? 'text-red-500' : 'text-stone-400'}`}>
              {title.length}/{MAX_TITLE_LENGTH}
            </span>
          </div>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH))}
            placeholder="请输入帖子标题"
            className="h-11 w-full rounded-lg border border-stone-300 px-3 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
          />
        </div>

        <div className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <label className="text-sm font-medium text-stone-700">
              正文 <span className="text-red-500">*</span>
            </label>
            <span className={`text-xs ${content.length > MAX_CONTENT_LENGTH ? 'text-red-500' : 'text-stone-400'}`}>
              {content.length}/{MAX_CONTENT_LENGTH}
            </span>
          </div>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_CONTENT_LENGTH))}
            placeholder="分享你的见解、经验或提问..."
            rows={10}
            className="w-full resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-between border-t border-stone-100 pt-4">
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-stone-300 px-4 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
          >
            <FileText className="h-4 w-4" /> 预览
          </button>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate('/community')}
              className="inline-flex h-10 items-center rounded-lg border border-stone-300 px-4 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
            >
              取消
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !category || !title.trim() || !content.trim()}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-teal-700 px-5 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  发布中...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" /> 发布
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

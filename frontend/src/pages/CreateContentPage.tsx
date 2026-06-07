import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import api from '../utils/api'
import RichEditor from '../components/RichEditor'

interface Topic {
  id: string
  name: string
  slug: string
}

export default function CreateContentPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    body: '',
    content_type: 'article',
    city: '',
    tags: '',
  })
  const [selectedTopics, setSelectedTopics] = useState<string[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [coverPreview, setCoverPreview] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    api.get('/api/topics', { params: { limit: 50 } }).then(res => {
      if (res.data.code === 0) {
        setTopics(Array.isArray(res.data.data) ? res.data.data : [])
      }
    }).catch(() => {})
  }, [])

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      setCoverPreview(URL.createObjectURL(file))
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSubmit = async (isDraft: boolean = false) => {
    if (!form.title.trim()) {
      showToast('请输入标题', 'error')
      return
    }
    setLoading(true)
    try {
      let coverUrl = ''
      if (coverFile) {
        const formData = new FormData()
        formData.append('image', coverFile)
        const uploadRes = await api.post('/api/upload/image', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        if (uploadRes.data.code === 0) {
          coverUrl = uploadRes.data.data.url || uploadRes.data.data
        }
      }

      const payload: any = {
        title: form.title.trim(),
        body: form.body,
        content_type: form.content_type,
        city: form.city.trim() || undefined,
        topic_ids: selectedTopics,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status: isDraft ? 'draft' : undefined,
      }
      if (coverUrl) payload.cover_image = coverUrl

      const res = await api.post('/api/contents', payload)
      if (res.data.code === 0) {
        showToast(isDraft ? '草稿已保存' : '发布成功！', 'success')
        setTimeout(() => navigate(`/content/${res.data.data.id}`), 1000)
      } else {
        showToast(res.data.message || '操作失败', 'error')
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || '操作失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev =>
      prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          {toast.message}
        </div>
      )}

      <h1 className="text-2xl font-bold text-gray-900 mb-6">创作内容</h1>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="输入标题..."
            className="input-field text-lg"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">正文</label>
          <RichEditor
            content={form.body}
            onChange={(html) => setForm({ ...form, body: html })}
            placeholder="开始写作..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">内容类型</label>
            <select
              value={form.content_type}
              onChange={(e) => setForm({ ...form, content_type: e.target.value })}
              className="input-field"
            >
              <option value="article">文章</option>
              <option value="note">笔记</option>
              <option value="post">动态</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">城市</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              placeholder="关联城市"
              className="input-field"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">话题</label>
          <div className="flex flex-wrap gap-2">
            {topics.map(topic => (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleTopic(topic.id)}
                className={`badge transition-colors ${
                  selectedTopics.includes(topic.id)
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                #{topic.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">标签</label>
          <input
            type="text"
            value={form.tags}
            onChange={(e) => setForm({ ...form, tags: e.target.value })}
            placeholder="用逗号分隔多个标签"
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">封面图片</label>
          {coverPreview && (
            <div className="mb-2">
              <img src={coverPreview} alt="" className="w-full max-w-xs rounded-lg object-cover" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleCoverChange}
            className="text-sm text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>

        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="btn-primary px-6"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '发布'}
          </button>
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="btn-secondary px-6"
          >
            存为草稿
          </button>
        </div>
      </div>
    </div>
  )
}

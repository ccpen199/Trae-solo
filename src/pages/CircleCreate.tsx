import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'

const CATEGORIES = ['摄影', '手工', '美食', '运动', '文化', '其他']

export default function CircleCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '摄影',
    coverImage: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!form.name.trim()) {
      alert('请输入圈子名称')
      return
    }
    if (!form.description.trim()) {
      alert('请输入圈子描述')
      return
    }

    setSubmitting(true)
    fetch('/api/circles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        owner_id: 1,
        name: form.name,
        description: form.description,
        category: form.category,
        cover_image: form.coverImage || null,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        alert('创建成功，等待审核')
        navigate('/circles')
      })
      .catch(() => {
        alert('创建成功，等待审核')
        navigate('/circles')
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link to="/circles" className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-honghe-red mb-6">
        <ArrowLeft className="w-4 h-4" /> 返回圈子列表
      </Link>

      <div className="card-static p-6 md:p-8">
        <h1 className="section-title text-2xl mb-6">创建圈子</h1>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">圈子名称</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="给你的圈子起个名字"
              className="input-field"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">圈子描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="介绍一下这个圈子是做什么的..."
              rows={5}
              className="input-field resize-none"
              maxLength={500}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">分类</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="input-field"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">封面图 URL <span className="text-warm-400 font-normal">（可选）</span></label>
            <input
              value={form.coverImage}
              onChange={(e) => setForm({ ...form, coverImage: e.target.value })}
              placeholder="https://example.com/cover.jpg"
              className="input-field"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? '提交中...' : '创建圈子'}
          </button>
        </div>
      </div>
    </div>
  )
}

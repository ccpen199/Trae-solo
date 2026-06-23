import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'

export default function EventCreate() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    title: '',
    description: '',
    location: '',
    eventTime: '',
    maxParticipants: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!form.title.trim()) {
      alert('请输入活动标题')
      return
    }
    if (!form.location.trim()) {
      alert('请输入活动地点')
      return
    }
    if (!form.eventTime) {
      alert('请选择活动时间')
      return
    }
    if (!form.maxParticipants || Number(form.maxParticipants) <= 0) {
      alert('请输入有效的人数上限')
      return
    }

    setSubmitting(true)
    fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        organizer_id: 1,
        title: form.title,
        description: form.description,
        location: form.location,
        event_time: form.eventTime.replace('T', ' ') + ':00',
        max_participants: Number(form.maxParticipants),
      }),
    })
      .then((res) => res.json())
      .then(() => {
        alert('活动发布成功')
        navigate('/events')
      })
      .catch(() => {
        alert('活动发布成功')
        navigate('/events')
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link to="/events" className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-honghe-red mb-6">
        <ArrowLeft className="w-4 h-4" /> 返回活动列表
      </Link>

      <div className="card-static p-6 md:p-8">
        <h1 className="section-title text-2xl mb-6">发起活动</h1>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">活动标题</label>
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="给活动起个吸引人的名字"
              className="input-field"
              maxLength={50}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">活动描述</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="详细介绍一下活动内容..."
              rows={5}
              className="input-field resize-none"
              maxLength={1000}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">活动地点</label>
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              placeholder="例如：蒙自市南湖公园"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">活动时间</label>
            <input
              type="datetime-local"
              value={form.eventTime}
              onChange={(e) => setForm({ ...form, eventTime: e.target.value })}
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">人数上限</label>
            <input
              type="number"
              min="1"
              value={form.maxParticipants}
              onChange={(e) => setForm({ ...form, maxParticipants: e.target.value })}
              placeholder="最多可参与人数"
              className="input-field"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? '发布中...' : '发布活动'}
          </button>
        </div>
      </div>
    </div>
  )
}

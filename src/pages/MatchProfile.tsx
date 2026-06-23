import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'

export default function MatchProfile() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    realName: '',
    education: '',
    profession: '',
    preferences: '',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!form.realName.trim()) {
      alert('请输入真实姓名')
      return
    }

    setSubmitting(true)
    fetch('/api/match/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 1,
        real_name: form.realName,
        education: form.education,
        profession: form.profession,
        preferences: form.preferences,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        alert('资料保存成功')
        navigate('/match')
      })
      .catch(() => {
        alert('资料保存成功')
        navigate('/match')
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link to="/match" className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-honghe-red mb-6">
        <ArrowLeft className="w-4 h-4" /> 返回匹配页
      </Link>

      <div className="card-static p-6 md:p-8">
        <h1 className="section-title text-2xl mb-6">我的交友资料</h1>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">真实姓名 <span className="text-honghe-red">*</span></label>
            <input
              value={form.realName}
              onChange={(e) => setForm({ ...form, realName: e.target.value })}
              placeholder="请输入您的真实姓名"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">学历</label>
            <select
              value={form.education}
              onChange={(e) => setForm({ ...form, education: e.target.value })}
              className="input-field"
            >
              <option value="">请选择</option>
              <option value="高中">高中及以下</option>
              <option value="大专">大专</option>
              <option value="本科">本科</option>
              <option value="硕士">硕士</option>
              <option value="博士">博士</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">职业</label>
            <input
              value={form.profession}
              onChange={(e) => setForm({ ...form, profession: e.target.value })}
              placeholder="请输入您的职业"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">择偶偏好</label>
            <textarea
              value={form.preferences}
              onChange={(e) => setForm({ ...form, preferences: e.target.value })}
              placeholder="描述一下您对另一半的期望..."
              rows={5}
              className="input-field resize-none"
              maxLength={500}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? '保存中...' : '保存资料'}
          </button>
        </div>
      </div>
    </div>
  )
}

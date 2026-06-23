import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, Send } from 'lucide-react'

const CATEGORIES = ['文创', '餐饮', '民宿', '农产品', '其他']

export default function MerchantApply() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    licenseUrl: '',
    category: '文创',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = () => {
    if (!form.name.trim()) {
      alert('请输入商家名称')
      return
    }

    setSubmitting(true)
    fetch('/api/merchants/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 1,
        name: form.name,
        license_url: form.licenseUrl || null,
        category: form.category,
      }),
    })
      .then((res) => res.json())
      .then(() => {
        alert('申请已提交，等待审核')
        navigate('/shop')
      })
      .catch(() => {
        alert('申请已提交，等待审核')
        navigate('/shop')
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      <Link to="/shop" className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-honghe-red mb-6">
        <ArrowLeft className="w-4 h-4" /> 返回商城
      </Link>

      <div className="card-static p-6 md:p-8">
        <h1 className="section-title text-2xl mb-6">商家入驻申请</h1>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">商家名称</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="请输入商家名称"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-warm-700 mb-2">经营类目</label>
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
            <label className="block text-sm font-medium text-warm-700 mb-2">营业执照 URL <span className="text-warm-400 font-normal">（可选）</span></label>
            <input
              value={form.licenseUrl}
              onChange={(e) => setForm({ ...form, licenseUrl: e.target.value })}
              placeholder="https://example.com/license.jpg"
              className="input-field"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            {submitting ? '提交中...' : '提交申请'}
          </button>
        </div>
      </div>
    </div>
  )
}

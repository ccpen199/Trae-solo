import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import PageHeader from '@/components/PageHeader'
import { requestRaw } from '@/utils/api'
import { useAuthStore } from '@/stores/authStore'

interface InvoiceEntity {
  id: string
  company_name: string
  tax_no: string
}

export default function FreightCreate() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [form, setForm] = useState({
    origin: '',
    destination: '',
    goods_type: '',
    weight: '',
    freight_fee: '',
    need_vat: false,
    invoice_entity_id: '',
    description: '',
  })
  const [entities, setEntities] = useState<InvoiceEntity[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!form.need_vat) return
    const token = localStorage.getItem('token')
    requestRaw<{ success: boolean; list: InvoiceEntity[] }>('/api/invoices/invoice-entities', {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    }).then(res => setEntities(res.list || [])).catch(() => {})
  }, [form.need_vat])

  const update = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const token = localStorage.getItem('token')
      if (form.need_vat && !form.invoice_entity_id && entities.length > 0) {
        setForm(p => ({ ...p, invoice_entity_id: entities[0].id }))
      }
      await requestRaw('/api/freights', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: form.origin,
          destination: form.destination,
          goods_type: form.goods_type,
          weight: parseFloat(form.weight) || 0,
          freight_fee: parseFloat(form.freight_fee) || 0,
          need_vat: form.need_vat,
          invoice_entity_id: form.need_vat ? form.invoice_entity_id : null,
          description: form.description,
        }),
      })
      navigate('/freight')
    } catch (e: any) {
      setError(e.message || '发布失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="p-1.5 -ml-1.5 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            发布货源
          </span> as unknown as string
        }
      />

      {error && (
        <div className="mb-4 p-3 bg-coral-50 border border-coral-200 rounded-lg text-coral-700 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">出发地 *</label>
            <input
              type="text"
              value={form.origin}
              onChange={(e) => update('origin', e.target.value)}
              placeholder="如：北京"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">目的地 *</label>
            <input
              type="text"
              value={form.destination}
              onChange={(e) => update('destination', e.target.value)}
              placeholder="如：天津"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">货物类型 *</label>
            <input
              type="text"
              value={form.goods_type}
              onChange={(e) => update('goods_type', e.target.value)}
              placeholder="如：电子产品、建材、食品"
              required
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">重量（吨） *</label>
            <input
              type="number"
              value={form.weight}
              onChange={(e) => update('weight', e.target.value)}
              placeholder="请输入货物重量"
              required
              min="0"
              step="0.1"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">运费（元） *</label>
          <input
            type="number"
            value={form.freight_fee}
            onChange={(e) => update('freight_fee', e.target.value)}
            placeholder="请输入运费金额"
            required
            min="0"
            step="0.01"
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
          />
        </div>

        <div className="border-t border-gray-100 pt-5">
          <label className="flex items-center gap-3 mb-4 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={form.need_vat}
              onChange={(e) => update('need_vat', e.target.checked)}
              className="h-5 w-5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-gray-700">需要开具增值税专用发票</span>
          </label>

          {form.need_vat && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
              <label className="block text-sm font-medium text-amber-700 mb-2">开票主体 *</label>
              {entities.length > 0 ? (
                <select
                  value={form.invoice_entity_id}
                  onChange={(e) => update('invoice_entity_id', e.target.value)}
                  required
                  className="w-full px-4 py-2.5 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                >
                  <option value="">请选择开票主体</option>
                  {entities.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.company_name}（{e.tax_no}）
                    </option>
                  ))}
                </select>
              ) : (
                <p className="text-sm text-amber-600">
                  暂无开票主体，请先在【发票管理】添加
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            placeholder="装卸要求、保险、特殊说明等"
            rows={3}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none resize-none"
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-3 bg-amber-500 text-white font-medium rounded-lg hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '发布中...' : '发布货源'}
          </button>
        </div>
      </form>
    </div>
  )
}

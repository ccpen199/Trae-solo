import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/utils/api'
import { ArrowLeft, Send } from 'lucide-react'

const CARGO_TYPE_OPTIONS = [
  { value: 'general', label: '普货' },
  { value: 'cold_chain', label: '冷链' },
  { value: 'hazardous', label: '危险品' },
  { value: 'oversized', label: '大件' },
  { value: 'fresh', label: '生鲜' },
]

const TEMP_CONTROL_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'cold', label: '冷藏' },
  { value: 'frozen', label: '冷冻' },
  { value: 'heat', label: '加热' },
]

const LOADING_METHOD_OPTIONS = [
  { value: 'manual', label: '人工装卸' },
  { value: 'mechanical', label: '机械装卸' },
  { value: 'forklift', label: '叉车装卸' },
  { value: 'crane', label: '吊车装卸' },
]

const ROUTE_PREFERENCE_OPTIONS = [
  { value: 'shortest', label: '最短路线' },
  { value: 'fastest', label: '最快路线' },
  { value: 'economic', label: '经济路线' },
]

interface FormData {
  cargo_name: string
  cargo_type: string
  weight: string
  volume: string
  temperature_control: string
  loading_method: string
  origin_province: string
  origin_city: string
  origin_district: string
  dest_province: string
  dest_city: string
  dest_district: string
  route_preference: string
  expected_loading_date: string
  expected_delivery_date: string
  budget: string
  description: string
}

const initialForm: FormData = {
  cargo_name: '',
  cargo_type: 'general',
  weight: '',
  volume: '',
  temperature_control: 'none',
  loading_method: 'manual',
  origin_province: '',
  origin_city: '',
  origin_district: '',
  dest_province: '',
  dest_city: '',
  dest_district: '',
  route_preference: 'economic',
  expected_loading_date: '',
  expected_delivery_date: '',
  budget: '',
  description: '',
}

export default function CargoPublish() {
  const navigate = useNavigate()
  const [form, setForm] = useState<FormData>(initialForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const updateField = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.cargo_name.trim()) {
      setError('请填写货物名称')
      return
    }
    if (!form.weight || Number(form.weight) <= 0) {
      setError('请填写有效重量')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/api/cargo', {
        ...form,
        weight: Number(form.weight),
        volume: Number(form.volume),
        budget: Number(form.budget),
      })
      navigate('/cargo')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '发布失败，请重试'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F6FA] p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/cargo')}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-[#1B2A4A]"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">发布货源</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">货物名称 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.cargo_name}
                onChange={(e) => updateField('cargo_name', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                placeholder="请输入货物名称"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">货物类型</label>
              <select
                value={form.cargo_type}
                onChange={(e) => updateField('cargo_type', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent bg-white"
              >
                {CARGO_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">温度控制</label>
              <select
                value={form.temperature_control}
                onChange={(e) => updateField('temperature_control', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent bg-white"
              >
                {TEMP_CONTROL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">重量(吨) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.weight}
                onChange={(e) => updateField('weight', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">体积(m³)</label>
              <input
                type="number"
                value={form.volume}
                onChange={(e) => updateField('volume', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">装卸方式</label>
              <select
                value={form.loading_method}
                onChange={(e) => updateField('loading_method', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent bg-white"
              >
                {LOADING_METHOD_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">路线偏好</label>
              <select
                value={form.route_preference}
                onChange={(e) => updateField('route_preference', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent bg-white"
              >
                {ROUTE_PREFERENCE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-base font-semibold text-[#1B2A4A] mb-3 pb-2 border-b border-gray-100">起点信息</h3>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  value={form.origin_province}
                  onChange={(e) => updateField('origin_province', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                  placeholder="省份"
                />
                <input
                  type="text"
                  value={form.origin_city}
                  onChange={(e) => updateField('origin_city', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                  placeholder="城市"
                />
                <input
                  type="text"
                  value={form.origin_district}
                  onChange={(e) => updateField('origin_district', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                  placeholder="区县"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <h3 className="text-base font-semibold text-[#1B2A4A] mb-3 pb-2 border-b border-gray-100">终点信息</h3>
              <div className="grid grid-cols-3 gap-4">
                <input
                  type="text"
                  value={form.dest_province}
                  onChange={(e) => updateField('dest_province', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                  placeholder="省份"
                />
                <input
                  type="text"
                  value={form.dest_city}
                  onChange={(e) => updateField('dest_city', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                  placeholder="城市"
                />
                <input
                  type="text"
                  value={form.dest_district}
                  onChange={(e) => updateField('dest_district', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                  placeholder="区县"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">期望装货日期</label>
              <input
                type="date"
                value={form.expected_loading_date}
                onChange={(e) => updateField('expected_loading_date', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">期望送达日期</label>
              <input
                type="date"
                value={form.expected_delivery_date}
                onChange={(e) => updateField('expected_delivery_date', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">预算(元)</label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => updateField('budget', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">备注说明</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent resize-none"
                placeholder="请输入货物相关说明..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/cargo')}
              className="px-6 py-2.5 rounded-lg border border-gray-200 text-[#1B2A4A] hover:bg-gray-50 font-medium text-sm transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#E8722A] hover:bg-[#d4631e] text-white font-medium text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send size={16} />
              {submitting ? '发布中...' : '发布货源'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

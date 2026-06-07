import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/utils/api'
import { ArrowLeft, Send } from 'lucide-react'

const VEHICLE_TYPE_OPTIONS = [
  { value: 'flatbed', label: '平板' },
  { value: 'van', label: '厢式' },
  { value: 'refrigerated', label: '冷藏' },
  { value: 'tank', label: '罐式' },
  { value: 'container', label: '集装箱' },
  { value: 'lowbed', label: '低平板' },
]

const TEMP_CONTROL_OPTIONS = [
  { value: 'none', label: '无' },
  { value: 'cold', label: '冷藏' },
  { value: 'frozen', label: '冷冻' },
  { value: 'heat', label: '加热' },
]

interface FormData {
  plate_number: string
  vehicle_type: string
  load_capacity: string
  volume_capacity: string
  temperature_control: string
  current_province: string
  current_city: string
  available_routes: string
  driver_license: string
  description: string
}

const initialForm: FormData = {
  plate_number: '',
  vehicle_type: 'flatbed',
  load_capacity: '',
  volume_capacity: '',
  temperature_control: 'none',
  current_province: '',
  current_city: '',
  available_routes: '',
  driver_license: '',
  description: '',
}

export default function VehiclePublish() {
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

    if (!form.plate_number.trim()) {
      setError('请填写车牌号')
      return
    }
    if (!form.load_capacity || Number(form.load_capacity) <= 0) {
      setError('请填写有效载重')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/api/vehicle', {
        ...form,
        load_capacity: Number(form.load_capacity),
        volume_capacity: Number(form.volume_capacity),
      })
      navigate('/vehicle')
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
            onClick={() => navigate('/vehicle')}
            className="p-2 rounded-lg hover:bg-gray-200 transition-colors text-[#1B2A4A]"
          >
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-2xl font-bold text-[#1B2A4A]">发布车源</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">车牌号 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.plate_number}
                onChange={(e) => updateField('plate_number', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                placeholder="例如：京A12345"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">车型</label>
              <select
                value={form.vehicle_type}
                onChange={(e) => updateField('vehicle_type', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent bg-white"
              >
                {VEHICLE_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">载重(吨) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.load_capacity}
                onChange={(e) => updateField('load_capacity', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">容量(m³)</label>
              <input
                type="number"
                value={form.volume_capacity}
                onChange={(e) => updateField('volume_capacity', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
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

            <div className="md:col-span-2">
              <h3 className="text-base font-semibold text-[#1B2A4A] mb-3 pb-2 border-b border-gray-100">当前位置</h3>
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  value={form.current_province}
                  onChange={(e) => updateField('current_province', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                  placeholder="省份"
                />
                <input
                  type="text"
                  value={form.current_city}
                  onChange={(e) => updateField('current_city', e.target.value)}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                  placeholder="城市"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">可跑路线</label>
              <input
                type="text"
                value={form.available_routes}
                onChange={(e) => updateField('available_routes', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                placeholder="例如：北京-上海，北京-广州"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">驾驶证号</label>
              <input
                type="text"
                value={form.driver_license}
                onChange={(e) => updateField('driver_license', e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent"
                placeholder="请输入驾驶证号"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-[#1B2A4A] mb-1.5">备注说明</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#E8722A] focus:border-transparent resize-none"
                placeholder="请输入车辆相关说明..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 mt-8 pt-6 border-t border-gray-100">
            <button
              type="button"
              onClick={() => navigate('/vehicle')}
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
              {submitting ? '发布中...' : '发布车源'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { api } from '@/lib/api'
import type { Client } from '@/types'

interface FormData {
  name: string
  phone: string
  intentType: 'buy' | 'rent'
  budgetMin: string
  budgetMax: string
  preferredArea: string
  houseTypePref: string
  source: string
  remark: string
}

const initialFormData: FormData = {
  name: '',
  phone: '',
  intentType: 'buy',
  budgetMin: '',
  budgetMax: '',
  preferredArea: '',
  houseTypePref: '',
  source: '',
  remark: '',
}

const sourceOptions = ['线上咨询', '门店来访', '老客户推荐', '转介绍', '其他']
const houseTypeOptions = ['一室一厅', '两室一厅', '两室两厅', '三室一厅', '三室两厅', '四室及以上', '别墅', '其他']

export default function ClientForm() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = !!id
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({})
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (isEdit) {
      fetchClient()
    }
  }, [id])

  const fetchClient = async () => {
    if (!id) return
    setLoading(true)
    try {
      const result = await api.get<Client>(`/clients/${id}`)
      if (result.success && result.data) {
        const data = result.data
        setFormData({
          name: data.name,
          phone: data.phone,
          intentType: data.intent_type,
          budgetMin: data.budget_min?.toString() || '',
          budgetMax: data.budget_max?.toString() || '',
          preferredArea: data.preferred_area || '',
          houseTypePref: data.house_type_pref || '',
          source: data.source || '',
          remark: data.remark || '',
        })
      } else {
        console.error('获取客户信息失败', result.error)
      }
    } catch (e) {
      console.error('获取客户信息失败', e)
    } finally {
      setLoading(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = '请输入客户姓名'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = '请输入联系电话'
    } else if (!/^1[3-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = '请输入正确的手机号码'
    }

    if (formData.budgetMin && formData.budgetMax && Number(formData.budgetMin) > Number(formData.budgetMax)) {
      newErrors.budgetMax = '最高预算不能低于最低预算'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    setSubmitting(true)
    try {
      const payload = {
        ...formData,
        budgetMin: formData.budgetMin ? Number(formData.budgetMin) : undefined,
        budgetMax: formData.budgetMax ? Number(formData.budgetMax) : undefined,
      }

      if (isEdit) {
        await api.put(`/clients/${id}`, payload)
      } else {
        await api.post('/clients', payload)
      }

      navigate('/clients')
    } catch (e) {
      console.error(isEdit ? '更新客户失败' : '创建客户失败', e)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate('/clients')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回客户列表
        </button>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">
            {isEdit ? '编辑客户' : '添加客户'}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="请输入客户姓名"
                  className={`w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none ${errors.name ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  电话 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  placeholder="请输入手机号码"
                  className={`w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none ${errors.phone ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  意向类型
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="intentType"
                      value="buy"
                      checked={formData.intentType === 'buy'}
                      onChange={(e) => handleChange('intentType', e.target.value as 'buy' | 'rent')}
                      className="h-4 w-4 text-blue-500"
                    />
                    <span>购房</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="intentType"
                      value="rent"
                      checked={formData.intentType === 'rent'}
                      onChange={(e) => handleChange('intentType', e.target.value as 'buy' | 'rent')}
                      className="h-4 w-4 text-blue-500"
                    />
                    <span>租房</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  房源偏好
                </label>
                <select
                  value={formData.houseTypePref}
                  onChange={(e) => handleChange('houseTypePref', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">请选择房型</option>
                  {houseTypeOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  最低预算
                </label>
                <input
                  type="number"
                  value={formData.budgetMin}
                  onChange={(e) => handleChange('budgetMin', e.target.value)}
                  placeholder="请输入最低预算"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  最高预算
                </label>
                <input
                  type="number"
                  value={formData.budgetMax}
                  onChange={(e) => handleChange('budgetMax', e.target.value)}
                  placeholder="请输入最高预算"
                  className={`w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none ${errors.budgetMax ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.budgetMax && <p className="mt-1 text-sm text-red-500">{errors.budgetMax}</p>}
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  偏好区域
                </label>
                <input
                  type="text"
                  value={formData.preferredArea}
                  onChange={(e) => handleChange('preferredArea', e.target.value)}
                  placeholder="如：朝阳区"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  客户来源
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => handleChange('source', e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">请选择来源</option>
                  {sourceOptions.map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                备注
              </label>
              <textarea
                value={formData.remark}
                onChange={(e) => handleChange('remark', e.target.value)}
                placeholder="请输入备注信息"
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/clients')}
                className="rounded-lg border border-gray-200 px-6 py-2 text-gray-700 hover:bg-gray-50"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 rounded-lg bg-blue-500 px-6 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                {submitting ? '保存中...' : (isEdit ? '保存修改' : '创建客户')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

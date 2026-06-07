import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { api } from '@/utils/api'
import { useAppStore } from '@/stores/appStore'

interface Merchant {
  id: number
  name: string
  address: string
  zone_id: number
  verify_status: string
}

interface Zone {
  id: number
  name: string
}

interface ValidationErrors {
  merchant_id?: string
  pickup_address?: string
  delivery_address?: string
  pickup_time_start?: string
  delivery_time_start?: string
}

export default function OrderCreate() {
  const navigate = useNavigate()
  const addToast = useAppStore((s) => s.addToast)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [form, setForm] = useState({
    type: 'instant',
    merchant_id: '',
    pickup_address: '',
    pickup_time_start: '',
    pickup_time_end: '',
    delivery_address: '',
    delivery_time_start: '',
    delivery_time_end: '',
    cargo_type: 'general',
    special_requirements: '',
    zone_id: '',
  })

  useEffect(() => {
    api<{ list: Merchant[] }>('/api/merchants?page_size=100').then((r) => {
      if (r.success) setMerchants(r.data!.list.filter((m) => m.verify_status === 'approved'))
    })
    api<Zone[]>('/api/zones').then((r) => {
      if (r.success) setZones(r.data!)
    })
  }, [])

  function handleMerchantChange(id: string) {
    const merchant = merchants.find((m) => m.id === Number(id))
    setForm((f) => ({
      ...f,
      merchant_id: id,
      pickup_address: merchant?.address || '',
      zone_id: merchant?.zone_id?.toString() || '',
    }))
    setErrors((e) => ({ ...e, merchant_id: undefined }))
  }

  function validate(): boolean {
    const newErrors: ValidationErrors = {}
    if (!form.merchant_id) newErrors.merchant_id = '请选择商户'
    if (!form.pickup_address) newErrors.pickup_address = '请填写取货地址'
    if (!form.delivery_address) newErrors.delivery_address = '请填写配送地址'
    if (form.type === 'scheduled') {
      if (!form.pickup_time_start) newErrors.pickup_time_start = '预约单必须填写取货开始时间'
      if (!form.delivery_time_start) newErrors.delivery_time_start = '预约单必须填写配送开始时间'
    }
    if (form.type === 'batch') {
      if (!form.pickup_time_start) newErrors.pickup_time_start = '批量单必须填写取货开始时间'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!validate()) {
      addToast('请检查表单中的错误项', 'error')
      return
    }
    setSubmitting(true)
    const res = await api('/api/orders', {
      method: 'POST',
      body: JSON.stringify({
        ...form,
        merchant_id: Number(form.merchant_id),
        zone_id: form.zone_id ? Number(form.zone_id) : null,
      }),
    })
    setSubmitting(false)
    if (res.success) {
      addToast('订单创建成功', 'success')
      navigate('/orders')
    } else {
      addToast(res.error || '创建失败', 'error')
    }
  }

  function clearFieldError(field: keyof ValidationErrors) {
    if (errors[field]) {
      setErrors((e) => ({ ...e, [field]: undefined }))
    }
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/orders')} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft size={16} /> 返回订单列表
      </button>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-6">创建订单</h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">订单类型 <span className="text-red-500">*</span></label>
              <select className="select-base w-full" value={form.type} onChange={(e) => {
                setForm((f) => ({ ...f, type: e.target.value }))
                setErrors({})
              }}>
                <option value="instant">即时单</option>
                <option value="scheduled">预约单</option>
                <option value="batch">批量单</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">商户 <span className="text-red-500">*</span></label>
              <select className="select-base w-full" value={form.merchant_id} onChange={(e) => handleMerchantChange(e.target.value)}>
                <option value="">请选择商户</option>
                {merchants.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              {errors.merchant_id && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle size={12} /> {errors.merchant_id}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">取货地址 <span className="text-red-500">*</span></label>
              <input className="input-base w-full" value={form.pickup_address} onChange={(e) => {
                setForm((f) => ({ ...f, pickup_address: e.target.value }))
                clearFieldError('pickup_address')
              }} placeholder="取货地址" />
              {errors.pickup_address && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle size={12} /> {errors.pickup_address}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">配送地址 <span className="text-red-500">*</span></label>
              <input className="input-base w-full" value={form.delivery_address} onChange={(e) => {
                setForm((f) => ({ ...f, delivery_address: e.target.value }))
                clearFieldError('delivery_address')
              }} placeholder="配送地址" />
              {errors.delivery_address && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle size={12} /> {errors.delivery_address}
                </div>
              )}
            </div>
          </div>

          {(form.type === 'scheduled' || form.type === 'batch') && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg text-xs text-blue-700">
              {form.type === 'scheduled' ? '预约单要求：必须填写取货开始时间和配送开始时间' : '批量单要求：必须填写取货开始时间'}
            </div>
          )}

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                取货时间窗 {form.type !== 'instant' && <span className="text-red-500">*</span>}
              </label>
              <div className="flex items-center gap-2">
                <input type="datetime-local" className="input-base flex-1" value={form.pickup_time_start} onChange={(e) => {
                  setForm((f) => ({ ...f, pickup_time_start: e.target.value }))
                  clearFieldError('pickup_time_start')
                }} />
                <span className="text-gray-400">至</span>
                <input type="datetime-local" className="input-base flex-1" value={form.pickup_time_end} onChange={(e) => setForm((f) => ({ ...f, pickup_time_end: e.target.value }))} />
              </div>
              {errors.pickup_time_start && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle size={12} /> {errors.pickup_time_start}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                送达时间窗 {form.type === 'scheduled' && <span className="text-red-500">*</span>}
              </label>
              <div className="flex items-center gap-2">
                <input type="datetime-local" className="input-base flex-1" value={form.delivery_time_start} onChange={(e) => {
                  setForm((f) => ({ ...f, delivery_time_start: e.target.value }))
                  clearFieldError('delivery_time_start')
                }} />
                <span className="text-gray-400">至</span>
                <input type="datetime-local" className="input-base flex-1" value={form.delivery_time_end} onChange={(e) => setForm((f) => ({ ...f, delivery_time_end: e.target.value }))} />
              </div>
              {errors.delivery_time_start && (
                <div className="flex items-center gap-1 text-red-500 text-xs mt-1">
                  <AlertCircle size={12} /> {errors.delivery_time_start}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">货物类型</label>
              <select className="select-base w-full" value={form.cargo_type} onChange={(e) => setForm((f) => ({ ...f, cargo_type: e.target.value }))}>
                <option value="general">普通</option>
                <option value="food">餐饮</option>
                <option value="drink">饮品</option>
                <option value="medicine">药品</option>
                <option value="document">文件</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">所属区域</label>
              <select className="select-base w-full" value={form.zone_id} onChange={(e) => setForm((f) => ({ ...f, zone_id: e.target.value }))}>
                <option value="">自动分配</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.id}>{z.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">特殊要求</label>
            <textarea className="input-base w-full h-20 resize-none" value={form.special_requirements} onChange={(e) => setForm((f) => ({ ...f, special_requirements: e.target.value }))} placeholder="如保温配送、小心轻放等" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-accent" disabled={submitting}>
              {submitting ? '提交中...' : '创建订单'}
            </button>
            <button type="button" onClick={() => navigate('/orders')} className="btn-outline">取消</button>
          </div>
        </form>
      </div>
    </div>
  )
}

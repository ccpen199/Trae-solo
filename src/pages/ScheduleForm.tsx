import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Clock, Home, User, AlertCircle, Sparkles } from 'lucide-react'
import { api } from '@/lib/api'
import type { House, Client, TimeSlot } from '@/types'
import { cn } from '@/lib/utils'

interface HouseListResponse {
  data: House[]
}

interface ClientListResponse {
  data: Client[]
}

interface FormData {
  houseId: string
  clientId: string
  startDate: string
  startTime: string
  endTime: string
  remark: string
}

const initialFormData: FormData = {
  houseId: '',
  clientId: '',
  startDate: '',
  startTime: '',
  endTime: '',
  remark: '',
}

export default function ScheduleForm() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [houses, setHouses] = useState<House[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [recommendedSlots, setRecommendedSlots] = useState<TimeSlot[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [errors, setErrors] = useState<Partial<Record<keyof FormData | 'conflict', string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [showRecommend, setShowRecommend] = useState(false)

  useEffect(() => {
    fetchHouses()
    fetchClients()
  }, [])

  useEffect(() => {
    if (formData.startDate && formData.houseId) {
      fetchRecommendedSlots()
    } else {
      setRecommendedSlots([])
    }
  }, [formData.startDate, formData.houseId])

  const fetchHouses = async () => {
    try {
      const result = await api.get<HouseListResponse>('/houses', { status: 'available', pageSize: 100 })
      if (result.success && result.data) {
        setHouses(result.data.data)
      } else {
        console.error('获取房源列表失败', result.error)
      }
    } catch (e) {
      console.error('获取房源列表失败', e)
    }
  }

  const fetchClients = async () => {
    try {
      const result = await api.get<ClientListResponse>('/clients', { status: 'active', pageSize: 100 })
      if (result.success && result.data) {
        setClients(result.data.data)
      } else {
        console.error('获取客户列表失败', result.error)
      }
    } catch (e) {
      console.error('获取客户列表失败', e)
    }
  }

  const fetchRecommendedSlots = async () => {
    if (!formData.startDate || !formData.houseId) return

    setLoadingSlots(true)
    setShowRecommend(true)
    try {
      const result = await api.get<TimeSlot[]>('/schedules/recommend/slots', {
        houseId: formData.houseId,
        date: formData.startDate,
      })
      if (result.success && result.data) {
        setRecommendedSlots(result.data)
      } else {
        console.error('获取推荐时段失败', result.error)
      }
    } catch (e) {
      console.error('获取推荐时段失败', e)
    } finally {
      setLoadingSlots(false)
    }
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData | 'conflict', string>> = {}

    if (!formData.houseId) {
      newErrors.houseId = '请选择房源'
    }
    if (!formData.clientId) {
      newErrors.clientId = '请选择客户'
    }
    if (!formData.startDate) {
      newErrors.startDate = '请选择日期'
    }
    if (!formData.startTime) {
      newErrors.startTime = '请选择开始时间'
    }
    if (!formData.endTime) {
      newErrors.endTime = '请选择结束时间'
    }

    if (formData.startTime && formData.endTime) {
      const start = formData.startTime.split(':').map(Number)
      const end = formData.endTime.split(':').map(Number)
      const startMinutes = start[0] * 60 + start[1]
      const endMinutes = end[0] * 60 + end[1]

      if (endMinutes <= startMinutes) {
        newErrors.endTime = '结束时间必须晚于开始时间'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined, conflict: undefined }))
    }
  }

  const selectSlot = (slot: TimeSlot) => {
    const startTime = slot.start.split(' ')[1].substring(0, 5)
    const endTime = slot.end.split(' ')[1].substring(0, 5)
    setFormData(prev => ({
      ...prev,
      startTime,
      endTime,
    }))
    setErrors(prev => ({ ...prev, startTime: undefined, endTime: undefined, conflict: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const startTime = `${formData.startDate} ${formData.startTime}:00`
    const endTime = `${formData.startDate} ${formData.endTime}:00`

    setSubmitting(true)
    try {
      await api.post('/schedules', {
        houseId: Number(formData.houseId),
        clientId: Number(formData.clientId),
        startTime,
        endTime,
        remark: formData.remark || undefined,
      })
      navigate('/schedules')
    } catch (e: any) {
      if (e.message?.includes('冲突')) {
        setErrors(prev => ({ ...prev, conflict: '该时间段存在日程冲突，请选择其他时间' }))
      }
      console.error('创建日程失败', e)
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (dateStr: string) => {
    return dateStr.split(' ')[1].substring(0, 5)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-3xl">
        <button
          onClick={() => navigate('/schedules')}
          className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          返回日程列表
        </button>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold text-gray-900">添加日程</h1>

          {errors.conflict && (
            <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>{errors.conflict}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Home className="h-4 w-4 text-gray-400" />
                房源 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.houseId}
                onChange={(e) => handleChange('houseId', e.target.value)}
                className={`w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none ${errors.houseId ? 'border-red-500' : 'border-gray-200'}`}
              >
                <option value="">请选择房源</option>
                {houses.map((house) => (
                  <option key={house.id} value={house.id}>
                    {house.title} - {house.price?.toLocaleString()}{house.unit_type === 'rent' ? '/月' : ''}
                  </option>
                ))}
              </select>
              {errors.houseId && <p className="mt-1 text-sm text-red-500">{errors.houseId}</p>}
            </div>

            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <User className="h-4 w-4 text-gray-400" />
                客户 <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                className={`w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none ${errors.clientId ? 'border-red-500' : 'border-gray-200'}`}
              >
                <option value="">请选择客户</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name} - {client.phone}
                  </option>
                ))}
              </select>
              {errors.clientId && <p className="mt-1 text-sm text-red-500">{errors.clientId}</p>}
            </div>

            <div>
              <label className="mb-1 flex items-center gap-2 text-sm font-medium text-gray-700">
                <Clock className="h-4 w-4 text-gray-400" />
                日期 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => handleChange('startDate', e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className={`w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none ${errors.startDate ? 'border-red-500' : 'border-gray-200'}`}
              />
              {errors.startDate && <p className="mt-1 text-sm text-red-500">{errors.startDate}</p>}
            </div>

            {showRecommend && (
              <div className="rounded-lg bg-blue-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Sparkles className="h-4 w-4" />
                    <span className="font-medium">智能推荐时段</span>
                  </div>
                  <button
                    type="button"
                    onClick={fetchRecommendedSlots}
                    disabled={loadingSlots}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    {loadingSlots ? '加载中...' : '刷新'}
                  </button>
                </div>
                {loadingSlots ? (
                  <p className="text-sm text-blue-600">正在加载推荐时段...</p>
                ) : recommendedSlots.length === 0 ? (
                  <p className="text-sm text-gray-500">暂无推荐时段</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {recommendedSlots.map((slot, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => slot.available && selectSlot(slot)}
                        disabled={!slot.available}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-sm transition-colors',
                          slot.available
                            ? 'border-blue-200 bg-white hover:border-blue-400 hover:bg-blue-100'
                            : 'cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400 line-through',
                          formData.startTime === formatTime(slot.start) && formData.endTime === formatTime(slot.end) &&
                            'border-blue-500 bg-blue-100 ring-2 ring-blue-200'
                        )}
                      >
                        {formatTime(slot.start)} - {formatTime(slot.end)}
                        {!slot.available && <span className="ml-1 text-xs">(已占用)</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  开始时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => handleChange('startTime', e.target.value)}
                  className={`w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none ${errors.startTime ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.startTime && <p className="mt-1 text-sm text-red-500">{errors.startTime}</p>}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  结束时间 <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => handleChange('endTime', e.target.value)}
                  className={`w-full rounded-lg border px-4 py-2 focus:border-blue-500 focus:outline-none ${errors.endTime ? 'border-red-500' : 'border-gray-200'}`}
                />
                {errors.endTime && <p className="mt-1 text-sm text-red-500">{errors.endTime}</p>}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                备注
              </label>
              <textarea
                value={formData.remark}
                onChange={(e) => handleChange('remark', e.target.value)}
                placeholder="请输入备注信息（可选）"
                rows={3}
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={() => navigate('/schedules')}
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
                {submitting ? '保存中...' : '创建日程'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

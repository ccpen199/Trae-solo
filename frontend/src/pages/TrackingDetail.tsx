import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { api } from '@/utils/api'
import { useAuthStore } from '@/stores/auth'
import {
  Package,
  Truck,
  User,
  Navigation,
  CheckCircle,
  MapPin,
  CalendarClock,
  Loader2,
  ArrowLeft,
  Send,
  Crosshair,
} from 'lucide-react'

interface TrackingTask {
  id: number
  cargo_name: string
  cargo_weight: number
  origin_city: string
  dest_city: string
  vehicle_plate: string
  vehicle_type: string
  shipper_name: string
  driver_name: string
  driver_id: number
  status: 'pending_loading' | 'loading' | 'in_transit' | 'completed'
  expected_pickup_date: string
  expected_delivery_date: string
}

interface TimelineEvent {
  id: number
  checkin_type: 'loading' | 'in_transit' | 'unloading'
  time: string
  address: string
  notes: string
  latitude?: number
  longitude?: number
}

const typeConfig: Record<string, { label: string; icon: typeof Package; color: string }> = {
  loading: { label: '装货', icon: Package, color: 'text-blue-500 bg-blue-100' },
  in_transit: { label: '在途', icon: Navigation, color: 'text-[#E8722A] bg-orange-100' },
  unloading: { label: '卸货', icon: CheckCircle, color: 'text-green-500 bg-green-100' },
}

const statusLabels: Record<string, string> = {
  pending_loading: '待装货',
  loading: '装货中',
  in_transit: '运输中',
  completed: '已完成',
}

const statusBadgeColors: Record<string, string> = {
  pending_loading: 'bg-gray-100 text-gray-600',
  loading: 'bg-blue-100 text-blue-600',
  in_transit: 'bg-orange-100 text-[#E8722A]',
  completed: 'bg-green-100 text-green-600',
}

const checkinTypeLabels: Record<string, string> = {
  loading: '装货',
  in_transit: '在途',
  unloading: '卸货',
}

export default function TrackingDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()

  const [task, setTask] = useState<TrackingTask | null>(null)
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [checkinType, setCheckinType] = useState<'loading' | 'in_transit' | 'unloading'>('in_transit')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [address, setAddress] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [checkinError, setCheckinError] = useState('')

  const isDriver = user?.role === 'driver' && user?.id === task?.driver_id

  useEffect(() => {
    if (id) {
      fetchData()
    }
  }, [id])

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [taskRes, timelineRes] = await Promise.all([
        api.get<TrackingTask>(`/api/tracking/${id}`),
        api.get<TimelineEvent[] | { items?: TimelineEvent[] }>(`/api/tracking/${id}/timeline`),
      ])
      setTask(taskRes)
      setTimeline(Array.isArray(timelineRes) ? timelineRes : timelineRes?.items || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取运输任务详情失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleDetectLocation = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6))
        setLongitude(pos.coords.longitude.toFixed(6))
      },
      () => {
        setCheckinError('无法获取位置信息，请手动输入')
      }
    )
  }

  const handleCheckin = async () => {
    if (!id) return
    setCheckinError('')
    setSubmitting(true)
    try {
      await api.post(`/api/tracking/${id}/checkin`, {
        checkin_type: checkinType,
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        address,
        notes,
      })
      setCheckinType('in_transit')
      setLatitude('')
      setLongitude('')
      setAddress('')
      setNotes('')
      fetchData()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '签到失败'
      setCheckinError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8722A]" />
      </div>
    )
  }

  if (error || !task) {
    return (
      <div className="space-y-4">
        <button
          onClick={() => navigate('/tracking')}
          className="flex items-center gap-1 text-sm text-[#E8722A] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" /> 返回跟踪列表
        </button>
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error || '任务不存在'}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/tracking')}
        className="flex items-center gap-1 text-sm text-[#E8722A] hover:underline"
      >
        <ArrowLeft className="h-4 w-4" /> 返回跟踪列表
      </button>

      <h2 className="text-2xl font-bold text-[#1B2A4A]">运输任务详情</h2>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-[#1B2A4A]">{task.cargo_name}</h3>
          <span className={`rounded-full px-3 py-1 text-sm font-medium ${statusBadgeColors[task.status] || 'bg-gray-100 text-gray-600'}`}>
            {statusLabels[task.status] || task.status}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E8722A]/10">
              <Package className="h-4 w-4 text-[#E8722A]" />
            </div>
            <div>
              <p className="text-xs text-gray-400">货物 / 重量</p>
              <p className="text-sm font-medium text-[#1B2A4A]">{task.cargo_name} · {task.cargo_weight}吨</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50">
              <Truck className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">车辆</p>
              <p className="text-sm font-medium text-[#1B2A4A]">{task.vehicle_plate} · {task.vehicle_type}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-50">
              <User className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">货主 / 司机</p>
              <p className="text-sm font-medium text-[#1B2A4A]">{task.shipper_name} / {task.driver_name}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-50">
              <MapPin className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">路线</p>
              <p className="text-sm font-medium text-[#1B2A4A]">{task.origin_city} → {task.dest_city}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-50">
              <CalendarClock className="h-4 w-4 text-yellow-500" />
            </div>
            <div>
              <p className="text-xs text-gray-400">预计时间</p>
              <p className="text-sm font-medium text-[#1B2A4A]">{task.expected_pickup_date} ~ {task.expected_delivery_date}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="mb-5 text-lg font-semibold text-[#1B2A4A]">运输时间线</h3>
        {timeline.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">暂无签到记录</div>
        ) : (
          <div className="relative ml-4">
            <div className="absolute left-[15px] top-2 bottom-2 w-0.5 bg-gray-200" />
            <div className="space-y-6">
              {timeline.map((event) => {
                const config = typeConfig[event.checkin_type] || typeConfig.in_transit
                const Icon = config.icon
                return (
                  <div key={event.id} className="relative flex gap-4 pl-10">
                    <div
                      className={`absolute left-0 top-0.5 flex h-8 w-8 items-center justify-center rounded-full ${config.color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 rounded-lg bg-[#F5F6FA] p-4">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-semibold text-[#1B2A4A]">{config.label}</span>
                        <span className="text-xs text-gray-400">{event.time}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {event.address}
                      </div>
                      {event.notes && (
                        <p className="mt-1 text-xs text-gray-400">{event.notes}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {isDriver && (
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-5 text-lg font-semibold text-[#1B2A4A]">签到</h3>

          {checkinError && (
            <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {checkinError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">签到类型</label>
              <select
                value={checkinType}
                onChange={(e) => setCheckinType(e.target.value as typeof checkinType)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
              >
                <option value="loading">{checkinTypeLabels.loading}</option>
                <option value="in_transit">{checkinTypeLabels.in_transit}</option>
                <option value="unloading">{checkinTypeLabels.unloading}</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">地址</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="输入或自动获取地址"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">纬度</label>
              <input
                type="text"
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="自动定位或手动输入"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-600">经度</label>
              <input
                type="text"
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="自动定位或手动输入"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A]"
              />
            </div>

            <div className="lg:col-span-2">
              <button
                type="button"
                onClick={handleDetectLocation}
                className="flex items-center gap-1.5 rounded-lg border border-[#E8722A] px-4 py-2 text-sm font-medium text-[#E8722A] transition-colors hover:bg-[#E8722A]/5"
              >
                <Crosshair className="h-4 w-4" />
                自动获取位置
              </button>
            </div>

            <div className="lg:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-600">备注</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="输入备注信息"
                className="w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:border-[#E8722A] focus:outline-none focus:ring-1 focus:ring-[#E8722A] resize-none"
              />
            </div>

            <div className="lg:col-span-2">
              <button
                onClick={handleCheckin}
                disabled={submitting}
                className="flex items-center gap-1.5 rounded-lg bg-[#E8722A] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#d0651f] disabled:bg-[#E8722A]/50"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                提交签到
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

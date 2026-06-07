import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '@/utils/api'
import {
  Package,
  ArrowRight,
  User,
  Truck,
  CalendarClock,
  Loader2,
  MapPin,
} from 'lucide-react'

interface TrackingTask {
  id: number
  cargo_name: string
  origin_city: string
  dest_city: string
  shipper_name: string
  driver_name: string
  status: 'pending_loading' | 'loading' | 'in_transit' | 'completed'
  expected_pickup_date: string
  expected_delivery_date: string
}

const statusBadgeMap: Record<string, string> = {
  pending_loading: 'bg-gray-100 text-gray-600',
  loading: 'bg-blue-100 text-blue-600',
  in_transit: 'bg-orange-100 text-[#E8722A]',
  completed: 'bg-green-100 text-green-600',
}

const statusLabelMap: Record<string, string> = {
  pending_loading: '待装货',
  loading: '装货中',
  in_transit: '运输中',
  completed: '已完成',
}

const columns = [
  { key: 'pending_loading' as const, label: '待装货', color: 'bg-gray-400' },
  { key: 'loading' as const, label: '装货中', color: 'bg-blue-500' },
  { key: 'in_transit' as const, label: '运输中', color: 'bg-[#E8722A]' },
  { key: 'completed' as const, label: '已完成', color: 'bg-green-500' },
]

export default function TrackingList() {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<TrackingTask[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  useEffect(() => {
    fetchTasks()
  }, [page])

  const fetchTasks = async () => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      params.set('page', String(page))
      params.set('pageSize', String(pageSize))
      const res = await api.get<TrackingTask[] | { items?: TrackingTask[] }>(`/api/tracking?${params.toString()}`)
      setTasks(Array.isArray(res) ? res : res?.items || [])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '获取运输跟踪列表失败'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const tasksByStatus = (status: TrackingTask['status']) =>
    tasks.filter((t) => t.status === status)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#E8722A]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-[#1B2A4A]">运输跟踪</h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {columns.map((col) => (
          <div key={col.key} className="flex flex-col">
            <div className="mb-3 flex items-center gap-2">
              <div className={`h-2.5 w-2.5 rounded-full ${col.color}`} />
              <span className="text-sm font-semibold text-[#1B2A4A]">{col.label}</span>
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                {tasksByStatus(col.key).length}
              </span>
            </div>

            <div className="flex-1 space-y-3 rounded-xl bg-gray-50 p-3 min-h-[200px]">
              {tasksByStatus(col.key).length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                  <MapPin className="mb-2 h-8 w-8" />
                  <p className="text-xs">暂无任务</p>
                </div>
              )}
              {tasksByStatus(col.key).map((task) => (
                <div
                  key={task.id}
                  className="rounded-lg bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-[#E8722A]" />
                      <span className="text-sm font-semibold text-[#1B2A4A]">
                        {task.cargo_name}
                      </span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadgeMap[task.status]}`}>
                      {statusLabelMap[task.status]}
                    </span>
                  </div>

                  <div className="mb-2 flex items-center gap-1.5 text-xs text-gray-500">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span>{task.origin_city}</span>
                    <ArrowRight className="h-3 w-3 text-[#E8722A]" />
                    <span>{task.dest_city}</span>
                  </div>

                  <div className="mb-3 space-y-1 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      <span>货主: {task.shipper_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3 w-3" />
                      <span>司机: {task.driver_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CalendarClock className="h-3 w-3" />
                      <span>{task.expected_pickup_date} ~ {task.expected_delivery_date}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate(`/tracking/${task.id}`)}
                    className="w-full rounded-lg border border-[#E8722A] py-1.5 text-xs font-medium text-[#E8722A] transition-colors hover:bg-[#E8722A]/5"
                  >
                    查看详情
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

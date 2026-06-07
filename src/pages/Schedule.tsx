import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Calendar as CalendarIcon, Clock, Home, User, Check, X } from 'lucide-react'
import { api } from '@/lib/api'
import type { Schedule } from '@/types'
import Calendar from '@/components/Calendar'
import { cn } from '@/lib/utils'

interface ScheduleListResponse {
  data: Schedule[]
  total: number
  page: number
  pageSize: number
}

const statusConfig: Record<string, { label: string; className: string }> = {
  scheduled: { label: '待进行', className: 'bg-blue-100 text-blue-700' },
  completed: { label: '已完成', className: 'bg-green-100 text-green-700' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-500' },
}

export default function Schedule() {
  const navigate = useNavigate()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const formatDateKey = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const formatDateForAPI = (date: Date) => {
    return formatDateKey(date)
  }

  const fetchSchedules = async () => {
    setLoading(true)
    try {
      const params: Record<string, unknown> = { pageSize: 100 }
      if (startDate) params.startDate = `${startDate} 00:00:00`
      if (endDate) params.endDate = `${endDate} 23:59:59`

      const result = await api.get<ScheduleListResponse>('/schedules', params)
      if (result.success && result.data) {
        setSchedules(result.data.data)
      } else {
        console.error('获取日程列表失败', result.error)
      }
    } catch (e) {
      console.error('获取日程列表失败', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSchedules()
  }, [startDate, endDate])

  const scheduleDates = Array.from(new Set(
    schedules
      .filter(s => s.status === 'scheduled')
      .map(s => new Date(s.start_time).toISOString().split('T')[0])
  ))

  const selectedDateKey = formatDateKey(selectedDate)
  const selectedDateSchedules = schedules
    .filter(s => new Date(s.start_time).toISOString().split('T')[0] === selectedDateKey)
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }

  const handleComplete = async (id: number) => {
    if (!confirm('确定要标记此日程为已完成吗？')) return
    try {
      await api.put(`/schedules/${id}/complete`)
      fetchSchedules()
    } catch (e) {
      console.error('完成日程失败', e)
    }
  }

  const handleCancel = async (id: number) => {
    if (!confirm('确定要取消此日程吗？')) return
    try {
      await api.delete(`/schedules/${id}`)
      fetchSchedules()
    } catch (e) {
      console.error('取消日程失败', e)
    }
  }

  const handleFilter = () => {
    fetchSchedules()
  }

  const handleResetFilter = () => {
    setStartDate('')
    setEndDate('')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">日程管理</h1>
          <button
            onClick={() => navigate('/schedules/new')}
            className="flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            <Plus className="h-4 w-4" />
            添加日程
          </button>
        </div>

        <div className="mb-4 rounded-lg bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-4">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">开始日期</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <span className="text-gray-400">至</span>
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">结束日期</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-lg border border-gray-200 px-3 py-2 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              onClick={handleFilter}
              className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              筛选
            </button>
            <button
              onClick={handleResetFilter}
              className="rounded-lg bg-gray-100 px-4 py-2 text-gray-700 hover:bg-gray-200"
            >
              重置
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <Calendar
              selectedDate={selectedDate}
              onDateSelect={setSelectedDate}
              scheduleDates={scheduleDates}
            />
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  {selectedDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
                </h2>
                <span className="text-sm text-gray-500">
                  共 {selectedDateSchedules.length} 条日程
                </span>
              </div>

              {loading ? (
                <div className="flex h-40 items-center justify-center">
                  <p className="text-gray-500">加载中...</p>
                </div>
              ) : selectedDateSchedules.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center text-gray-400">
                  <CalendarIcon className="mb-2 h-12 w-12" />
                  <p>当日暂无日程</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateSchedules.map((schedule) => (
                    <div
                      key={schedule.id}
                      className={cn(
                        'rounded-lg border p-4 transition-colors',
                        schedule.status === 'scheduled'
                          ? 'border-blue-100 bg-blue-50/30 hover:border-blue-200'
                          : schedule.status === 'completed'
                          ? 'border-green-100 bg-green-50/30 hover:border-green-200'
                          : 'border-gray-100 bg-gray-50/30 hover:border-gray-200'
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="flex flex-col items-center">
                            <Clock className="h-5 w-5 text-gray-400" />
                            <div className="mt-1 h-8 w-0.5 bg-gray-200" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm font-medium text-gray-600">
                                {formatTime(schedule.start_time)} - {formatTime(schedule.end_time)}
                              </span>
                              <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusConfig[schedule.status]?.className)}>
                                {statusConfig[schedule.status]?.label}
                              </span>
                            </div>
                            <div className="mt-2 flex items-center gap-2 text-gray-700">
                              <Home className="h-4 w-4 text-gray-400" />
                              <span className="font-medium">{schedule.house_title || '未知房源'}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-sm text-gray-500">
                              <User className="h-4 w-4 text-gray-400" />
                              <span>客户：{schedule.client_name || '未知客户'}</span>
                            </div>
                            {schedule.remark && (
                              <p className="mt-2 text-sm text-gray-500">
                                备注：{schedule.remark}
                              </p>
                            )}
                          </div>
                        </div>

                        {schedule.status === 'scheduled' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleComplete(schedule.id)}
                              className="rounded-lg bg-green-500 p-2 text-white hover:bg-green-600"
                              title="标记完成"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleCancel(schedule.id)}
                              className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600"
                              title="取消日程"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

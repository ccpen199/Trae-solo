import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Calendar as CalendarIcon, Clock, Users, AlertCircle, ChevronLeft, ChevronRight, Building2 } from 'lucide-react'
import { api } from '../lib/api'

const eventTypes = ['婚礼', '生日宴', '商务会议', '公司年会', '满月酒', '寿宴', '其他']

export default function Bookings() {
  const [bookings, setBookings] = useState<any[]>([])
  const [halls, setHalls] = useState<any[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editingBooking, setEditingBooking] = useState<any>(null)
  const [conflictWarning, setConflictWarning] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    hall_id: '',
    booking_date: new Date().toISOString().split('T')[0],
    start_time: '10:00',
    end_time: '14:00',
    tables_count: '',
    min_consumption: '',
    customer_name: '',
    customer_phone: '',
    event_type: '婚礼',
    status: 'pending',
    notes: '',
  })

  useEffect(() => {
    loadData()
  }, [currentDate])

  async function loadData() {
    try {
      const [bookingsRes, hallsRes] = await Promise.all([
        api.bookings.calendar(),
        api.halls.list({ status: 'active' }),
      ])
      setBookings(bookingsRes.data)
      setHalls(hallsRes.data)
    } catch (error) {
      console.error('加载数据失败', error)
    }
  }

  async function checkConflict() {
    if (!formData.hall_id || !formData.booking_date || !formData.start_time || !formData.end_time) {
      setConflictWarning(null)
      return
    }
    
    try {
      const res: any = await api.bookings.checkConflict({
        hall_id: Number(formData.hall_id),
        booking_date: formData.booking_date,
        start_time: formData.start_time,
        end_time: formData.end_time,
      })
      
      if (res.data.conflict) {
        setConflictWarning(`档期冲突！该时段已有 ${res.data.existingBooking.customer_name} 的预订`)
      } else {
        setConflictWarning(null)
      }
    } catch (error) {
      setConflictWarning(null)
    }
  }

  function handleOpenModal(booking?: any) {
    if (booking) {
      setEditingBooking(booking)
      setFormData({
        hall_id: booking.hall_id,
        booking_date: booking.booking_date,
        start_time: booking.start_time,
        end_time: booking.end_time,
        tables_count: booking.tables_count,
        min_consumption: booking.min_consumption,
        customer_name: booking.customer_name,
        customer_phone: booking.customer_phone || '',
        event_type: booking.event_type,
        status: booking.status,
        notes: booking.notes || '',
      })
    } else {
      setEditingBooking(null)
      setFormData({
        hall_id: halls[0]?.id || '',
        booking_date: new Date().toISOString().split('T')[0],
        start_time: '10:00',
        end_time: '14:00',
        tables_count: '',
        min_consumption: '',
        customer_name: '',
        customer_phone: '',
        event_type: '婚礼',
        status: 'pending',
        notes: '',
      })
    }
    setConflictWarning(null)
    setShowModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        hall_id: Number(formData.hall_id),
        tables_count: Number(formData.tables_count),
        min_consumption: Number(formData.min_consumption),
      }
      
      if (editingBooking) {
        await api.bookings.update(editingBooking.id, data)
      } else {
        await api.bookings.create(data)
      }
      
      setShowModal(false)
      loadData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确定要删除这个预订吗？')) return
    try {
      await api.bookings.delete(id)
      loadData()
    } catch (error: any) {
      alert(error.message)
    }
  }

  function getCalendarDays() {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const days: Date[] = []
    
    for (let i = firstDay.getDay() - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i))
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i))
    }
    
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      days.push(new Date(year, month + 1, i))
    }
    
    return days
  }

  function getBookingsForDate(date: Date) {
    const dateStr = date.toISOString().split('T')[0]
    return bookings.filter(b => b.booking_date === dateStr)
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-yellow-500',
    confirmed: 'bg-green-500',
    completed: 'bg-blue-500',
    cancelled: 'bg-gray-400',
  }

  const statusLabels: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    completed: '已完成',
    cancelled: '已取消',
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <p className="text-gray-500">管理宴会档期，支持日历视图和列表视图</p>
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
              }`}
            >
              日历
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm ${
                viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-gray-600'
              }`}
            >
              列表
            </button>
          </div>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          新建预订
        </button>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="text-lg font-semibold">
                {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
              </span>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              今天
            </button>
          </div>
          
          <div className="grid grid-cols-7 border-b border-gray-100">
            {['日', '一', '二', '三', '四', '五', '六'].map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7">
            {getCalendarDays().map((date, index) => {
              const dayBookings = getBookingsForDate(date)
              const isCurrentMonth = date.getMonth() === currentDate.getMonth()
              const isToday = date.toDateString() === new Date().toDateString()
              
              return (
                <div
                  key={index}
                  className={`min-h-32 p-2 border-b border-r border-gray-100 ${
                    isCurrentMonth ? '' : 'bg-gray-50'
                  }`}
                >
                  <div className={`text-sm mb-2 ${
                    isToday ? 'bg-blue-600 text-white w-7 h-7 rounded-full flex items-center justify-center' :
                    isCurrentMonth ? 'text-gray-700' : 'text-gray-400'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayBookings.slice(0, 3).map((booking: any) => (
                      <div
                        key={booking.id}
                        className={`p-1.5 rounded text-xs text-white ${statusColors[booking.status]} cursor-pointer hover:opacity-80`}
                        onClick={() => handleOpenModal(booking)}
                      >
                        <div className="font-medium truncate">{booking.customer_name}</div>
                        <div className="opacity-80">{booking.start_time} {booking.hall_name}</div>
                      </div>
                    ))}
                    {dayBookings.length > 3 && (
                      <div className="text-xs text-gray-500 pl-1">
                        +{dayBookings.length - 3} 更多
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">日期</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">时间</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">宴会厅</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">客户</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">活动类型</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">桌数</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">状态</th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">操作</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking: any) => (
                  <tr key={booking.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-gray-400" />
                        <span>{booking.booking_date}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{booking.start_time}-{booking.end_time}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-gray-400" />
                        <span>{booking.hall_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">{booking.customer_name}</td>
                    <td className="px-6 py-4">{booking.event_type}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1">
                        <Users className="w-4 h-4 text-gray-400" />
                        <span>{booking.tables_count}桌</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${statusColors[booking.status]}`}>
                        {statusLabels[booking.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleOpenModal(booking)}
                          className="p-1 text-gray-500 hover:text-blue-600"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(booking.id)}
                          className="p-1 text-gray-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold">
                {editingBooking ? '编辑预订' : '新建预订'}
              </h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {conflictWarning && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  {conflictWarning}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">宴会厅 *</label>
                  <select
                    value={formData.hall_id}
                    onChange={(e) => {
                      setFormData({ ...formData, hall_id: e.target.value })
                      setTimeout(checkConflict, 100)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {halls.map(hall => (
                      <option key={hall.id} value={hall.id}>
                        {hall.name} (最大{hall.capacity}桌)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">活动类型 *</label>
                  <select
                    value={formData.event_type}
                    onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    {eventTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">预订日期 *</label>
                <input
                  type="date"
                  value={formData.booking_date}
                  onChange={(e) => {
                    setFormData({ ...formData, booking_date: e.target.value })
                    setTimeout(checkConflict, 100)
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">开始时间 *</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => {
                      setFormData({ ...formData, start_time: e.target.value })
                      setTimeout(checkConflict, 100)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">结束时间 *</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => {
                      setFormData({ ...formData, end_time: e.target.value })
                      setTimeout(checkConflict, 100)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">桌数 *</label>
                  <input
                    type="number"
                    value={formData.tables_count}
                    onChange={(e) => setFormData({ ...formData, tables_count: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">最低消费</label>
                  <input
                    type="number"
                    value={formData.min_consumption}
                    onChange={(e) => setFormData({ ...formData, min_consumption: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">客户姓名 *</label>
                  <input
                    type="text"
                    value={formData.customer_name}
                    onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">联系电话</label>
                  <input
                    type="tel"
                    value={formData.customer_phone}
                    onChange={(e) => setFormData({ ...formData, customer_phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {editingBooking && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="pending">待确认</option>
                    <option value="confirmed">已确认</option>
                    <option value="completed">已完成</option>
                    <option value="cancelled">已取消</option>
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">备注</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  disabled={!!conflictWarning}
                >
                  {editingBooking ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

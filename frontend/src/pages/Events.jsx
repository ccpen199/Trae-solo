import React, { useState, useEffect } from 'react'
import api from '../utils/api'

export default function Events() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadEvents()
  }, [filter])

  const loadEvents = async () => {
    try {
      const url = filter === 'all' ? '/social/events' : `/social/events?status=${filter}`
      const res = await api.get(url)
      setEvents(res.data.events || [])
    } catch (err) {
      console.error('Failed to load events:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId) => {
    try {
      await api.post(`/social/events/${eventId}/register`)
      alert('报名成功！')
      loadEvents()
    } catch (err) {
      alert(err.response?.data?.error || '报名失败')
    }
  }

  const statusColors = {
    upcoming: 'bg-blue-100 text-blue-700',
    ongoing: 'bg-green-100 text-green-700',
    completed: 'bg-gray-100 text-gray-700',
    cancelled: 'bg-red-100 text-red-700'
  }

  const statusLabels = {
    upcoming: '即将开始',
    ongoing: '进行中',
    completed: '已结束',
    cancelled: '已取消'
  }

  if (loading) {
    return <div className="text-center py-20 text-gray-500">加载中...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">赛事活动</h2>
        <div className="flex space-x-2">
          {['all', 'upcoming', 'ongoing', 'completed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-white text-gray-600 hover:bg-gray-50 shadow-sm'
              }`}
            >
              {f === 'all' ? '全部' : statusLabels[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {events.length > 0 ? (
          events.map(event => (
            <div key={event.id} className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center text-3xl">
                    🎯
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-800">{event.title}</h3>
                    <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                      <span>🏆 {event.club_name}</span>
                      <span>📍 {event.location || '待定'}</span>
                      <span>👥 {event.participant_count || 0} 人</span>
                    </div>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[event.status] || ''}`}>
                  {statusLabels[event.status] || event.status}
                </span>
              </div>

              {event.description && (
                <p className="text-gray-600 text-sm mt-4">{event.description}</p>
              )}

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
                <div className="text-sm text-gray-500">
                  开始时间: {new Date(event.start_time).toLocaleString('zh-CN')}
                </div>
                {event.status === 'upcoming' && (
                  <button
                    onClick={() => handleRegister(event.id)}
                    className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    立即报名
                  </button>
                )}
                {event.status === 'completed' && (
                  <span className="text-gray-400 text-sm">活动已结束</span>
                )}
              </div>

              {event.max_participants && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>报名进度</span>
                    <span>{event.participant_count || 0} / {event.max_participants}</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full"
                      style={{ width: `${((event.participant_count || 0) / event.max_participants) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400">
            <div className="text-5xl mb-4">🎯</div>
            <p>暂无赛事活动</p>
          </div>
        )}
      </div>
    </div>
  )
}

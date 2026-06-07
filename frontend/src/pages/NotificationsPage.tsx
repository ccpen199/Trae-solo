import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Heart, MessageCircle, UserPlus, DollarSign, Check, CheckCheck, Loader2 } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import api from '../utils/api'

dayjs.locale('zh-cn')

interface Notification {
  id: number
  type: string
  content: string
  is_read: boolean
  created_at: string
  related_id?: number
  actor_id?: number
  actor_nickname?: string
  actor_avatar?: string
}

const typeIcons: Record<string, any> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  tip: DollarSign,
  system: Bell,
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/notifications', { params: { limit: 50 } }).then(res => {
      if (res.data.code === 0) {
        setNotifications(res.data.data.list || res.data.data || [])
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/api/notifications/${id}/read`)
      setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, is_read: true } : n)
      )
    } catch {}
  }

  const markAllRead = async () => {
    try {
      await api.put('/api/notifications/read-all')
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Bell className="w-6 h-6" />通知
        </h1>
        {notifications.some(n => !n.is_read) && (
          <button onClick={markAllRead} className="btn-ghost text-xs gap-1">
            <CheckCheck className="w-4 h-4" />全部已读
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无通知</p>
        </div>
      ) : (
        <div className="card divide-y divide-gray-100">
          {notifications.map(notification => {
            const Icon = typeIcons[notification.type] || Bell
            return (
              <div
                key={notification.id}
                className={`flex items-start gap-3 p-4 ${!notification.is_read ? 'bg-primary-50/50' : ''}`}
              >
                <div className={`p-2 rounded-full shrink-0 ${
                  notification.type === 'like' ? 'bg-red-50 text-red-500' :
                  notification.type === 'comment' ? 'bg-blue-50 text-blue-500' :
                  notification.type === 'follow' ? 'bg-green-50 text-green-500' :
                  notification.type === 'tip' ? 'bg-yellow-50 text-yellow-500' :
                  'bg-gray-50 text-gray-500'
                }`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{notification.content}</p>
                  <p className="text-xs text-gray-400 mt-1">{dayjs(notification.created_at).format('MM-DD HH:mm')}</p>
                </div>
                {!notification.is_read && (
                  <button
                    onClick={() => markAsRead(notification.id)}
                    className="shrink-0 p-1 text-gray-400 hover:text-primary-600"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

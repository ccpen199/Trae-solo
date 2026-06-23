import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { MapPin, Clock, Users, Plus } from 'lucide-react'

interface EventItem {
  id: number
  title: string
  description: string
  location: string
  event_time: string
  max_participants: number
  status: string
  registered_count?: number
}

const GRADIENTS = [
  'from-honghe-red to-honghe-red-dark',
  'from-honghe-blue to-honghe-blue-dark',
  'from-honghe-gold to-honghe-gold-light',
  'from-honghe-green to-honghe-green-light',
]

const getGradient = (id: number) => GRADIENTS[id % GRADIENTS.length]

export default function Events() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<EventItem[]>([])
  const [activeTab, setActiveTab] = useState<'active' | 'ended'>('active')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        const items = data.data || []
        setEvents(items)
      })
      .catch(() => {
        setEvents([
          {
            id: 1,
            title: '元阳梯田日出摄影采风',
            description: '组织摄影爱好者前往元阳多依树拍摄日出',
            location: '元阳县多依树观景台',
            event_time: '2025-12-20 06:00:00',
            max_participants: 30,
            status: 'active',
            registered_count: 12,
          },
          {
            id: 2,
            title: '建水紫陶制作体验工坊',
            description: '由建水紫陶非遗传承人亲自指导',
            location: '建水县紫陶街传承工坊',
            event_time: '2025-12-25 14:00:00',
            max_participants: 15,
            status: 'active',
            registered_count: 8,
          },
          {
            id: 3,
            title: '弥勒温泉跨年派对',
            description: '温泉体验、篝火晚会、民族歌舞表演',
            location: '弥勒市湖泉温泉度假区',
            event_time: '2025-12-31 19:00:00',
            max_participants: 50,
            status: 'active',
            registered_count: 35,
          },
        ])
      })
      .finally(() => setLoading(false))
  }, [])

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    if (isNaN(d.getTime())) return timeStr
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const isEnded = (event: EventItem) => {
    const eventTime = new Date(event.event_time)
    return !isNaN(eventTime.getTime()) && eventTime < new Date()
  }

  const filteredEvents = events.filter((e) =>
    activeTab === 'active' ? !isEnded(e) && e.status !== 'ended' : isEnded(e) || e.status === 'ended'
  )

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="section-title">活动</h1>
        <button
          onClick={() => navigate('/events/create')}
          className="btn-primary text-sm !px-4 !py-2 inline-flex items-center gap-1"
        >
          <Plus className="w-4 h-4" /> 发起活动
        </button>
      </div>

      <div className="flex gap-4 border-b border-warm-200 mb-6">
        <button
          onClick={() => setActiveTab('active')}
          className={`pb-3 px-2 text-sm font-medium transition-all relative ${
            activeTab === 'active' ? 'text-honghe-red' : 'text-warm-500 hover:text-warm-700'
          }`}
        >
          进行中
          {activeTab === 'active' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-honghe-red rounded-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('ended')}
          className={`pb-3 px-2 text-sm font-medium transition-all relative ${
            activeTab === 'ended' ? 'text-honghe-red' : 'text-warm-500 hover:text-warm-700'
          }`}
        >
          已结束
          {activeTab === 'ended' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-honghe-red rounded-full" />
          )}
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="card-static overflow-hidden animate-pulse">
              <div className="h-36 bg-warm-100" />
              <div className="p-4 space-y-2">
                <div className="h-5 bg-warm-100 rounded w-3/4" />
                <div className="h-4 bg-warm-100 rounded w-full" />
                <div className="h-4 bg-warm-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredEvents.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((event) => {
            const registered = event.registered_count ?? Math.floor(Math.random() * (event.max_participants || 30))
            const progress = event.max_participants ? Math.min(100, (registered / event.max_participants) * 100) : 0

            return (
              <Link
                key={event.id}
                to={`/events/${event.id}`}
                className="card overflow-hidden group"
              >
                <div className={`h-36 bg-gradient-to-br ${getGradient(event.id)} flex items-center justify-center text-white/90 relative overflow-hidden`}>
                  <span className="font-serif text-xl font-bold relative z-10 px-4 text-center line-clamp-2">
                    {event.title}
                  </span>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                </div>
                <div className="p-4">
                  <h3 className="font-medium text-warm-800 mb-3 line-clamp-1">{event.title}</h3>

                  <div className="space-y-2 text-sm text-warm-500 mb-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span className="line-clamp-1">{event.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>{formatTime(event.event_time)}</span>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center justify-between text-xs text-warm-500 mb-1.5">
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{registered} / {event.max_participants} 人</span>
                      </div>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2 bg-warm-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-honghe-red rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  <button className="btn-secondary w-full text-sm !py-2">
                    查看详情
                  </button>
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="card-static p-12 text-center text-warm-400">
          暂无{activeTab === 'active' ? '进行中' : '已结束'}的活动
        </div>
      )}
    </div>
  )
}

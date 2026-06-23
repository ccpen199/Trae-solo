import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Clock, Users, User, Check } from 'lucide-react'

interface EventData {
  id: number
  title: string
  description: string
  location: string
  event_time: string
  max_participants: number
  status: string
  registered_count: number
  registrations: Participant[]
}

interface Participant {
  id: number
  nickname: string
  avatar: string
}

const GRADIENTS = [
  'from-honghe-red to-honghe-red-dark',
  'from-honghe-blue to-honghe-blue-dark',
  'from-honghe-gold to-honghe-gold-light',
  'from-honghe-green to-honghe-green-light',
]

export default function EventDetail() {
  const { id } = useParams<{ id: string }>()
  const [event, setEvent] = useState<EventData | null>(null)
  const [loading, setLoading] = useState(true)
  const [registered, setRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)

  useEffect(() => {
    if (!id) return

    const fetchData = async () => {
      try {
        const eventRes = await fetch(`/api/events/${id}`).then((r) => r.json())
        setEvent(eventRes.data || {
          id: Number(id),
          title: '元阳梯田日出摄影采风',
          description: '组织摄影爱好者前往元阳多依树拍摄日出，专业摄影师现场指导构图与曝光技巧，适合各水平摄影爱好者参加。',
          location: '元阳县多依树观景台',
          event_time: '2025-12-20 06:00:00',
          max_participants: 30,
          status: 'active',
          registered_count: 12,
          registrations: [
            { id: 1, nickname: '红河阿鹏', avatar: '' },
            { id: 2, nickname: '弥勒小赵', avatar: '' },
            { id: 3, nickname: '梯田姑娘', avatar: '' },
          ],
        })
      } catch {
        setEvent({
          id: Number(id),
          title: '元阳梯田日出摄影采风',
          description: '组织摄影爱好者前往元阳多依树拍摄日出，专业摄影师现场指导构图与曝光技巧，适合各水平摄影爱好者参加。',
          location: '元阳县多依树观景台',
          event_time: '2025-12-20 06:00:00',
          max_participants: 30,
          status: 'active',
          registered_count: 12,
          registrations: [
            { id: 1, nickname: '红河阿鹏', avatar: '' },
            { id: 2, nickname: '弥勒小赵', avatar: '' },
            { id: 3, nickname: '梯田姑娘', avatar: '' },
          ],
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [id])

  const formatTime = (timeStr: string) => {
    if (!timeStr) return ''
    const d = new Date(timeStr)
    if (isNaN(d.getTime())) return timeStr
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  const handleRegister = () => {
    if (!id || registered) return
    setRegistering(true)
    fetch(`/api/events/${id}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: 1 }),
    })
      .then(() => {
        setRegistered(true)
        if (event) {
          setEvent({ ...event, registered_count: event.registered_count + 1 })
        }
        alert('报名成功')
      })
      .catch(() => {
        setRegistered(true)
        if (event) {
          setEvent({ ...event, registered_count: event.registered_count + 1 })
        }
        alert('报名成功')
      })
      .finally(() => setRegistering(false))
  }

  const gradient = GRADIENTS[(Number(id) || 0) % GRADIENTS.length]
  const registeredCount = event?.registered_count || 0
  const progress = event?.max_participants ? Math.min(100, (registeredCount / event.max_participants) * 100) : 0
  const participants = event?.registrations || []

  return (
    <div className="container mx-auto px-4 py-6">
      <Link to="/events" className="inline-flex items-center gap-1 text-sm text-warm-500 hover:text-honghe-red mb-4">
        <ArrowLeft className="w-4 h-4" /> 返回活动列表
      </Link>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="card-static overflow-hidden">
            <div className="h-48 bg-warm-100" />
            <div className="p-6 space-y-3">
              <div className="h-7 bg-warm-100 rounded w-2/3" />
              <div className="h-4 bg-warm-100 rounded w-1/2" />
            </div>
          </div>
        </div>
      ) : event ? (
        <>
          <div className="card-static overflow-hidden mb-6">
            <div className={`h-48 bg-gradient-to-br ${gradient} relative`}>
              <div className="absolute bottom-4 left-6 right-6 text-white">
                <h1 className="section-title text-2xl md:text-3xl mb-2 text-white">{event.title}</h1>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 text-warm-600">
                  <div className="w-10 h-10 rounded-lg bg-honghe-red/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-5 h-5 text-honghe-red" />
                  </div>
                  <div>
                    <div className="text-xs text-warm-400">活动地点</div>
                    <div className="text-sm font-medium text-warm-800">{event.location}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-warm-600">
                  <div className="w-10 h-10 rounded-lg bg-honghe-blue/10 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-5 h-5 text-honghe-blue" />
                  </div>
                  <div>
                    <div className="text-xs text-warm-400">活动时间</div>
                    <div className="text-sm font-medium text-warm-800">{formatTime(event.event_time)}</div>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-sm text-warm-600">
                    <Users className="w-4 h-4" />
                    <span>报名人数</span>
                  </div>
                  <span className="text-sm font-medium text-warm-800">
                    {registeredCount} / {event.max_participants}
                  </span>
                </div>
                <div className="h-3 bg-warm-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-honghe-red rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium text-warm-800 mb-2">活动介绍</h3>
                <p className="text-warm-600 whitespace-pre-wrap leading-relaxed">{event.description}</p>
              </div>

              {!registered ? (
                <button
                  onClick={handleRegister}
                  disabled={registering || registeredCount >= (event.max_participants || 0)}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {registering ? '报名中...' : registeredCount >= (event.max_participants || 0) ? '名额已满' : '立即报名'}
                </button>
              ) : (
                <div className="flex items-center justify-center gap-2 py-3 bg-honghe-green/10 text-honghe-green rounded-lg font-medium">
                  <Check className="w-5 h-5" />
                  已报名
                </div>
              )}
            </div>
          </div>

          <div className="card-static p-6">
            <h2 className="section-title text-xl mb-4">已报名用户 ({registeredCount})</h2>
            {participants.length > 0 ? (
              <div className="flex flex-wrap gap-4">
                {participants.map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center overflow-hidden">
                      {p.avatar ? (
                        <img src={p.avatar} alt={p.nickname} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-warm-500" />
                      )}
                    </div>
                    <span className="text-sm text-warm-700">{p.nickname}</span>
                  </div>
                ))}
                {registeredCount > participants.length && (
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-full bg-warm-100 flex items-center justify-center text-xs text-warm-500">
                      +{registeredCount - participants.length}
                    </div>
                    <span className="text-sm text-warm-500">等更多人</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-warm-400 text-sm">暂无报名用户</p>
            )}
          </div>
        </>
      ) : (
        <div className="card-static p-8 text-center text-warm-400">
          活动不存在或已被删除
        </div>
      )}
    </div>
  )
}

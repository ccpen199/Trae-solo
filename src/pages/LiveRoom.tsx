import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Send, Users, Heart, Gift, UserPlus, Phone, Eye, Play, Pause, ChevronRight, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { stableImageUrl } from '@/lib/media'
import Danmaku from '@/components/Danmaku'
import PropertyCard from '@/components/PropertyCard'
import { useLiveStore, useAuthStore, useUIStore, DanmakuMessage } from '@/store'

const demoDanmaku: DanmakuMessage[] = [
  { id: 1, userId: 2, username: '购房者小王', content: '这个户型看起来不错啊', createdAt: '2024-01-15T10:00:00Z' },
  { id: 2, userId: 3, username: '装修中', content: '公摊多大？', createdAt: '2024-01-15T10:00:01Z' },
  { id: 3, userId: 4, username: '李先生', content: '学区是哪个学校？', createdAt: '2024-01-15T10:00:02Z' },
  { id: 4, userId: 5, username: '想买房', content: '有优惠吗？', createdAt: '2024-01-15T10:00:03Z' },
  { id: 5, userId: 6, username: '张阿姨', content: '主播讲得真清楚', createdAt: '2024-01-15T10:00:04Z' },
]

const demoProperties = [
  { id: 1, title: '朝阳区豪华三居室 南北通透 学区房', price: 8900000, area: 125, layout: '3室2厅2卫', address: '望京SOHO附近', city: '北京', district: '朝阳区', images: JSON.stringify(['https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'sale' },
  { id: 2, title: '海淀区中关村精装两居室 近地铁', price: 6200000, area: 89, layout: '2室1厅1卫', address: '中关村大街', city: '北京', district: '海淀区', images: JSON.stringify(['https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800&h=600']), propertyType: 'apartment', listingType: 'sale' },
]

export default function LiveRoom() {
  const { id } = useParams<{ id: string }>()
  const [danmakuInput, setDanmakuInput] = useState('')
  const [isPlaying, setIsPlaying] = useState(true)
  const [isFollowing, setIsFollowing] = useState(false)
  const [likeCount, setLikeCount] = useState(2341)
  const [liked, setLiked] = useState(false)
  const wsRef = useRef<WebSocket | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const danmakuIdRef = useRef(100)

  const user = useAuthStore((state) => state.user)
  const showLoginModal = useUIStore((state) => state.showLoginModal)
  const { currentLive, danmakuList, addDanmaku, setCurrentLive, setViewerCount, clearLive } = useLiveStore()

  useEffect(() => {
    setCurrentLive({
      id: Number(id),
      title: '朝阳公园旁精品三居室 直播带看中',
      hostName: '张顾问',
      hostAvatar: '',
      viewerCount: 1256,
    })

    demoDanmaku.forEach((msg, index) => {
      setTimeout(() => addDanmaku(msg), index * 800)
    })

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
      const wsUrl = `${wsProtocol}//${window.location.host}/ws?liveId=${id}`
      wsRef.current = new WebSocket(wsUrl)

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'danmaku') {
            addDanmaku({
              id: danmakuIdRef.current++,
              userId: data.userId,
              username: data.username,
              content: data.content,
              createdAt: new Date().toISOString(),
            })
          } else if (data.type === 'viewerCount') {
            setViewerCount(data.count)
          }
        } catch (e) {
          console.error('WebSocket parse error:', e)
        }
      }

      wsRef.current.onopen = () => {
        console.log('WebSocket connected')
      }

      wsRef.current.onerror = (error) => {
        console.log('WebSocket demo mode, using simulated danmaku')
        const simulateInterval = setInterval(() => {
          const names = ['购房者小王', '装修中', '李先生', '想买房', '张阿姨', '刘女士', '陈先生']
          const contents = ['这个户型真棒', '价格能优惠吗', '学区是哪里', '有样板间吗', '物业费多少', '主播讲得好', '考虑一下']
          const randomMsg: DanmakuMessage = {
            id: danmakuIdRef.current++,
            userId: Math.floor(Math.random() * 100),
            username: names[Math.floor(Math.random() * names.length)],
            content: contents[Math.floor(Math.random() * contents.length)],
            createdAt: new Date().toISOString(),
          }
          addDanmaku(randomMsg)
        }, 3000)
        return () => clearInterval(simulateInterval)
      }
    } catch (e) {
      console.error('WebSocket error:', e)
    }

    const viewerInterval = setInterval(() => {
      setViewerCount(currentLive.viewerCount + Math.floor(Math.random() * 10) - 3)
    }, 5000)

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
      clearInterval(viewerInterval)
      clearLive()
    }
  }, [id])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [danmakuList])

  const handleSendDanmaku = () => {
    if (!danmakuInput.trim()) return

    if (!user) {
      showLoginModal()
      return
    }

    const newDanmaku: DanmakuMessage = {
      id: danmakuIdRef.current++,
      userId: user.id,
      username: user.username,
      content: danmakuInput,
      createdAt: new Date().toISOString(),
    }

    addDanmaku(newDanmaku)

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'danmaku',
        content: danmakuInput,
      }))
    }

    setDanmakuInput('')
  }

  const handleLike = () => {
    setLiked(true)
    setLikeCount(likeCount + 1)
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1">
            <div className="relative rounded-2xl overflow-hidden bg-black aspect-video group">
              <img
                src={stableImageUrl('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&q=80&w=1600&h=900', '直播看房')}
                alt="Live stream"
                className="w-full h-full object-cover"
              />

              <Danmaku messages={danmakuList} isPlaying={isPlaying} />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

              <div className="absolute top-4 left-4 flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded-full">
                  <span className="w-2 h-2 bg-white rounded-full live-pulse" />
                  直播中
                </div>
                <div className="flex items-center gap-1 px-3 py-1.5 bg-black/50 text-white text-sm rounded-full">
                  <Eye size={16} strokeWidth={1.5} />
                  {currentLive.viewerCount.toLocaleString()}
                </div>
              </div>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  {isPlaying ? (
                    <Pause size={28} className="text-teal-600 ml-1" fill="currentColor" strokeWidth={1.5} />
                  ) : (
                    <Play size={28} className="text-teal-600 ml-1" fill="currentColor" strokeWidth={1.5} />
                  )}
                </div>
              </button>

              <div className="absolute bottom-4 left-4 right-4">
                <h2 className="text-white font-bold text-xl mb-2">{currentLive.title}</h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center overflow-hidden">
                    <User size={18} className="text-white" strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="text-white font-medium">{currentLive.hostName}</p>
                    <p className="text-white/60 text-sm">资深房产顾问</p>
                  </div>
                  <button
                    onClick={() => setIsFollowing(!isFollowing)}
                    className={cn(
                      'ml-auto px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                      isFollowing
                        ? 'bg-slate-500 text-white'
                        : 'bg-teal-500 text-white hover:bg-teal-600'
                    )}
                  >
                    {isFollowing ? '已关注' : '+ 关注'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              <button
                onClick={() => {
                  if (!user) {
                    showLoginModal()
                    return
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                <Phone size={18} strokeWidth={1.5} />
                申请连麦
              </button>
              <button
                onClick={() => {
                  if (!user) {
                    showLoginModal()
                    return
                  }
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-colors"
              >
                <Gift size={18} strokeWidth={1.5} />
                抢红包
              </button>
              <button
                onClick={handleLike}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors',
                  liked ? 'bg-rose-500 text-white' : 'bg-white/10 backdrop-blur-sm text-white hover:bg-white/20'
                )}
              >
                <Heart size={18} className={liked ? 'fill-white' : ''} strokeWidth={1.5} />
                {likeCount.toLocaleString()}
              </button>
              <button
                onClick={() => {
                  if (!user) {
                    showLoginModal()
                    return
                  }
                  setIsFollowing(!isFollowing)
                }}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors',
                  isFollowing
                    ? 'bg-slate-500 text-white'
                    : 'bg-teal-500 text-white hover:bg-teal-600'
                )}
              >
                <UserPlus size={18} strokeWidth={1.5} />
                {isFollowing ? '已关注主播' : '关注主播'}
              </button>
            </div>

            <div className="mt-8">
              <h3 className="text-white font-bold text-lg mb-4">直播间挂载房源/案例</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {demoProperties.map((property) => (
                  <PropertyCard key={property.id} {...property} />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:w-96 bg-white rounded-2xl overflow-hidden shadow-xl flex flex-col h-[600px] lg:h-auto">
            <div className="p-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">互动聊天</h3>
                <div className="flex items-center gap-1 text-sm text-slate-500">
                  <Users size={14} strokeWidth={1.5} />
                  {currentLive.viewerCount.toLocaleString()} 在线
                </div>
              </div>
            </div>

            <div
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50"
            >
              {danmakuList.slice(-50).map((msg) => (
                <div key={msg.id} className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-teal-600">{msg.username.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm">
                      <span className="font-medium text-teal-600">{msg.username}：</span>
                      <span className="text-slate-700">{msg.content}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-100">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={danmakuInput}
                  onChange={(e) => setDanmakuInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendDanmaku()}
                  placeholder={user ? '发送弹幕...' : '登录后发送弹幕'}
                  className="flex-1 px-4 py-2.5 bg-slate-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
                <button
                  onClick={handleSendDanmaku}
                  className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors"
                >
                  <Send size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link
            to="/live"
            className="inline-flex items-center gap-2 text-teal-400 hover:text-teal-300 transition-colors"
          >
            返回直播列表
            <ChevronRight size={18} strokeWidth={1.5} />
          </Link>
        </div>
      </div>
    </div>
  )
}

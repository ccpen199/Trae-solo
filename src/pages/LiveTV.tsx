import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Play,
  Pause,
  Eye,
  Tv,
  Clock,
  MessageCircle,
  LogIn,
  Send,
  ChevronRight,
  ShoppingCart,
  Newspaper,
  AlertTriangle,
  RotateCcw,
  Loader2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

type PlayerState = 'idle' | 'playing' | 'paused' | 'buffering' | 'error'

interface Stream {
  id: number
  title: string
  stream_url: string | null
  cover_image: string | null
  description: string | null
  status: 'live' | 'replay'
  viewer_count: number
  started_at: string | null
}

interface NewsItem {
  id: number
  title: string
  summary: string
  cover_image: string | null
  published_at: string
  view_count: number
}

interface Product {
  id: number
  name: string
  price: number
  original_price: number
  cover_image: string | null
  sales: number
}

interface ScheduleItem {
  time: string
  name: string
  desc: string
  hour: number
}

interface Comment {
  text: string
  user: string
  time: string
}

const SCHEDULE: ScheduleItem[] = [
  { time: '06:30', name: '贵州早安', desc: '早间综合资讯', hour: 6 },
  { time: '07:00', name: '百姓关注晨报', desc: '民生新闻速递', hour: 7 },
  { time: '08:00', name: '行风热线', desc: '政风行风监督', hour: 8 },
  { time: '12:00', name: '午间新闻', desc: '午间资讯汇总', hour: 12 },
  { time: '12:30', name: '法制第一线', desc: '法治新闻报道', hour: 12 },
  { time: '18:30', name: '百姓关注', desc: '栏目核心时段 民生深度报道', hour: 18 },
  { time: '19:00', name: '贵州新闻联播', desc: '全省时政要闻', hour: 19 },
  { time: '19:30', name: '关注·REPORT', desc: '热点深度调查', hour: 19 },
  { time: '20:00', name: '多彩贵州', desc: '文旅宣传栏目', hour: 20 },
  { time: '22:00', name: '晚间新闻', desc: '晚间资讯总结', hour: 22 },
  { time: '22:30', name: '百姓关注夜线', desc: '夜间民生服务', hour: 22 },
]

const INITIAL_COMMENTS: Comment[] = [
  { text: '节目很精彩！', user: '贵阳观众', time: '3分钟前' },
  { text: '关注百姓关注，关注贵州发展', user: '遵义观众', time: '5分钟前' },
  { text: '希望能多报道农村教育', user: '毕节观众', time: '8分钟前' },
]

const LIVE_COMMENTS_POOL = [
  '讲得好！',
  '关注！',
  '求回放链接',
  '太精彩了！',
  '支持百姓关注！',
  '贵州加油！',
  '这个话题很重要',
  '学到了很多',
  '点赞！',
  '希望能多播这样的节目',
  '主持人说得对',
  '我们村也遇到过类似的情况',
  '回放什么时候上？',
  '转发了！',
  '老家遵义，支持！',
]

const SIMULATED_USERS = [
  '贵阳观众', '遵义观众', '毕节观众', '六盘水观众',
  '安顺观众', '铜仁观众', '黔东南观众', '黔南观众',
  '黔西南观众', '贵州老乡',
]

const REPLAY_TOTAL_SECONDS = 120

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getColumnAttribution(title: string): string {
  if (title.includes('百姓关注') || title.includes('新闻') || title.includes('法制') || title.includes('行风')) {
    return '百姓关注'
  }
  return '综合频道'
}

export default function LiveTV() {
  const [streams, setStreams] = useState<Stream[]>([])
  const [activeStream, setActiveStream] = useState<Stream | null>(null)
  const [loading, setLoading] = useState(true)
  const [playerState, setPlayerState] = useState<PlayerState>('idle')
  const [currentTime, setCurrentTime] = useState(0)
  const [replayFinished, setReplayFinished] = useState(false)
  const [showRecommendations, setShowRecommendations] = useState(false)
  const [news, setNews] = useState<NewsItem[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loadingNews, setLoadingNews] = useState(true)
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [commentText, setCommentText] = useState('')
  const [comments, setComments] = useState<Comment[]>(INITIAL_COMMENTS)
  const { isLoggedIn } = useAuthStore()

  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const commentIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bufferingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  const currentHour = new Date().getHours()

  const currentScheduleIndex = useMemo(() => {
    let idx = 0
    for (let i = SCHEDULE.length - 1; i >= 0; i--) {
      if (currentHour >= SCHEDULE[i].hour) {
        idx = i
        break
      }
    }
    return idx
  }, [currentHour])

  const clearProgressInterval = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current)
      progressIntervalRef.current = null
    }
  }, [])

  const clearCommentInterval = useCallback(() => {
    if (commentIntervalRef.current) {
      clearInterval(commentIntervalRef.current)
      commentIntervalRef.current = null
    }
  }, [])

  const clearBufferingTimeout = useCallback(() => {
    if (bufferingTimeoutRef.current) {
      clearTimeout(bufferingTimeoutRef.current)
      bufferingTimeoutRef.current = null
    }
  }, [])

  const resetPlayer = useCallback(() => {
    clearProgressInterval()
    clearBufferingTimeout()
    setPlayerState('idle')
    setCurrentTime(0)
    setReplayFinished(false)
    setShowRecommendations(false)
  }, [clearProgressInterval, clearBufferingTimeout])

  const startPlayback = useCallback(() => {
    setReplayFinished(false)
    setShowRecommendations(false)
    setPlayerState('buffering')
    clearBufferingTimeout()
    bufferingTimeoutRef.current = setTimeout(() => {
      if (Math.random() < 0.1) {
        setPlayerState('error')
      } else {
        setPlayerState('playing')
      }
    }, 1500)
  }, [clearBufferingTimeout])

  useEffect(() => {
    if (playerState === 'playing' && activeStream?.status === 'replay') {
      clearProgressInterval()
      progressIntervalRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          const next = prev + 1
          if (next >= REPLAY_TOTAL_SECONDS) {
            clearProgressInterval()
            setReplayFinished(true)
            setPlayerState('idle')
            return REPLAY_TOTAL_SECONDS
          }
          return next
        })
      }, 1000)
    }
    return clearProgressInterval
  }, [playerState, activeStream?.status, clearProgressInterval])

  useEffect(() => {
    if (playerState === 'playing') {
      clearCommentInterval()
      commentIntervalRef.current = setInterval(() => {
        const text = LIVE_COMMENTS_POOL[Math.floor(Math.random() * LIVE_COMMENTS_POOL.length)]
        const user = SIMULATED_USERS[Math.floor(Math.random() * SIMULATED_USERS.length)]
        setComments((prev) => [...prev.slice(-19), { text, user, time: '刚刚' }])
      }, 8000)
    }
    return clearCommentInterval
  }, [playerState, clearCommentInterval])

  useEffect(() => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  useEffect(() => {
    return () => {
      clearProgressInterval()
      clearCommentInterval()
      clearBufferingTimeout()
    }
  }, [clearProgressInterval, clearCommentInterval, clearBufferingTimeout])

  useEffect(() => {
    api
      .get<Stream[]>('/live-streams')
      .then((data) => {
        setStreams(data)
        if (data.length > 0) setActiveStream(data[0])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api
      .get<{ list: NewsItem[]; total: number }>('/news?page=1&pageSize=3')
      .then((data) => setNews(data.list ?? []))
      .catch(() => {})
      .finally(() => setLoadingNews(false))
  }, [])

  useEffect(() => {
    api
      .get<{ list: Product[]; total: number }>('/products?page=1&pageSize=3&is_featured=1')
      .then((data) => setProducts(data.list ?? []))
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [])

  const handleSelectStream = useCallback((stream: Stream) => {
    resetPlayer()
    setActiveStream(stream)
    if (stream.status === 'live') {
      startPlayback()
    }
  }, [resetPlayer, startPlayback])

  const handlePlayClick = useCallback(() => {
    if (playerState === 'idle' || playerState === 'error') {
      startPlayback()
    } else if (playerState === 'paused') {
      setPlayerState('playing')
    }
  }, [playerState, startPlayback])

  const handlePauseClick = useCallback(() => {
    if (playerState === 'playing') {
      setPlayerState('paused')
    }
  }, [playerState])

  const handleRetryClick = useCallback(() => {
    startPlayback()
  }, [startPlayback])

  const handleReplayClick = useCallback(() => {
    setCurrentTime(0)
    setReplayFinished(false)
    setShowRecommendations(false)
    startPlayback()
  }, [startPlayback])

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeStream || activeStream.status !== 'replay') return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    const newTime = Math.floor(ratio * REPLAY_TOTAL_SECONDS)
    setCurrentTime(newTime)
    if (newTime >= REPLAY_TOTAL_SECONDS) {
      setReplayFinished(true)
      setPlayerState('idle')
    }
  }, [activeStream])

  const handleScheduleReplay = useCallback((item: ScheduleItem) => {
    const match = streams.find((s) => s.status === 'replay' && s.title.includes(item.name))
    if (match) {
      resetPlayer()
      setActiveStream(match)
      startPlayback()
    } else {
      resetPlayer()
      setActiveStream({
        id: -(Date.now()),
        title: item.name,
        stream_url: null,
        cover_image: null,
        description: item.desc,
        status: 'replay',
        viewer_count: 0,
        started_at: new Date().toISOString(),
      })
      startPlayback()
    }
  }, [streams, resetPlayer, startPlayback])

  const handleSendComment = useCallback(() => {
    if (!commentText.trim()) return
    setComments((prev) => [...prev.slice(-19), { text: commentText.trim(), user: '我', time: '刚刚' }])
    setCommentText('')
  }, [commentText])

  const handleCloseRecommendations = useCallback(() => {
    setShowRecommendations(false)
  }, [])

  useEffect(() => {
    if (replayFinished && activeStream) {
      const timer = setTimeout(() => setShowRecommendations(true), 800)
      return () => clearTimeout(timer)
    }
  }, [replayFinished, activeStream])

  const isLive = activeStream?.status === 'live'
  const progressRatio = isLive ? 0 : currentTime / REPLAY_TOTAL_SECONDS

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="bg-gray-200 rounded-xl aspect-video mb-4" />
          <div className="flex gap-3 mb-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-48 h-20 bg-gray-200 rounded-lg shrink-0" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-gray-200 rounded-xl h-96" />
            <div className="bg-gray-200 rounded-xl h-96" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <div className="text-sm text-gray-500 mb-2">
          <Link to="/" className="hover:text-red-600">首页</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-800">直播</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          {activeStream && (
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              {(playerState === 'idle' || playerState === 'paused' || playerState === 'error') && activeStream.cover_image && (
                <img
                  src={activeStream.cover_image}
                  alt={activeStream.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-30"
                />
              )}

              {playerState === 'idle' && !replayFinished && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center z-10">
                  <button
                    onClick={handlePlayClick}
                    className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors mb-3"
                  >
                    <Play className="w-10 h-10 text-white ml-1" />
                  </button>
                  <span className="text-white/70 text-sm">点击播放</span>
                </div>
              )}

              {playerState === 'buffering' && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center z-10">
                  <Loader2 className="w-12 h-12 text-white animate-spin mb-3" />
                  <span className="text-white/70 text-sm">加载中...</span>
                </div>
              )}

              {playerState === 'playing' && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/80 to-purple-900/80 flex items-center justify-center z-10"
                  onClick={handlePauseClick}
                >
                  <div className="absolute top-6 left-6 flex items-center gap-2">
                    <Tv className="w-8 h-8 text-white/40" />
                    <span className="text-white/40 text-lg font-bold">{activeStream.title}</span>
                  </div>
                  <div className="text-white/10 text-6xl font-bold select-none">
                    {activeStream.title}
                  </div>
                </div>
              )}

              {playerState === 'paused' && (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-indigo-900/80 to-purple-900/80 flex flex-col items-center justify-center z-10">
                  <button
                    onClick={handlePlayClick}
                    className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors mb-3"
                  >
                    <Play className="w-10 h-10 text-white ml-1" />
                  </button>
                  <span className="text-white/70 text-sm">已暂停</span>
                </div>
              )}

              {playerState === 'error' && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center z-10">
                  <AlertTriangle className="w-12 h-12 text-red-400 mb-3" />
                  <p className="text-white/70 text-sm mb-4">播放失败，请稍后重试</p>
                  <button
                    onClick={handleRetryClick}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    重新加载
                  </button>
                </div>
              )}

              {replayFinished && playerState === 'idle' && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center z-10">
                  <p className="text-white/70 text-base mb-4">播放完毕</p>
                  <button
                    onClick={handleReplayClick}
                    className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    重新播放
                  </button>
                </div>
              )}

              {playerState === 'playing' && (
                <button
                  onClick={(e) => { e.stopPropagation(); handlePauseClick() }}
                  className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
                >
                  <Pause className="w-5 h-5 text-white" />
                </button>
              )}

              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-5 pb-4 pt-12">
                <div className="flex items-center gap-3 mb-2">
                  {activeStream.status === 'live' ? (
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-500 text-white flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                      LIVE
                    </span>
                  ) : (
                    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-blue-500 text-white">
                      回放
                    </span>
                  )}
                  <h2 className="text-white text-lg font-bold">{activeStream.title}</h2>
                </div>

                {isLive ? (
                  <div className="flex items-center gap-2">
                    <span className="text-red-400 text-xs font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-red-400 rounded-full animate-pulse" />
                      ● 直播中
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div
                      className="flex-1 h-1.5 bg-white/20 rounded-full cursor-pointer group"
                      onClick={handleProgressClick}
                    >
                      <div
                        className="h-full bg-red-500 rounded-full relative transition-all group-hover:bg-red-400"
                        style={{ width: `${progressRatio * 100}%` }}
                      >
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                    <span className="text-white/60 text-xs font-mono shrink-0">
                      {formatTime(currentTime)} / {formatTime(REPLAY_TOTAL_SECONDS)}
                    </span>
                  </div>
                )}
              </div>

              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/50 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-full">
                <Eye className="w-4 h-4" />
                <span>{activeStream.viewer_count.toLocaleString()}</span>
              </div>
            </div>
          )}

          {!activeStream && streams.length === 0 && (
            <div className="bg-black rounded-xl aspect-video flex items-center justify-center">
              <p className="text-gray-500">暂无直播</p>
            </div>
          )}

          {streams.length > 0 && (
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {streams.map((stream) => (
                <button
                  key={stream.id}
                  onClick={() => handleSelectStream(stream)}
                  className={`shrink-0 w-52 bg-white rounded-lg border-2 p-3 text-left transition-all hover:shadow-md ${
                    activeStream?.id === stream.id
                      ? 'border-red-500 ring-2 ring-red-200'
                      : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    {stream.status === 'live' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500 text-white flex items-center gap-1">
                        <span className="w-1 h-1 bg-white rounded-full animate-pulse" />
                        LIVE
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500 text-white">
                        回放
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                      <Eye className="w-3 h-3" />
                      {stream.viewer_count.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-gray-800 line-clamp-1">{stream.title}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {activeStream && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 h-full">
              <div className="flex items-center gap-2 mb-3">
                <Tv className="w-5 h-5 text-red-600" />
                <h3 className="font-bold text-lg">{activeStream.title}</h3>
              </div>
              {activeStream.description && (
                <p className="text-gray-500 text-sm mb-4">{activeStream.description}</p>
              )}
              <div className="mb-4">
                <span className="text-xs text-gray-400">
                  所属栏目：{getColumnAttribution(activeStream.title)}
                </span>
              </div>
              {activeStream.status === 'live' ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    <span className="text-sm text-red-600 font-medium">正在直播</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-500">
                    <Eye className="w-4 h-4" />
                    <span>{activeStream.viewer_count.toLocaleString()} 人正在观看</span>
                  </div>
                  <button
                    onClick={() => {
                      resetPlayer()
                      startPlayback()
                    }}
                    className="w-full bg-red-600 text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    {playerState === 'playing' ? '播放中' : '进入直播间'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-blue-600 font-medium">回放节目</span>
                  </div>
                  {activeStream.started_at && (
                    <div className="text-sm text-gray-500">
                      原始播出时间：{new Date(activeStream.started_at).toLocaleString('zh-CN')}
                    </div>
                  )}
                  <button
                    onClick={() => {
                      if (playerState !== 'playing' && playerState !== 'buffering') {
                        resetPlayer()
                        startPlayback()
                      }
                    }}
                    className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    观看回放
                  </button>
                </div>
              )}
            </div>
          )}

          {!activeStream && streams.length === 0 && (
            <div className="bg-white rounded-xl border border-gray-100 p-5 h-full flex items-center justify-center">
              <p className="text-gray-400">暂无直播信息</p>
            </div>
          )}
        </div>
      </div>

      {showRecommendations && activeStream && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 relative">
            <h3 className="font-bold text-lg mb-1">相关推荐</h3>
            <p className="text-sm text-gray-500 mb-5">
              刚刚看完 {activeStream.title}，为您推荐
            </p>
            <div className="grid grid-cols-1 gap-3 mb-5">
              {news.slice(0, 2).map((item) => (
                <Link
                  key={item.id}
                  to={`/news/${item.id}`}
                  className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(item.published_at).toLocaleDateString('zh-CN')}</p>
                  </div>
                  <span className="text-xs text-red-600 font-medium shrink-0 self-center">查看详情 →</span>
                </Link>
              ))}
              {products.slice(0, 2).map((product) => (
                <Link
                  key={product.id}
                  to={`/products/${product.id}`}
                  className="flex gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg flex items-center justify-center shrink-0">
                    <ShoppingCart className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{product.name}</p>
                    <span className="text-red-600 font-bold text-sm">¥{product.price}</span>
                  </div>
                  <span className="text-xs text-red-600 font-medium shrink-0 self-center">立即购买 →</span>
                </Link>
              ))}
            </div>
            <button
              onClick={handleCloseRecommendations}
              className="w-full py-2.5 border border-gray-200 rounded-lg text-sm text-gray-600 font-medium hover:bg-gray-50 transition-colors"
            >
              继续浏览
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-lg">节目单</h3>
              <span className="text-xs text-gray-400 ml-auto">
                今日 {new Date().toLocaleDateString('zh-CN')}
              </span>
            </div>
            <div className="space-y-0">
              {SCHEDULE.map((item, idx) => {
                const isPast = idx < currentScheduleIndex
                const isCurrent = idx === currentScheduleIndex
                return (
                  <div
                    key={item.time}
                    className={`flex items-center gap-4 py-3 px-3 rounded-lg transition-colors ${
                      isCurrent
                        ? 'bg-red-50 border border-red-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-sm font-mono w-12 shrink-0 ${
                      isCurrent ? 'text-red-600 font-bold' : 'text-gray-400'
                    }`}>
                      {item.time}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${
                        isCurrent ? 'text-red-600' : isPast ? 'text-gray-500' : 'text-gray-800'
                      }`}>
                        {item.name}
                        {isCurrent && (
                          <span className="ml-2 inline-flex items-center gap-1 text-xs text-red-500">
                            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                            播放中
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{item.desc}</div>
                    </div>
                    <div className="shrink-0">
                      {isPast && (
                        <button
                          onClick={() => handleScheduleReplay(item)}
                          className="text-xs text-blue-500 hover:text-blue-700 font-medium px-3 py-1 rounded-full border border-blue-200 hover:bg-blue-50 transition-colors"
                        >
                          回看
                        </button>
                      )}
                      {isCurrent && (
                        <span className="text-xs text-red-500 font-medium px-3 py-1 rounded-full bg-red-100">
                          正在播放
                        </span>
                      )}
                      {idx > currentScheduleIndex && (
                        <span className="text-xs text-gray-400 px-3 py-1">即将开始</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div>
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MessageCircle className="w-5 h-5 text-red-600" />
              <h3 className="font-bold text-lg">直播互动</h3>
            </div>
            {!isLoggedIn ? (
              <div className="text-center py-6">
                <p className="text-gray-400 text-sm mb-3">登录后可以参与直播互动</p>
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-red-600 text-sm font-medium hover:underline"
                >
                  <LogIn className="w-4 h-4" />
                  立即登录
                </Link>
              </div>
            ) : (
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSendComment() }}
                  placeholder="说点什么..."
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                />
                <button
                  onClick={handleSendComment}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  发送
                </button>
              </div>
            )}
            <div className="border-t border-gray-100 pt-4">
              <p className="text-xs text-gray-400 mb-3">近期互动</p>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {comments.map((c, i) => (
                  <div key={i} className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center shrink-0">
                      <span className="text-[10px] text-red-600 font-bold">{c.user[0]}</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700">{c.user}</span>
                        <span className="text-[10px] text-gray-400">{c.time}</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{c.text}</p>
                    </div>
                  </div>
                ))}
                <div ref={commentsEndRef} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Tv className="w-5 h-5 text-red-600" />
          <h3 className="font-bold text-lg">看完直播，还关注</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <Newspaper className="w-4 h-4 text-red-600" />
                相关新闻
              </h4>
              <Link to="/news" className="text-xs text-red-600 flex items-center gap-0.5 hover:underline">
                更多 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {loadingNews ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : news.length > 0 ? (
              <div className="space-y-3">
                {news.map((item) => (
                  <Link
                    key={item.id}
                    to={`/news/${item.id}`}
                    className="block group"
                  >
                    <div className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 line-clamp-2 group-hover:text-red-600 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(item.published_at).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
                <Link
                  to="/news"
                  className="block text-center text-sm text-red-600 font-medium py-2 hover:underline"
                >
                  查看详情 →
                </Link>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">暂无相关新闻</p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-red-600" />
                推荐好物
              </h4>
              <Link to="/products" className="text-xs text-red-600 flex items-center gap-0.5 hover:underline">
                更多 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            {loadingProducts ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse h-14 bg-gray-100 rounded-lg" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-3">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/products/${product.id}`}
                    className="flex gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                  >
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg flex items-center justify-center shrink-0">
                      <ShoppingCart className="w-5 h-5 text-amber-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 line-clamp-1 group-hover:text-red-600 transition-colors">
                        {product.name}
                      </p>
                      <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-red-600 font-bold text-sm">¥{product.price}</span>
                        {product.original_price > product.price && (
                          <span className="text-xs text-gray-400 line-through">¥{product.original_price}</span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
                <Link
                  to="/products"
                  className="block text-center text-sm text-red-600 font-medium py-2 hover:underline"
                >
                  立即购买 →
                </Link>
              </div>
            ) : (
              <p className="text-gray-400 text-sm text-center py-6">暂无推荐好物</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

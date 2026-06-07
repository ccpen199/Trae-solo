import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Play,
  Eye,
  X,
  ChevronLeft,
  ChevronRight,
  UserCircle,
  Clock,
  Tv,
  MessageSquare,
  AlertTriangle,
  RotateCcw,
  Loader2,
  Tag,
  ArrowRight,
  ShoppingCart,
  Newspaper,
} from 'lucide-react'
import { api } from '@/lib/api'

interface Category {
  id: number
  name: string
}

interface VideoItem {
  id: number
  title: string
  url: string | null
  cover_image: string | null
  duration: number
  category_id: number
  description: string | null
  view_count: number
  author: string | null
  is_published: number
  created_at: string
}

interface VideoResponse {
  list: VideoItem[]
  total: number
  page: number
  pageSize: number
}

interface LiveStream {
  id: number
  title: string
  cover_image: string | null
  description: string | null
  status: string
  viewer_count: number
  started_at: string | null
}

interface TopicItem {
  id: number
  title: string
  description: string | null
  participant_count: number
  status: string
}

interface TopicResponse {
  list: TopicItem[]
  total: number
  page: number
  pageSize: number
}

type PlayerState = 'idle' | 'buffering' | 'playing' | 'ended' | 'error'

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  if (diff < 2592000) return `${Math.floor(diff / 86400)}天前`
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className ?? ''}`} />
}

export default function Videos() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState<Category[]>([])
  const [videos, setVideos] = useState<VideoItem[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([])
  const [loadingLive, setLoadingLive] = useState(true)
  const [topics, setTopics] = useState<TopicItem[]>([])
  const [loadingTopics, setLoadingTopics] = useState(true)

  const [playerVideo, setPlayerVideo] = useState<VideoItem | null>(null)
  const [playerState, setPlayerState] = useState<PlayerState>('idle')
  const [playerProgress, setPlayerProgress] = useState(0)
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const bufferingRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const categoryId = searchParams.get('category_id') || ''
  const page = Number(searchParams.get('page') || '1')

  const clearTimers = useCallback(() => {
    if (progressRef.current) {
      clearInterval(progressRef.current)
      progressRef.current = null
    }
    if (bufferingRef.current) {
      clearTimeout(bufferingRef.current)
      bufferingRef.current = null
    }
  }, [])

  useEffect(() => {
    api.get<Category[]>('/categories?type=video')
      .then(setCategories)
      .catch(() => {})
      .finally(() => setLoadingCategories(false))
  }, [])

  useEffect(() => {
    setLoadingVideos(true)
    const params = new URLSearchParams()
    params.set('page', String(page))
    params.set('pageSize', '12')
    if (categoryId) params.set('category_id', categoryId)
    api.get<VideoResponse>(`/videos?${params.toString()}`)
      .then((data) => {
        setVideos(data.list)
        setTotalPages(Math.ceil(data.total / data.pageSize))
      })
      .catch(() => {})
      .finally(() => setLoadingVideos(false))
  }, [page, categoryId])

  useEffect(() => {
    api.get<LiveStream[]>('/live-streams?status=replay')
      .then((data) => setLiveStreams(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoadingLive(false))
  }, [])

  useEffect(() => {
    api.get<TopicResponse>('/topics?status=active')
      .then((data) => setTopics(data.list ?? []))
      .catch(() => {})
      .finally(() => setLoadingTopics(false))
  }, [])

  useEffect(() => {
    return () => { clearTimers() }
  }, [clearTimers])

  const handleCategoryChange = (id: string) => {
    const params = new URLSearchParams(searchParams)
    if (id) {
      params.set('category_id', id)
    } else {
      params.delete('category_id')
    }
    params.set('page', '1')
    setSearchParams(params)
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams)
    params.set('page', String(newPage))
    setSearchParams(params)
    window.scrollTo(0, 0)
  }

  const handlePlay = (video: VideoItem) => {
    setPlayerVideo(video)
    setPlayerProgress(0)
    setPlayerState('buffering')
    clearTimers()

    if (Math.random() < 0.05) {
      bufferingRef.current = setTimeout(() => {
        setPlayerState('error')
      }, 1500)
      return
    }

    bufferingRef.current = setTimeout(() => {
      setPlayerState('playing')
    }, 1500)
  }

  useEffect(() => {
    if (playerState === 'playing' && playerVideo) {
      clearTimers()
      const total = playerVideo.duration || 120
      progressRef.current = setInterval(() => {
        setPlayerProgress((prev) => {
          const next = prev + 1
          if (next >= total) {
            if (progressRef.current) clearInterval(progressRef.current)
            setPlayerState('ended')
            return total
          }
          return next
        })
      }, 1000)
    }
    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current)
        progressRef.current = null
      }
    }
  }, [playerState, playerVideo, clearTimers])

  const handleClosePlayer = () => {
    clearTimers()
    setPlayerVideo(null)
    setPlayerState('idle')
    setPlayerProgress(0)
  }

  const handleRetry = () => {
    if (!playerVideo) return
    setPlayerProgress(0)
    setPlayerState('buffering')
    clearTimers()

    if (Math.random() < 0.05) {
      bufferingRef.current = setTimeout(() => {
        setPlayerState('error')
      }, 1500)
      return
    }

    bufferingRef.current = setTimeout(() => {
      setPlayerState('playing')
    }, 1500)
  }

  const handleReplay = () => {
    if (!playerVideo) return
    setPlayerProgress(0)
    setPlayerState('buffering')
    clearTimers()
    bufferingRef.current = setTimeout(() => {
      setPlayerState('playing')
    }, 1500)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">短视频新闻</h1>
        <p className="text-red-600 text-lg font-medium">百姓关注 · 视听贵州</p>
      </div>

      <div className="overflow-x-auto mb-8">
        <div className="flex gap-2 whitespace-nowrap pb-2 justify-center">
          <button
            onClick={() => handleCategoryChange('')}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${!categoryId ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >
            全部
          </button>
          {loadingCategories ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="w-16 h-9 rounded-full" />)
          ) : (
            categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryChange(String(cat.id))}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${categoryId === String(cat.id) ? 'bg-red-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {cat.name}
              </button>
            ))
          )}
        </div>
      </div>

      {loadingVideos ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <Skeleton className="h-44 w-full rounded-none" />
              <div className="p-4 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-20 text-gray-400 mb-12">暂无视频</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {videos.map((video) => (
            <div
              key={video.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
            >
              <div className="h-44 bg-gradient-to-br from-red-100 via-orange-100 to-amber-100 flex items-center justify-center relative group cursor-pointer">
                {video.cover_image ? (
                  <img src={video.cover_image} alt={video.title} className="w-full h-full object-cover" />
                ) : (
                  <Play className="w-12 h-12 text-red-400/60" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <Play className="w-14 h-14 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                </div>
                <span className="absolute bottom-2 right-2 bg-black/75 text-white text-xs px-2 py-0.5 rounded font-mono">
                  {formatDuration(video.duration)}
                </span>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2">{video.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                  <UserCircle className="w-3.5 h-3.5 text-red-500" />
                  <span>来源：{video.author || '百姓关注记者'}</span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                  <div className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatRelativeTime(video.created_at)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{video.view_count.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-2">
                  <button
                    onClick={() => handlePlay(video)}
                    className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    <Play className="w-4 h-4" />
                    播放
                  </button>
                  <Link
                    to="/topics"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-red-50 text-red-600 text-xs rounded-full hover:bg-red-100 transition-colors font-medium"
                  >
                    <Tag className="w-3 h-3" />
                    关联话题
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mb-12">
          <button
            onClick={() => handlePageChange(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            <ChevronLeft className="w-4 h-4" />
            上一页
          </button>
          <span className="text-sm text-gray-600">{page} / {totalPages}</span>
          <button
            onClick={() => handlePageChange(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg text-sm border border-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            下一页
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {playerVideo && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-black rounded-2xl overflow-hidden w-full max-w-3xl relative shadow-2xl">
            <button
              onClick={handleClosePlayer}
              className="absolute top-4 right-4 z-30 w-10 h-10 bg-black/60 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            <div className="aspect-video relative">
              {playerState === 'buffering' && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center">
                  <Loader2 className="w-14 h-14 text-white animate-spin mb-4" />
                  <span className="text-white/70 text-sm">缓冲中...</span>
                </div>
              )}

              {playerState === 'playing' && (
                <div className="absolute inset-0 bg-gradient-to-br from-red-900/80 via-orange-900/70 to-amber-900/60 flex items-center justify-center">
                  <div className="absolute top-8 left-8">
                    <h3 className="text-white text-xl font-bold drop-shadow-lg">{playerVideo.title}</h3>
                    {playerVideo.description && (
                      <p className="text-white/60 text-sm mt-1 max-w-md line-clamp-2">{playerVideo.description}</p>
                    )}
                  </div>
                  <Play className="w-24 h-24 text-white/10" />
                </div>
              )}

              {playerState === 'error' && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900 flex flex-col items-center justify-center">
                  <AlertTriangle className="w-14 h-14 text-red-400 mb-4" />
                  <p className="text-white/70 text-sm mb-5">播放出错，请重试</p>
                  <button
                    onClick={handleRetry}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    重新播放
                  </button>
                </div>
              )}

              {playerState === 'ended' && (
                <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-gray-950 flex flex-col items-center justify-center">
                  <p className="text-white/60 text-base mb-6">播放完毕</p>
                  <div className="flex items-center gap-4 mb-6">
                    <button
                      onClick={handleReplay}
                      className="px-5 py-2.5 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      重新播放
                    </button>
                  </div>
                  <div className="w-full max-w-md px-6">
                    <h4 className="text-white font-bold mb-4 text-sm">相关推荐</h4>
                    <div className="space-y-3">
                      <Link
                        to="/news"
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors group"
                      >
                        <Newspaper className="w-5 h-5 text-red-400 shrink-0" />
                        <span className="text-white/80 text-sm group-hover:text-white transition-colors">更多新闻资讯</span>
                        <ArrowRight className="w-4 h-4 text-white/40 ml-auto shrink-0" />
                      </Link>
                      <Link
                        to="/products"
                        className="flex items-center gap-3 p-3 rounded-lg bg-white/10 hover:bg-white/15 transition-colors group"
                      >
                        <ShoppingCart className="w-5 h-5 text-amber-400 shrink-0" />
                        <span className="text-white/80 text-sm group-hover:text-white transition-colors">精选好物推荐</span>
                        <ArrowRight className="w-4 h-4 text-white/40 ml-auto shrink-0" />
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              {playerState !== 'idle' && playerVideo && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-5 pb-4 pt-10 z-10">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-red-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(playerProgress / (playerVideo.duration || 120)) * 100}%` }}
                      />
                    </div>
                    <span className="text-white/60 text-xs font-mono shrink-0">
                      {formatDuration(playerProgress)} / {formatDuration(playerVideo.duration || 120)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <Tv className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">直播回看</h2>
          <Link to="/live" className="ml-auto text-sm text-red-600 hover:underline flex items-center gap-1">
            更多直播 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loadingLive ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}
          </div>
        ) : liveStreams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {liveStreams.slice(0, 3).map((stream) => (
              <div
                key={stream.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-36 bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 flex items-center justify-center relative">
                  {stream.cover_image ? (
                    <img src={stream.cover_image} alt={stream.title} className="w-full h-full object-cover" />
                  ) : (
                    <Tv className="w-10 h-10 text-indigo-400/60" />
                  )}
                  <span className="absolute top-2 right-2 px-2 py-0.5 text-xs rounded-full bg-blue-500 text-white font-medium">
                    回看
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 mb-2 line-clamp-1">{stream.title}</h3>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                    <Eye className="w-3.5 h-3.5" />
                    <span>{stream.viewer_count.toLocaleString()} 人观看</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Link
                      to="/live"
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors font-medium"
                    >
                      <Play className="w-4 h-4" />
                      回看
                    </Link>
                    <Link to="/live" className="text-sm text-red-600 hover:underline flex items-center gap-1">
                      观看回放 <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <Tv className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">暂无直播回看</p>
            <Link to="/live" className="text-red-600 text-sm hover:underline mt-2 inline-block">前往直播间 →</Link>
          </div>
        )}
      </section>

      <section className="mb-12">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="w-5 h-5 text-red-600" />
          <h2 className="text-xl font-bold text-gray-900">热门话题短视频</h2>
          <Link to="/topics" className="ml-auto text-sm text-red-600 hover:underline flex items-center gap-1">
            更多话题 <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        {loadingTopics ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
          </div>
        ) : topics.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.slice(0, 3).map((topic) => (
              <Link
                key={topic.id}
                to={`/topics/${topic.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md hover:border-red-200 transition-all group"
              >
                <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-red-600 transition-colors">
                  {topic.title}
                </h3>
                {topic.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{topic.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <UserCircle className="w-3.5 h-3.5" />
                    {topic.participant_count.toLocaleString()} 人参与
                  </span>
                  <span className="text-sm text-red-600 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    参与讨论 <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-100 p-8 text-center">
            <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">暂无热门话题</p>
            <Link to="/topics" className="text-red-600 text-sm hover:underline mt-2 inline-block">浏览全部话题 →</Link>
          </div>
        )}
      </section>
    </div>
  )
}

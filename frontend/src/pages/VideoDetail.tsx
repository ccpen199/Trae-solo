import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getVideoDetail, likeVideo, getVideoRecommendations } from '../api/client'
import { formatTime, formatNumber } from '../hooks'

interface VideoDetailData {
  id: string
  title: string
  description: string
  duration: number
  view_count: number
  completion_rate: number
  likes: number
  created_at: string
  hotspots?: { x: number; y: number; label: string }[]
  creator?: { id: string; name: string; level: number; avatar?: string }
}

interface RelatedVideo {
  id: string
  title: string
  view_count: number
  duration: number
  created_at: string
}

export default function VideoDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [video, setVideo] = useState<VideoDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [related, setRelated] = useState<RelatedVideo[]>([])
  const [showHotspots, setShowHotspots] = useState(true)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getVideoDetail(id)
      .then((res) => {
        setVideo(res.data)
        setLikeCount(res.data.likes ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    getVideoRecommendations(1, 5)
      .then((res) => setRelated(res.data?.items ?? res.data ?? []))
      .catch(() => {})
  }, [id])

  const handleLike = async () => {
    if (liked || !id) return
    try {
      await likeVideo(id)
      setLiked(true)
      setLikeCount((c) => c + 1)
    } catch {}
  }

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${String(s).padStart(2, '0')}`
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!video) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-gray-500">视频不存在或已被删除</p>
        <button onClick={() => navigate('/videos')} className="btn-primary mt-4 text-sm">返回视频列表</button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-gray-500 hover:text-primary mb-4 transition-colors">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回
      </button>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:bg-white/30 transition-all hover:scale-110">
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="absolute bottom-3 right-3 bg-black/70 text-white text-sm px-2 py-1 rounded">
                {formatDuration(video.duration)}
              </span>

              {showHotspots && video.hotspots && video.hotspots.length > 0 && (
                <>
                  {video.hotspots.map((spot, i) => (
                    <div
                      key={i}
                      className="absolute w-6 h-6 rounded-full bg-primary/60 border-2 border-white cursor-pointer hover:bg-primary transition-all animate-pulse-dot flex items-center justify-center"
                      style={{ left: `${spot.x * 100}%`, top: `${spot.y * 100}%` }}
                      title={spot.label}
                    >
                      <span className="text-[8px] text-white font-bold">{i + 1}</span>
                    </div>
                  ))}
                  <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-dot"></span>
                    互动热点
                  </div>
                </>
              )}

              {video.hotspots && video.hotspots.length > 0 && (
                <button
                  onClick={() => setShowHotspots(!showHotspots)}
                  className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded hover:bg-black/80 transition-colors"
                >
                  {showHotspots ? '隐藏热点' : '显示热点'}
                </button>
              )}
            </div>

            <div className="p-6">
              <h1 className="text-xl font-bold text-gray-900 mb-3">{video.title}</h1>
              <p className="text-sm text-gray-500 mb-4">{video.description}</p>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>👁 {formatNumber(video.view_count)} 播放</span>
                <span>❤️ {formatNumber(likeCount)} 点赞</span>
                <span>{formatTime(video.created_at)}</span>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">播放完成率</span>
                  <span className="text-primary font-semibold">{((video.completion_rate ?? 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${(video.completion_rate ?? 0) * 100}%` }} />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
                <button
                  onClick={handleLike}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
                    liked ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-500 hover:bg-primary/5 hover:text-primary'
                  }`}
                >
                  {liked ? '❤️' : '🤍'} {likeCount}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {video.creator && (
            <div className="card p-4">
              <h4 className="font-semibold text-gray-900 mb-3">创作者</h4>
              <div
                onClick={() => navigate(`/creators/${video.creator!.id}`)}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-bold">
                  {video.creator.name[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{video.creator.name}</p>
                  <p className="text-xs text-gray-500">Lv.{video.creator.level} 创作者</p>
                </div>
              </div>
            </div>
          )}

          <div className="card p-4">
            <h4 className="font-semibold text-gray-900 mb-3">相关视频</h4>
            <div className="space-y-3">
              {related.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/videos/${item.id}`)}
                  className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <p className="text-sm text-gray-700 line-clamp-2 hover:text-primary transition-colors">{item.title}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                    <span>👁 {formatNumber(item.view_count)}</span>
                    <span>{formatDuration(item.duration)}</span>
                    <span>{formatTime(item.created_at)}</span>
                  </div>
                </div>
              ))}
              {related.length === 0 && <p className="text-sm text-gray-400">暂无相关视频</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

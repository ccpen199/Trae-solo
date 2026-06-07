import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getNewsDetail, likeNews, getNewsRecommendations } from '../api/client'
import { formatTime, formatDistance, getCredibilityLabel } from '../hooks'

interface NewsDetailData {
  id: string
  title: string
  content: string
  summary: string
  source: string
  credibility_score: number
  created_at: string
  category: string
  region_tags?: { name: string; weight: number }[]
  distance?: number
  likes: number
  comments_count: number
  creator?: { id: string; name: string; level: number; avatar?: string }
  related_news?: { id: string; title: string; created_at: string }[]
}

export default function NewsDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [news, setNews] = useState<NewsDetailData | null>(null)
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [related, setRelated] = useState<{ id: string; title: string; created_at: string }[]>([])
  const [comment, setComment] = useState('')

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getNewsDetail(id)
      .then((res) => {
        const data = res.data
        setNews(data)
        setLikeCount(data.likes ?? 0)
      })
      .catch(() => {})
      .finally(() => setLoading(false))

    getNewsRecommendations(1, 5)
      .then((res) => setRelated(res.data?.items ?? res.data ?? []))
      .catch(() => {})
  }, [id])

  const handleLike = async () => {
    if (liked || !id) return
    try {
      await likeNews(id)
      setLiked(true)
      setLikeCount((c) => c + 1)
    } catch {}
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!news) {
    return (
      <div className="text-center py-20">
        <p className="text-4xl mb-3">😕</p>
        <p className="text-gray-500">资讯不存在或已被删除</p>
        <button onClick={() => navigate('/news')} className="btn-primary mt-4 text-sm">返回资讯列表</button>
      </div>
    )
  }

  const cred = getCredibilityLabel(news.credibility_score)

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
          <article className="card p-6">
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {news.category && (
                <span className="text-xs text-white bg-primary px-2 py-0.5 rounded">{news.category}</span>
              )}
              <span className={`badge ${cred.color}`}>{cred.text}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-900 mb-4">{news.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-4 border-b border-gray-100">
              <span>来源: {news.source}</span>
              <span>{formatTime(news.created_at)}</span>
              {news.distance != null && (
                <span className="text-primary font-medium">📍 {formatDistance(news.distance)}</span>
              )}
              <span>💬 {news.comments_count} 评论</span>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-gray-700">可信度评分</span>
                <span className="text-sm font-bold text-primary">{(news.credibility_score * 100).toFixed(0)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    news.credibility_score >= 0.8 ? 'bg-green-500' : news.credibility_score >= 0.5 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${news.credibility_score * 100}%` }}
                />
              </div>
            </div>

            <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed whitespace-pre-wrap">
              {news.content}
            </div>

            {news.region_tags && news.region_tags.length > 0 && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">区域标签</h4>
                <div className="flex flex-wrap gap-2">
                  {news.region_tags.map((tag, i) => (
                    <span key={i} className="text-xs bg-blue-50 text-secondary px-2 py-1 rounded">
                      {tag.name} <span className="text-blue-300">({(tag.weight * 100).toFixed(0)}%)</span>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center gap-4">
              <button
                onClick={handleLike}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm transition-all ${
                  liked ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-500 hover:bg-primary/5 hover:text-primary'
                }`}
              >
                {liked ? '❤️' : '🤍'} {likeCount}
              </button>
            </div>
          </article>

          <div className="card p-6">
            <h3 className="font-semibold text-gray-900 mb-4">评论 ({news.comments_count})</h3>
            <div className="flex gap-3 mb-4">
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="写下你的评论..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              />
              <button className="btn-primary text-sm px-4">发送</button>
            </div>
            <p className="text-sm text-gray-400 text-center py-4">暂无评论</p>
          </div>
        </div>

        <div className="space-y-6">
          {news.creator && (
            <div className="card p-4">
              <h4 className="font-semibold text-gray-900 mb-3">创作者信息</h4>
              <div
                onClick={() => navigate(`/creators/${news.creator!.id}`)}
                className="flex items-center gap-3 cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {news.creator.name[0]}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{news.creator.name}</p>
                  <p className="text-xs text-gray-500">Lv.{news.creator.level} 创作者</p>
                </div>
              </div>
            </div>
          )}

          <div className="card p-4">
            <h4 className="font-semibold text-gray-900 mb-3">相关资讯</h4>
            <div className="space-y-3">
              {related.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  onClick={() => navigate(`/news/${item.id}`)}
                  className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                >
                  <p className="text-sm text-gray-700 line-clamp-2 hover:text-primary transition-colors">{item.title}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatTime(item.created_at)}</p>
                </div>
              ))}
              {related.length === 0 && <p className="text-sm text-gray-400">暂无相关资讯</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

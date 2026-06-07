import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Heart, Bookmark, Share2, MessageCircle, MapPin, Clock, Edit3, DollarSign, Loader2 } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import api from '../utils/api'
import { isAuthenticated, getCurrentUser } from '../utils/auth'
import TopicBadge from '../components/TopicBadge'
import CommentSection from '../components/CommentSection'

dayjs.locale('zh-cn')

function parseJsonField(val: any): any[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { return JSON.parse(val) } catch { return [] }
  }
  return []
}

export default function ContentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [content, setContent] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [related, setRelated] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [liked, setLiked] = useState(false)
  const [collected, setCollected] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [collectsCount, setCollectsCount] = useState(0)
  const [tipAmount, setTipAmount] = useState('')
  const [showTip, setShowTip] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const currentUser = getCurrentUser()

  const fetchData = async () => {
    try {
      const res = await api.get(`/api/contents/${id}`)
      if (res.data.code === 0) {
        const data = res.data.data
        setContent(data)
        setLiked(data.isLiked || false)
        setCollected(data.isCollected || false)
        setLikesCount(data.like_count || 0)
        setCollectsCount(data.collect_count || 0)
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const res = await api.get(`/api/contents/${id}/comments`)
      if (res.data.code === 0) {
        setComments(res.data.data.list || res.data.data || [])
      }
    } catch {}
  }

  const fetchRelated = async () => {
    try {
      const res = await api.get('/api/contents', { params: { pageSize: 4, sort: 'hot' } })
      if (res.data.code === 0) {
        setRelated((res.data.data.list || []).filter((c: any) => c.id !== id))
      }
    } catch {}
  }

  useEffect(() => {
    fetchData()
    fetchComments()
    fetchRelated()
  }, [id])

  const handleLike = async () => {
    if (!isAuthenticated()) return
    try {
      const res = await api.post(`/api/contents/${id}/like`)
      if (res.data.code === 0) {
        setLiked(res.data.data.liked)
        setLikesCount(prev => res.data.data.liked ? prev + 1 : prev - 1)
      }
    } catch {}
  }

  const handleCollect = async () => {
    if (!isAuthenticated()) return
    try {
      const res = await api.post(`/api/contents/${id}/collect`, { collection_id: undefined })
      if (res.data.code === 0) {
        setCollected(res.data.data.collected)
        setCollectsCount(prev => res.data.data.collected ? prev + 1 : prev - 1)
      }
    } catch {}
  }

  const handleTip = async () => {
    const amount = parseFloat(tipAmount)
    if (!amount || amount <= 0) return
    try {
      await api.post('/api/earnings/tip', { content_id: id, amount })
      showToast('打赏成功！', 'success')
      setShowTip(false)
      setTipAmount('')
    } catch {
      showToast('打赏失败', 'error')
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="text-center py-16 text-gray-400">
        <p className="text-lg">内容不存在或已被删除</p>
      </div>
    )
  }

  const topics = parseJsonField(content.topic_ids)
  const tags = parseJsonField(content.tags)

  return (
    <div className="max-w-3xl mx-auto">
      {toast && (
        <div className={toast.type === 'success' ? 'toast-success' : 'toast-error'}>
          {toast.message}
        </div>
      )}

      <article>
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            {content.content_type && (
              <span className="badge bg-primary-50 text-primary-600">
                {content.content_type === 'article' ? '文章' : content.content_type === 'note' ? '笔记' : '动态'}
              </span>
            )}
            {content.city && (
              <span className="badge bg-orange-50 text-orange-600 flex items-center gap-1">
                <MapPin className="w-3 h-3" />{content.city}
              </span>
            )}
            {tags.length > 0 && tags.map((tag: string, i: number) => (
              <span key={i} className="badge bg-gray-50 text-gray-500">#{tag}</span>
            ))}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">{content.title}</h1>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to={`/profile/${content.user_id}`}>
                {content.author_avatar ? (
                  <img src={content.author_avatar} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                    {content.author_nickname?.[0] || '?'}
                  </div>
                )}
              </Link>
              <div>
                <Link to={`/profile/${content.user_id}`} className="text-sm font-medium text-gray-900 hover:text-primary-600">
                  {content.author_nickname}
                </Link>
                {content.author_certified && (
                  <span className="ml-1 text-xs text-primary-500">✓ 认证创作者</span>
                )}
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" />{dayjs(content.created_at).format('YYYY-MM-DD HH:mm')}</span>
                  {content.view_count > 0 && <span>{content.view_count} 阅读</span>}
                </div>
              </div>
            </div>
            {currentUser?.id === content.user_id && (
              <Link to={`/edit/${content.id}`} className="btn-ghost text-xs gap-1">
                <Edit3 className="w-3.5 h-3.5" />编辑
              </Link>
            )}
          </div>
        </div>

        {content.topics?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {content.topics.map((topic: any) => (
              <TopicBadge key={topic.id} name={topic.name} slug={topic.slug} size="md" />
            ))}
          </div>
        )}

        <div
          className="tiptap prose prose-sm max-w-none mb-8"
          dangerouslySetInnerHTML={{ __html: content.body || '' }}
        />

        <div className="flex items-center gap-4 py-4 border-t border-b border-gray-100">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              liked ? 'text-red-500 bg-red-50' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
            {likesCount}
          </button>
          <button
            onClick={handleCollect}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
              collected ? 'text-primary-600 bg-primary-50' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            <Bookmark className={`w-5 h-5 ${collected ? 'fill-current' : ''}`} />
            {collectsCount}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              showToast('链接已复制', 'success')
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <Share2 className="w-5 h-5" />分享
          </button>
          {content.author_certified && content.user_id !== currentUser?.id && isAuthenticated() && (
            <button
              onClick={() => setShowTip(!showTip)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-yellow-600 hover:bg-yellow-50 transition-colors ml-auto"
            >
              <DollarSign className="w-5 h-5" />打赏
            </button>
          )}
        </div>

        {showTip && (
          <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">打赏作者</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={tipAmount}
                onChange={(e) => setTipAmount(e.target.value)}
                placeholder="金额"
                className="input-field w-32"
                min="0.01"
                step="0.01"
              />
              <button onClick={handleTip} className="btn-primary">确认打赏</button>
              <button onClick={() => setShowTip(false)} className="btn-secondary">取消</button>
            </div>
          </div>
        )}
      </article>

      <div className="mt-8">
        <CommentSection contentId={id!} comments={comments} onRefresh={fetchComments} />
      </div>

      {related.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">相关推荐</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {related.map((item: any) => (
              <Link key={item.id} to={`/content/${item.id}`} className="card p-4 hover:shadow-md transition-shadow">
                <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{item.title}</h4>
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
                  <span>{item.author_nickname}</span>
                  <span>{item.like_count} 赞</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

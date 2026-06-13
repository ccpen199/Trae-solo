import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Heart, MessageCircle, Send, ArrowLeft, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '@/lib/api'

interface Post {
  id: string
  title: string
  tag: string
  author: string
  date: string
  likes: number
  content: string
}

interface Comment {
  id: string
  author: string
  content: string
  date: string
  likes: number
}

export default function CommunityPost() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!id) return
    const fetchPost = async () => {
      setLoading(true)
      try {
        const [postRes, commentsRes] = await Promise.all([
          apiFetch<{ success: boolean; data: any }>(`/community/posts/${id}`),
          apiFetch<{ success: boolean; data: any[] | { items?: any[] } }>(`/community/posts/${id}/comments`),
        ])
        if (postRes.success && postRes.data) {
          const p = postRes.data
          setPost({
            id: String(p.id),
            title: p.title,
            tag: p.tag || p.category || '',
            author: p.author_name || p.author || '',
            date: p.created_at ? p.created_at.split('T')[0] : '',
            likes: p.likes || 0,
            content: p.content || '',
          })
          setLikeCount(p.likes || 0)
        }
        if (commentsRes.success && commentsRes.data) {
          const commentItems = Array.isArray(commentsRes.data)
            ? commentsRes.data
            : commentsRes.data.items || postRes.data?.commentList || []
          setComments(
            commentItems.map((c) => ({
              id: String(c.id),
              author: c.author_name || c.author || '',
              content: c.content,
              date: c.created_at || '',
              likes: c.likes || 0,
            }))
          )
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchPost()
  }, [id])

  const handleLike = async () => {
    if (!id) return
    const wasLiked = liked
    setLiked(!wasLiked)
    setLikeCount((c) => wasLiked ? c - 1 : c + 1)
    try {
      await apiFetch(`/community/posts/${id}/like`, { method: 'POST' })
    } catch {
      setLiked(wasLiked)
      setLikeCount((c) => wasLiked ? c + 1 : c - 1)
    }
  }

  const handleComment = async () => {
    if (!newComment.trim() || !id || submitting) return
    const content = newComment.trim()
    setNewComment('')
    setSubmitting(true)
    try {
      const res = await apiFetch<{ success: boolean; data: any }>(`/community/posts/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      if (res.success && res.data) {
        setComments((prev) => [
          ...prev,
          {
            id: String(res.data.id || Date.now()),
            author: res.data.author_name || '我',
            content: res.data.content || content,
            date: res.data.created_at || new Date().toISOString(),
            likes: 0,
          },
        ])
      }
    } catch {
      setNewComment(content)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-6 h-6 animate-spin text-teal-600" />
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-stone-500 hover:text-teal-700 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> 返回社区
        </button>
        <p className="text-stone-500">帖子不存在</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-stone-500 hover:text-teal-700 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> 返回社区
      </button>

      <article className="bg-white rounded-lg p-8 shadow-sm border border-stone-200">
        <div className="flex items-center gap-2 mb-4">
          {post.tag && <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-xs font-medium">#{post.tag}</span>}
        </div>
        <h1 className="font-heading text-2xl font-bold text-stone-800 mb-3">{post.title}</h1>
        <div className="text-sm text-stone-500 mb-6">{post.author} · {post.date}</div>

        <div className="prose prose-stone max-w-none text-stone-700 leading-relaxed whitespace-pre-line">
          {post.content}
        </div>

        <div className="flex items-center gap-4 mt-8 pt-4 border-t border-stone-200">
          <button onClick={handleLike} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            liked ? 'bg-red-50 text-red-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
          }`}>
            <Heart className={`w-4 h-4 ${liked ? 'fill-current' : ''}`} /> {likeCount}
          </button>
          <span className="flex items-center gap-1.5 text-sm text-stone-500">
            <MessageCircle className="w-4 h-4" /> {comments.length} 评论
          </span>
        </div>
      </article>

      <div className="mt-6">
        <h3 className="font-heading font-bold text-lg mb-4">评论 ({comments.length})</h3>

        <div className="bg-white rounded-lg p-4 shadow-sm border border-stone-200 mb-4">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="写下你的评论..."
            rows={3}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm resize-none"
          />
          <div className="flex justify-end mt-2">
            <button onClick={handleComment} disabled={!newComment.trim() || submitting} className="px-4 py-1.5 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 disabled:opacity-50 transition-colors flex items-center gap-1">
              <Send className="w-3.5 h-3.5" /> 发表评论
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-white rounded-lg p-4 shadow-sm border border-stone-200">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm text-stone-800">{comment.author}</span>
                <span className="text-xs text-stone-400">{comment.date}</span>
              </div>
              <p className="text-sm text-stone-600 mt-1.5">{comment.content}</p>
              <button className="flex items-center gap-1 text-xs text-stone-400 mt-2 hover:text-red-500 transition-colors">
                <Heart className="w-3 h-3" /> {comment.likes}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

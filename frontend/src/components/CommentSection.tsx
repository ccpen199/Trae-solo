import { useState } from 'react'
import { Heart, MessageCircle, CornerDownRight } from 'lucide-react'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import api from '../utils/api'
import { isAuthenticated } from '../utils/auth'

dayjs.locale('zh-cn')

interface Comment {
  id: string
  body: string
  user_id?: string
  author_nickname?: string
  author_avatar?: string
  like_count: number
  created_at: string
  replies?: Comment[]
  parent_id?: string
}

interface CommentSectionProps {
  contentId: string
  comments: Comment[]
  onRefresh: () => void
}

export default function CommentSection({ contentId, comments, onRefresh }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || submitting) return
    setSubmitting(true)
    try {
      await api.post(`/api/contents/${contentId}/comments`, {
        body: newComment.trim(),
        parent_id: replyTo?.id || null,
      })
      setNewComment('')
      setReplyTo(null)
      onRefresh()
    } catch {} finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (commentId: string) => {
    try {
      await api.post(`/api/comments/${commentId}/like`)
      onRefresh()
    } catch {}
  }

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`${depth > 0 ? 'ml-8 border-l-2 border-gray-100 pl-4' : ''} py-3`}>
      <div className="flex items-start gap-3">
        {comment.author_avatar ? (
          <img src={comment.author_avatar} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900">{comment.author_nickname}</span>
            <span className="text-xs text-gray-400">{dayjs(comment.created_at).format('MM-DD HH:mm')}</span>
          </div>
          <p className="text-sm text-gray-700 mb-2">{comment.body}</p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleLike(comment.id)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
            >
              <Heart className="w-3.5 h-3.5" />{comment.like_count}
            </button>
            {isAuthenticated() && (
              <button
                onClick={() => setReplyTo({ id: comment.id, nickname: comment.author_nickname || '' })}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-primary-600 transition-colors"
              >
                <CornerDownRight className="w-3.5 h-3.5" />回复
              </button>
            )}
          </div>
        </div>
      </div>
      {comment.replies?.map((reply) => renderComment(reply, depth + 1))}
    </div>
  )

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />评论 ({comments.length})
      </h3>

      {isAuthenticated() && (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="flex-1">
              {replyTo && (
                <div className="flex items-center gap-1 mb-1 text-xs text-primary-600">
                  <CornerDownRight className="w-3 h-3" />
                  回复 {replyTo.nickname}
                  <button type="button" onClick={() => setReplyTo(null)} className="text-gray-400 hover:text-gray-600 ml-1">✕</button>
                </div>
              )}
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={replyTo ? `回复 ${replyTo.nickname}...` : '写下你的评论...'}
                className="input-field resize-none"
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end mt-2">
            <button type="submit" disabled={!newComment.trim() || submitting} className="btn-primary">
              {submitting ? '发送中...' : '发送评论'}
            </button>
          </div>
        </form>
      )}

      <div className="divide-y divide-gray-100">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-gray-400 text-sm">暂无评论，来发表第一条评论吧</div>
        ) : (
          comments.map((comment) => renderComment(comment))
        )}
      </div>
    </div>
  )
}

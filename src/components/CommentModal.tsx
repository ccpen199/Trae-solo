import { useState } from 'react'
import { X, Send, Clock } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useCommunityStore } from '@/stores/communityStore'

interface CommentModalProps {
  isOpen: boolean
  onClose: () => void
  post: any | null
}

export default function CommentModal({ isOpen, onClose, post }: CommentModalProps) {
  const { isLoggedIn } = useAuthStore()
  const { commentPost, loading } = useCommunityStore()
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    if (!isLoggedIn) {
      setError('请先登录')
      return
    }
    if (comment.trim().length < 2) {
      setError('评论内容至少需要2个字符')
      return
    }

    try {
      setError('')
      await commentPost(post.id, comment)
      setComment('')
    } catch (err: any) {
      setError(err.message || '评论失败')
    }
  }

  if (!isOpen || !post) return null

  const comments = post.comments || []

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[80vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-stone-100 flex items-center justify-between flex-shrink-0">
          <h3 className="text-lg font-bold text-text-primary">评论 ({comments.length})</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          {comments.length === 0 ? (
            <div className="text-center py-8 text-text-secondary">
              <p>暂无评论，快来抢沙发吧</p>
            </div>
          ) : (
            comments.map((c: any, i: number) => (
              <div key={i} className="flex gap-3">
                <img
                  src={c.author?.avatar || `https://picsum.photos/seed/user${c.author?.id}/40/40`}
                  alt={c.author?.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-text-primary text-sm">{c.author?.name}</span>
                    <span className="text-xs text-text-secondary inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {c.createdAt || '2024-01-15'}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-primary">{c.content}</p>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-4 border-t border-stone-100 flex-shrink-0">
          {error && <p className="text-sm text-red-500 mb-2 text-center">{error}</p>}
          <div className="flex gap-2">
            <input
              type="text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="写下你的评论..."
              className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !comment.trim()}
              className="px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary-600 active:scale-95 transition-all disabled:opacity-50"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

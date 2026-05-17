import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  Heart, MessageSquare, Share2, MoreHorizontal, Send,
  ChevronDown, ThumbsUp, Flag
} from 'lucide-react'
import { motion } from 'framer-motion'
import request from '../utils/request'
import { useToast } from '../components/Toast'
import Loading from '../components/Loading'

const Comments = () => {
  const { songId } = useParams()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [song, setSong] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [songRes, commentsRes] = await Promise.all([
          request.get(`/songs/detail/${songId}`),
          request.get(`/comments/song/${songId}`)
        ])
        
        if (songRes.success) {
          setSong(songRes.data)
        }
        if (commentsRes.success) {
          setComments(commentsRes.data?.list || [])
        }
      } catch (err) {
        console.error('Failed to fetch data:', err)
        showToast('加载失败', 'error')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [songId, showToast])

  const handleSubmit = async () => {
    if (!newComment.trim()) {
      showToast('请输入评论内容', 'warning')
      return
    }

    setSubmitting(true)
    try {
      const res = await request.post(`/comments/song/${songId}`, {
        content: newComment.trim()
      })
      
      if (res.success) {
        setComments(prev => [res.data, ...prev])
        setNewComment('')
        showToast('评论成功', 'success')
      } else {
        showToast(res.message || '评论失败', 'error')
      }
    } catch (err) {
      showToast('评论失败，请登录后重试', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleLike = async (commentId, isLiked) => {
    try {
      await request.post(`/comments/like/${commentId}`)
      setComments(prev => prev.map(c => {
        if (c.id === commentId) {
          return {
            ...c,
            is_liked: !isLiked,
            like_count: isLiked ? c.like_count - 1 : c.like_count + 1
          }
        }
        return c
      }))
    } catch (err) {
      showToast('操作失败', 'error')
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <div className="min-h-screen pb-8">
      <header className="sticky top-0 z-40 glass-dark px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2">
            <ChevronDown className="w-6 h-6" />
          </button>
          <h1 className="font-medium">评论 ({comments.length})</h1>
          <div className="w-10" />
        </div>
      </header>

      {song && (
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 p-4 glass rounded-xl mb-6">
            <img
              src={song.cover || 'https://picsum.photos/200'}
              alt={song.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate">{song.name}</h3>
              <p className="text-sm text-gray-400 truncate">{song.artist_name}</p>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex gap-3 mb-4">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="写下你的评论..."
                className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-primary-400 transition-colors"
              />
              <button
                onClick={handleSubmit}
                disabled={submitting || !newComment.trim()}
                className="px-6 py-3 bg-primary-500 rounded-xl hover:bg-primary-600 transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {comments.map((comment, index) => (
              <motion.div
                key={comment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 glass rounded-xl"
              >
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-400 font-medium">
                      {comment.user?.nickname?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-medium">{comment.user?.nickname || '匿名用户'}</span>
                        <span className="text-sm text-gray-400 ml-3">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <button className="p-1 hover:bg-white/10 rounded-full transition-colors">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                    <p className="text-gray-200 mb-3">{comment.content}</p>
                    <div className="flex items-center gap-6">
                      <button
                        onClick={() => handleLike(comment.id, comment.is_liked)}
                        className={`flex items-center gap-2 text-sm transition-colors ${
                          comment.is_liked ? 'text-primary-400' : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        <ThumbsUp className="w-4 h-4" fill={comment.is_liked ? 'currentColor' : 'none'} />
                        <span>{comment.like_count || 0}</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                        <MessageSquare className="w-4 h-4" />
                        <span>{comment.reply_count || 0}</span>
                      </button>
                      <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-400 transition-colors">
                        <Flag className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}

            {comments.length === 0 && (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">暂无评论，快来发表第一条评论吧</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Comments
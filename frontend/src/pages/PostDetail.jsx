import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Heart, MessageCircle, Send, Eye } from 'lucide-react'
import { communityApi } from '../api'
import { useAuthStore } from '../store'

export default function PostDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const token = useAuthStore((state) => state.token)
  const user = useAuthStore((state) => state.user)
  const [post, setPost] = useState(null)
  const [comment, setComment] = useState('')
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    loadPost()
  }, [id])

  const loadPost = async () => {
    try {
      const res = await communityApi.getPostDetail(id)
      setPost(res.data.data)
    } catch (error) {
      console.error('加载失败', error)
    }
  }

  const handleLike = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    try {
      await communityApi.likePost({ post_id: id })
      setLiked(!liked)
      setPost({
        ...post,
        like_count: liked ? post.like_count - 1 : post.like_count + 1
      })
    } catch (error) {
      console.error('点赞失败', error)
    }
  }

  const handleComment = async () => {
    if (!token) {
      navigate('/login')
      return
    }
    if (!comment.trim()) {
      alert('请输入评论内容')
      return
    }
    try {
      await communityApi.createComment({ post_id: id, content: comment })
      setComment('')
      loadPost()
    } catch (error) {
      console.error('评论失败', error)
    }
  }

  if (!post) {
    return <div className="p-4 text-center">加载中...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 flex items-center sticky top-0 z-10">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="font-medium">帖子详情</h1>
      </div>

      <div className="bg-white p-4">
        <div className="flex items-center mb-4">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-xl">👤</span>
          </div>
          <div className="ml-3">
            <h4 className="font-medium">{post.nickname || '用户'}</h4>
            <p className="text-xs text-gray-400">{post.category}</p>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-3">{post.title}</h2>
        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{post.content}</p>

        <div className="flex items-center mt-4 text-sm text-gray-400">
          <span className="flex items-center mr-4">
            <Eye className="w-4 h-4 mr-1" />
            {post.view_count || 0}
          </span>
          <button onClick={handleLike} className="flex items-center mr-4 hover:text-red-500 transition-colors">
            <Heart className={`w-4 h-4 mr-1 ${liked ? 'fill-red-500 text-red-500' : ''}`} />
            {post.like_count || 0}
          </button>
          <span className="flex items-center">
            <MessageCircle className="w-4 h-4 mr-1" />
            {post.comment_count || post.comments?.length || 0}
          </span>
        </div>
      </div>

      <div className="bg-white mt-2 p-4">
        <h3 className="font-bold mb-4">评论({post.comments?.length || 0})</h3>
        {post.comments?.length === 0 ? (
          <p className="text-center text-gray-400 py-4">暂无评论</p>
        ) : (
          <div className="space-y-4">
            {post.comments?.map((c) => (
              <div key={c.id} className="flex">
                <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-sm">👤</span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{c.nickname || '用户'}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-16 left-0 right-0 bg-white border-t p-4 max-w-md mx-auto z-50">
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={token ? "发表评论..." : "登录后发表评论"}
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 outline-none text-sm"
            onClick={() => !token && navigate('/login')}
          />
          <button
            onClick={handleComment}
            disabled={!token}
            className={`p-2 rounded-full transition-colors ${token ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

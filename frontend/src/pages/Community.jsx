import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, MessageCircle, Heart, Eye } from 'lucide-react'
import { communityApi } from '../api'

export default function Community() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    setLoading(true)
    try {
      const res = await communityApi.getPosts({ limit: 20 })
      setPosts(res.data.data.list)
    } catch (error) {
      console.error('加载失败', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-gray-100 rounded-full px-4 py-2">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <input
              type="text"
              placeholder="搜索攻略..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
          </div>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-center py-8 text-gray-400">加载中...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-8 text-gray-400">暂无帖子</div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <div
                key={post.id}
                onClick={() => navigate(`/community/posts/${post.id}`)}
                className="bg-white rounded-xl p-4"
              >
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg">👤</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="font-medium text-sm">{post.nickname || '用户'}</h4>
                    <p className="text-xs text-gray-400">{post.category}</p>
                  </div>
                </div>
                <h3 className="font-medium mb-2">{post.title}</h3>
                <p className="text-sm text-gray-600 line-clamp-2">{post.content}</p>
                <div className="flex items-center mt-3 text-xs text-gray-400">
                  <span className="flex items-center mr-4">
                    <Eye className="w-4 h-4 mr-1" />
                    {post.view_count || 0}
                  </span>
                  <span className="flex items-center mr-4">
                    <Heart className="w-4 h-4 mr-1" />
                    {post.like_count || 0}
                  </span>
                  <span className="flex items-center">
                    <MessageCircle className="w-4 h-4 mr-1" />
                    {post.comment_count || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate('/community/create')}
        className="fixed bottom-20 right-4 w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg z-20"
      >
        <Plus className="w-6 h-6 text-white" />
      </button>
    </div>
  )
}

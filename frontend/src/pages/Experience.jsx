import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function Experience() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [posts, setPosts] = useState([])
  const [showPublish, setShowPublish] = useState(false)
  const { isAuthenticated } = useAuthStore()
  
  const [publishForm, setPublishForm] = useState({
    title: '',
    content: '',
    category: '经验分享'
  })

  useEffect(() => {
    loadPosts()
  }, [])

  const loadPosts = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/posts')
      setPosts(res.data.data?.posts || [])
    } catch (err) {
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert('请先登录')
      return
    }
    
    try {
      const res = await api.post('/posts', publishForm)
      if (res.data.success) {
        setShowPublish(false)
        loadPosts()
        alert('发布成功')
      }
    } catch (err) {
      alert(err.response?.data?.message || '发布失败')
    }
  }

  if (loading) return <div className="loading">加载中...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px' }}>💡 经验谈</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowPublish(true)}
        >
          + 发布帖子
        </button>
      </div>

      {showPublish && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px' }}>发布新帖子</h2>
            <button 
              onClick={() => setShowPublish(false)}
              style={{ background: 'none', fontSize: '20px', color: '#6b7280' }}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handlePublish}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>标题 *</label>
              <input
                type="text"
                value={publishForm.title}
                onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                required
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>内容</label>
              <textarea
                value={publishForm.content}
                onChange={(e) => setPublishForm({ ...publishForm, content: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', minHeight: '150px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              发布
            </button>
          </form>
        </div>
      )}

      {posts.length === 0 ? (
        <div className="empty">暂无帖子</div>
      ) : (
        <div className="grid grid-2">
          {posts.map(post => (
            <Link 
              key={post.id}
              to={`/post/${post.id}`}
              className="card"
              style={{ textDecoration: 'none', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <h3 style={{ marginBottom: '10px', color: '#1f2937' }}>{post.title}</h3>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '15px', lineHeight: '1.6' }}>
                {post.content?.substring(0, 120)}...
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '15px', fontSize: '13px', color: '#9ca3af' }}>
                  <span>❤️ {post.likes || 0}</span>
                  <span>💬 {post.comments || 0}</span>
                  <span>👁️ {post.views || 0}</span>
                </div>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {post.nickname || '匿名用户'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

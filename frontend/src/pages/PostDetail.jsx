import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function PostDetail() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [post, setPost] = useState(null)
  const [comment, setComment] = useState('')
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    loadPost()
  }, [id])

  const loadPost = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get(`/posts/${id}`)
      setPost(res.data.data)
    } catch (err) {
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!isAuthenticated) {
      alert('请先登录')
      return
    }
    try {
      await api.post(`/posts/${id}/like`)
      loadPost()
    } catch (err) {
      alert('点赞失败')
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!isAuthenticated) {
      alert('请先登录')
      return
    }
    if (!comment.trim()) return
    
    try {
      await api.post(`/posts/${id}/comment`, { content: comment })
      setComment('')
      loadPost()
    } catch (err) {
      alert('评论失败')
    }
  }

  if (loading) return <div className="loading">加载中...</div>
  if (error) return <div className="error">{error}</div>
  if (!post) return <div className="empty">帖子不存在</div>

  return (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="card">
        <h1 style={{ fontSize: '24px', marginBottom: '15px' }}>{post.title}</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid #e5e7eb' }}>
          <div style={{ 
            width: '40px', height: '40px', borderRadius: '50%', background: '#ff6b6b20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            👤
          </div>
          <div>
            <div style={{ fontWeight: '500' }}>{post.nickname || '匿名用户'}</div>
            <div style={{ fontSize: '12px', color: '#9ca3af' }}>
              {new Date(post.created_at).toLocaleString()}
            </div>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '20px', fontSize: '14px', color: '#6b7280' }}>
            <span>👁️ {post.views || 0}</span>
            <span>❤️ {post.likes || 0}</span>
            <span>💬 {post.comments || 0}</span>
          </div>
        </div>

        <div style={{ fontSize: '16px', lineHeight: '1.8', color: '#374151', marginBottom: '30px', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </div>

        <button 
          onClick={handleLike}
          className="btn btn-primary"
          style={{ marginBottom: '30px' }}
        >
          ❤️ 点赞
        </button>

        <div>
          <h3 style={{ fontSize: '18px', marginBottom: '20px' }}>评论 ({post.comments?.length || 0})</h3>
          
          <form onSubmit={handleComment} style={{ marginBottom: '25px' }}>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="写下你的评论..."
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                minHeight: '80px',
                marginBottom: '10px',
                fontSize: '14px'
              }}
            />
            <button type="submit" className="btn btn-primary" style={{ fontSize: '14px' }}>
              发表评论
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            {(!post.comments || post.comments.length === 0) ? (
              <p style={{ textAlign: 'center', color: '#9ca3af', padding: '20px' }}>暂无评论</p>
            ) : (
              post.comments.map(c => (
                <div key={c.id} style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                    <div style={{ 
                      width: '30px', height: '30px', borderRadius: '50%', background: '#4ecdc420', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                      👤
                    </div>
                    <span style={{ fontWeight: '500', fontSize: '14px' }}>{c.nickname || '匿名用户'}</span>
                    <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                      {new Date(c.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p style={{ fontSize: '14px', color: '#374151', marginLeft: '40px' }}>{c.content}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

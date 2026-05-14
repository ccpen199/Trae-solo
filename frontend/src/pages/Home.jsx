import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'

const categories = [
  { id: 'lost-found', name: '失物招领', icon: '🔍', color: '#4ecdc4' },
  { id: 'secondhand', name: '二手交易', icon: '🛒', color: '#ffe66d' },
  { id: 'errands', name: '跑腿服务', icon: '🏃', color: '#ff6b6b' },
  { id: 'experience', name: '经验谈', icon: '💡', color: '#95e1d3' },
  { id: 'stations', name: '服务站', icon: '🏪', color: '#f38181' },
  { id: 'profile', name: '个人中心', icon: '�', color: '#aa96da' },
]

export default function Home() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lostItems, setLostItems] = useState([])
  const [secondhandItems, setSecondhandItems] = useState([])
  const [posts, setPosts] = useState([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [lostRes, secondhandRes, postsRes] = await Promise.allSettled([
        api.get('/lostfound?limit=4'),
        api.get('/secondhand?limit=4'),
        api.get('/posts?limit=4')
      ])
      
      setLostItems(lostRes.status === 'fulfilled' ? (lostRes.value.data.data?.items || []) : [])
      setSecondhandItems(secondhandRes.status === 'fulfilled' ? (secondhandRes.value.data.data?.items || []) : [])
      setPosts(postsRes.status === 'fulfilled' ? (postsRes.value.data.data?.posts || []) : [])
    } catch (err) {
      setError('加载失败，请重试')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="loading">加载中...</div>
  if (error) return <div className="error">{error}</div>

  return (
    <div className="container">
      <div className="card" style={{ 
        background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)', 
        color: 'white',
        textAlign: 'center',
        padding: '40px 20px'
      }}>
        <h1 style={{ fontSize: '32px', marginBottom: '10px' }}>🍊 欢迎来到西柚找找</h1>
        <p style={{ opacity: 0.9, fontSize: '16px' }}>校园信息共享服务平台，让校园生活更美好</p>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '20px', fontSize: '18px' }}>功能分类</h2>
        <div className="grid grid-3">
          {categories.map(cat => (
            <Link 
              key={cat.id}
              to={`/${cat.id}`}
              style={{
                padding: '25px',
                borderRadius: '12px',
                background: `${cat.color}20`,
                border: `2px solid ${cat.color}40`,
                textAlign: 'center',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '36px', marginBottom: '10px' }}>{cat.icon}</div>
              <div style={{ fontWeight: '600', color: cat.color }}>{cat.name}</div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-2">
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px' }}>🔍 最新失物</h2>
            <Link to="/lost-found" style={{ color: '#ff6b6b', fontSize: '14px' }}>查看更多</Link>
          </div>
          {lostItems.length === 0 ? (
            <div className="empty">暂无数据</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {lostItems.map(item => (
                <Link 
                  key={item.id}
                  to={`/lost-found/${item.id}`}
                  style={{
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{item.title}</div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>{item.category}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px' }}>🛒 最新二手</h2>
            <Link to="/secondhand" style={{ color: '#ff6b6b', fontSize: '14px' }}>查看更多</Link>
          </div>
          {secondhandItems.length === 0 ? (
            <div className="empty">暂无数据</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {secondhandItems.map(item => (
                <Link 
                  key={item.id}
                  to={`/secondhand/${item.id}`}
                  style={{
                    padding: '12px',
                    background: '#f9fafb',
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: '500' }}>{item.title}</div>
                    <div style={{ fontSize: '14px', color: '#ff6b6b', fontWeight: '600' }}>¥{item.price}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#6b7280' }}>
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px' }}>💡 最新帖子</h2>
          <Link to="/experience" style={{ color: '#ff6b6b', fontSize: '14px' }}>查看更多</Link>
        </div>
        {posts.length === 0 ? (
          <div className="empty">暂无数据</div>
        ) : (
          <div className="grid grid-2">
            {posts.map(post => (
              <Link 
                key={post.id}
                to={`/post/${post.id}`}
                style={{
                  padding: '15px',
                  background: '#f9fafb',
                  borderRadius: '8px'
                }}
              >
                <div style={{ fontWeight: '500', marginBottom: '8px' }}>{post.title}</div>
                <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>
                  {post.content?.substring(0, 80)}...
                </div>
                <div style={{ display: 'flex', gap: '15px', fontSize: '12px', color: '#9ca3af' }}>
                  <span>❤️ {post.likes || 0}</span>
                  <span>💬 {post.comments || 0}</span>
                  <span>👁️ {post.views || 0}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px' }}>🏪 线下服务站</h2>
          <Link to="/stations" style={{ color: '#ff6b6b', fontSize: '14px' }}>查看全部</Link>
        </div>
        <div className="grid grid-4">
          {['一教', '二教', '食堂', '图书馆'].map((name, i) => (
            <div 
              key={name}
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '12px',
                color: 'white',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '28px', marginBottom: '8px' }}>🏪</div>
              <div style={{ fontWeight: '600' }}>{name}服务站</div>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>正常营业</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

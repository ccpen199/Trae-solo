import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function SecondHand() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [showPublish, setShowPublish] = useState(false)
  const { isAuthenticated } = useAuthStore()
  
  const [publishForm, setPublishForm] = useState({
    title: '',
    description: '',
    price: '',
    category: '数码',
    contact_name: '',
    contact_phone: ''
  })

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/secondhand')
      setItems(res.data.data?.items || [])
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
      const res = await api.post('/secondhand', publishForm)
      if (res.data.success) {
        setShowPublish(false)
        loadItems()
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
        <h1 style={{ fontSize: '24px' }}>🛒 二手交易</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowPublish(true)}
        >
          + 发布物品
        </button>
      </div>

      {showPublish && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px' }}>发布二手物品</h2>
            <button 
              onClick={() => setShowPublish(false)}
              style={{ background: 'none', fontSize: '20px', color: '#6b7280' }}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handlePublish}>
            <div className="grid grid-2" style={{ marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>标题 *</label>
                <input
                  type="text"
                  value={publishForm.title}
                  onChange={(e) => setPublishForm({ ...publishForm, title: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  required
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>价格</label>
                <input
                  type="number"
                  value={publishForm.price}
                  onChange={(e) => setPublishForm({ ...publishForm, price: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>描述</label>
              <textarea
                value={publishForm.description}
                onChange={(e) => setPublishForm({ ...publishForm, description: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px', minHeight: '80px' }}
              />
            </div>
            <div className="grid grid-2" style={{ marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>联系人</label>
                <input
                  type="text"
                  value={publishForm.contact_name}
                  onChange={(e) => setPublishForm({ ...publishForm, contact_name: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>联系电话</label>
                <input
                  type="tel"
                  value={publishForm.contact_phone}
                  onChange={(e) => setPublishForm({ ...publishForm, contact_phone: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              发布
            </button>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty">暂无二手物品</div>
      ) : (
        <div className="grid grid-3">
          {items.map(item => (
            <Link 
              key={item.id}
              to={`/secondhand/${item.id}`}
              className="card"
              style={{ textDecoration: 'none', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🎁</div>
              <h3 style={{ marginBottom: '8px', color: '#1f2937' }}>{item.title}</h3>
              <div style={{ fontSize: '20px', color: '#ff6b6b', fontWeight: '700', marginBottom: '10px' }}>
                ¥{item.price || '面议'}
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '10px' }}>
                {item.description?.substring(0, 50) || '暂无描述'}
              </p>
              {item.category && (
                <div style={{ display: 'inline-block', padding: '4px 12px', background: '#dbeafe', color: '#1e40af', borderRadius: '12px', fontSize: '12px' }}>
                  {item.category}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '10px' }}>
                {new Date(item.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

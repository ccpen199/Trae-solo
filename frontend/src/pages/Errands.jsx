import { useState, useEffect } from 'react'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function Errands() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [showPublish, setShowPublish] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const { isAuthenticated } = useAuthStore()
  
  const [publishForm, setPublishForm] = useState({
    title: '',
    description: '',
    tags: '',
    location: '',
    reward: '',
    restrictions: '',
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
      const res = await api.get('/errands')
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
      const data = {
        ...publishForm,
        tags: publishForm.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
        restrictions: publishForm.restrictions.split(/[,，]/).map(t => t.trim()).filter(Boolean)
      }
      
      const res = await api.post('/errands', data)
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
        <h1 style={{ fontSize: '24px' }}>🏃 跑腿服务</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowPublish(true)}
        >
          + 发布需求
        </button>
      </div>

      {selectedItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }} onClick={() => setSelectedItem(null)}>
          <div className="card" style={{ 
            width: '90%', 
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '20px' }}>🏃 {selectedItem.title}</h2>
              <button 
                onClick={() => setSelectedItem(null)}
                style={{ background: 'none', fontSize: '24px', color: '#6b7280', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: '28px', color: '#10b981', fontWeight: '700', marginBottom: '20px' }}>
              ¥{selectedItem.reward || '面议'}
            </div>
            <p style={{ color: '#374151', marginBottom: '15px', lineHeight: '1.6' }}>
              {selectedItem.description}
            </p>
            {selectedItem.location && (
              <div style={{ fontSize: '14px', color: '#4ecdc4', marginBottom: '10px' }}>
                📍 {selectedItem.location}
              </div>
            )}
            {selectedItem.tags && selectedItem.tags.length > 0 && (
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px' }}>
                {selectedItem.tags.map((tag, i) => (
                  <span key={i} style={{ padding: '5px 12px', background: '#dbeafe', borderRadius: '12px', fontSize: '12px', color: '#1e40af' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
            {selectedItem.contact_name && (
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                👤 联系人：{selectedItem.contact_name}
              </div>
            )}
            {selectedItem.contact_phone && (
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '20px' }}>
                📞 联系电话：{selectedItem.contact_phone}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '20px' }}>
              发布时间：{new Date(selectedItem.created_at).toLocaleString()}
            </div>
            <button 
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={() => {
                alert('接单功能开发中...')
                setSelectedItem(null)
              }}
            >
              我要接单
            </button>
          </div>
        </div>
      )}

      {showPublish && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px' }}>发布跑腿需求</h2>
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
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>酬金</label>
                <input
                  type="number"
                  value={publishForm.reward}
                  onChange={(e) => setPublishForm({ ...publishForm, reward: e.target.value })}
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
            <div className="grid grid-2" style={{ marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>地点</label>
                <input
                  type="text"
                  value={publishForm.location}
                  onChange={(e) => setPublishForm({ ...publishForm, location: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>标签（逗号分隔）</label>
                <input
                  type="text"
                  value={publishForm.tags}
                  onChange={(e) => setPublishForm({ ...publishForm, tags: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  placeholder="例如：取餐, 代买, 急件"
                />
              </div>
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
        <div className="empty">暂无跑腿需求</div>
      ) : (
        <div className="grid grid-3">
          {items.map(item => (
            <div 
              key={item.id}
              className="card"
              style={{ 
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer'
              }}
              onClick={() => {
                setSelectedItem(item)
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🏃</div>
              <h3 style={{ marginBottom: '8px', color: '#1f2937' }}>{item.title}</h3>
              <div style={{ fontSize: '20px', color: '#10b981', fontWeight: '700', marginBottom: '10px' }}>
                ¥{item.reward || '面议'}
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '10px' }}>
                {item.description?.substring(0, 50) || '暂无描述'}
              </p>
              {item.location && (
                <div style={{ fontSize: '13px', color: '#4ecdc4', marginBottom: '8px' }}>
                  📍 {item.location}
                </div>
              )}
              {item.tags && item.tags.length > 0 && (
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  {item.tags.map((tag, i) => (
                    <span key={i} style={{ padding: '3px 10px', background: '#f3f4f6', borderRadius: '10px', fontSize: '11px', color: '#4b5563' }}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div style={{ fontSize: '12px', color: '#9ca3af' }}>
                {new Date(item.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

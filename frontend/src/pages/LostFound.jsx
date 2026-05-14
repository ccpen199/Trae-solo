import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'

const lostCategories = [
  { id: '', name: '全部' },
  { id: '证件', name: '证件' },
  { id: '生活用品', name: '生活用品' },
  { id: '数码产品', name: '数码产品' },
  { id: '书籍', name: '书籍' },
  { id: '其他', name: '其他' },
]

export default function LostFound() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [items, setItems] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showPublish, setShowPublish] = useState(false)
  const { isAuthenticated } = useAuthStore()
  
  const [publishForm, setPublishForm] = useState({
    title: '',
    description: '',
    category: '证件',
    contact_name: '',
    contact_phone: '',
    station_id: '',
    verify_question: '',
    verify_answer: '',
    locker_location: ''
  })

  useEffect(() => {
    loadItems()
  }, [selectedCategory])

  const loadItems = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/lostfound', { params: { category: selectedCategory } })
      setItems(res.data.data?.items || [])
    } catch (err) {
      console.error('加载失物招领失败:', err)
      setError(`加载失败: ${err.message || '请重试'}`)
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
      const res = await api.post('/lostfound', publishForm)
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
        <h1 style={{ fontSize: '24px' }}>🔍 失物招领</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setShowPublish(true)}
        >
          + 发布信息
        </button>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {lostCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: 'none',
                background: selectedCategory === cat.id ? '#ff6b6b' : '#f3f4f6',
                color: selectedCategory === cat.id ? 'white' : '#374151',
                fontSize: '14px',
                cursor: 'pointer'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {showPublish && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px' }}>发布失物信息</h2>
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
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>分类</label>
                <select
                  value={publishForm.category}
                  onChange={(e) => setPublishForm({ ...publishForm, category: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                >
                  {lostCategories.filter(c => c.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
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
            <div className="grid grid-2" style={{ marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>验证问题</label>
                <input
                  type="text"
                  value={publishForm.verify_question}
                  onChange={(e) => setPublishForm({ ...publishForm, verify_question: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  placeholder="例如：物品颜色是？"
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>验证答案</label>
                <input
                  type="text"
                  value={publishForm.verify_answer}
                  onChange={(e) => setPublishForm({ ...publishForm, verify_answer: e.target.value })}
                  style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>存放位置</label>
              <input
                type="text"
                value={publishForm.locker_location}
                onChange={(e) => setPublishForm({ ...publishForm, locker_location: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                placeholder="例如：一教服务站 A01 号柜"
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              发布
            </button>
          </form>
        </div>
      )}

      {items.length === 0 ? (
        <div className="empty">暂无失物信息</div>
      ) : (
        <div className="grid grid-3">
          {items.map(item => (
            <Link 
              key={item.id}
              to={`/lost-found/${item.id}`}
              className="card"
              style={{ textDecoration: 'none', transition: 'transform 0.2s' }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>📦</div>
              <h3 style={{ marginBottom: '8px', color: '#1f2937' }}>{item.title}</h3>
              <div style={{ display: 'inline-block', padding: '4px 12px', background: '#fef3c7', color: '#92400e', borderRadius: '12px', fontSize: '12px', marginBottom: '10px' }}>
                {item.category}
              </div>
              <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '10px' }}>
                {item.description?.substring(0, 50) || '暂无描述'}
              </p>
              {item.station_name && (
                <div style={{ fontSize: '12px', color: '#4ecdc4' }}>
                  📍 {item.station_name}
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

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import { useAuthStore } from '../store/authStore'

export default function Profile() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('info')
  const [myPosts, setMyPosts] = useState({ posts: [], lostItems: [], secondhand: [], errands: [] })
  const [verifyForm, setVerifyForm] = useState({ identity_type: 'student', student_id: '', name: '' })
  const [showVerify, setShowVerify] = useState(false)
  
  const { user, isAuthenticated, logout, updateUser } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login')
      return
    }
    loadProfile()
  }, [isAuthenticated])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await api.get('/user/my-posts')
      setMyPosts(res.data.data || {})
    } catch (err) {
      setError('加载失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post('/auth/verify', verifyForm)
      if (res.data.success) {
        setShowVerify(false)
        alert('认证成功')
        const profileRes = await api.get('/auth/profile')
        updateUser(profileRes.data.data)
      }
    } catch (err) {
      alert(err.response?.data?.message || '认证失败')
    }
  }

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  if (!isAuthenticated) return null
  if (loading) return <div className="loading">加载中...</div>
  if (error) return <div className="error">{error}</div>

  const tabs = [
    { id: 'info', label: '个人信息' },
    { id: 'posts', label: '我的发布' },
    { id: 'favorites', label: '我的收藏' },
    { id: 'messages', label: '消息中心' },
  ]

  return (
    <div className="container">
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            borderRadius: '50%', 
            background: 'linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            color: 'white'
          }}>
            👤
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '20px', marginBottom: '5px' }}>{user?.nickname || user?.username}</h2>
            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
              用户名：{user?.username}
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <span style={{ 
                padding: '4px 12px', 
                background: user?.identity_verified ? '#d1fae5' : '#fef3c7', 
                color: user?.identity_verified ? '#065f46' : '#92400e',
                borderRadius: '12px',
                fontSize: '12px'
              }}>
                {user?.identity_verified ? '已认证' : '未认证'} - {user?.identity_type || '学生'}
              </span>
              {!user?.identity_verified && (
                <button 
                  onClick={() => setShowVerify(true)}
                  style={{ 
                    background: '#ff6b6b', 
                    color: 'white', 
                    padding: '4px 12px', 
                    borderRadius: '8px',
                    fontSize: '12px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  去认证
                </button>
              )}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="btn btn-secondary"
            style={{ fontSize: '14px' }}
          >
            退出登录
          </button>
        </div>
      </div>

      {showVerify && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ fontSize: '18px' }}>身份认证</h2>
            <button 
              onClick={() => setShowVerify(false)}
              style={{ background: 'none', fontSize: '20px', color: '#6b7280', border: 'none', cursor: 'pointer' }}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleVerify}>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>身份类型</label>
              <select
                value={verifyForm.identity_type}
                onChange={(e) => setVerifyForm({ ...verifyForm, identity_type: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              >
                <option value="student">学生</option>
                <option value="teacher">教职工</option>
                <option value="visitor">校外人员</option>
              </select>
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>
                {verifyForm.identity_type === 'student' ? '学号' : verifyForm.identity_type === 'teacher' ? '工号' : '身份证号'}
              </label>
              <input
                type="text"
                value={verifyForm.student_id}
                onChange={(e) => setVerifyForm({ ...verifyForm, student_id: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px' }}>真实姓名</label>
              <input
                type="text"
                value={verifyForm.name}
                onChange={(e) => setVerifyForm({ ...verifyForm, name: e.target.value })}
                style={{ width: '100%', padding: '10px', border: '1px solid #e5e7eb', borderRadius: '8px' }}
              />
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              提交认证
            </button>
          </form>
        </div>
      )}

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '8px 20px',
              border: 'none',
              background: activeTab === tab.id ? '#ff6b6b' : 'transparent',
              color: activeTab === tab.id ? 'white' : '#6b7280',
              borderRadius: '8px',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        {activeTab === 'info' && (
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>个人信息</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>用户名</span>
                <span>{user?.username}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>昵称</span>
                <span>{user?.nickname || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>手机号</span>
                <span>{user?.phone || '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ color: '#6b7280' }}>注册时间</span>
                <span>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ color: '#6b7280' }}>人气值</span>
                <span style={{ color: '#ff6b6b', fontWeight: '600' }}>{user?.popularity || 0}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0' }}>
                <span style={{ color: '#6b7280' }}>好人分</span>
                <span style={{ color: '#10b981', fontWeight: '600' }}>{user?.good_karma || 0}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'posts' && (
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>我的发布</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div style={{ padding: '15px', background: '#f9fafb', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '500' }}>帖子</span>
                  <span style={{ color: '#6b7280', fontSize: '14px' }}>{myPosts.posts?.length || 0} 条</span>
                </div>
                {myPosts.posts?.length === 0 ? (
                  <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '10px' }}>暂无发布</p>
                ) : (
                  myPosts.posts.slice(0, 3).map(post => (
                    <div key={post.id} style={{ padding: '8px 0', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>
                      {post.title}
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: '15px', background: '#fef3c7', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '500' }}>失物招领</span>
                  <span style={{ color: '#92400e', fontSize: '14px' }}>{myPosts.lostItems?.length || 0} 条</span>
                </div>
                {myPosts.lostItems?.length === 0 ? (
                  <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '10px' }}>暂无发布</p>
                ) : (
                  myPosts.lostItems.slice(0, 3).map(item => (
                    <div key={item.id} style={{ padding: '8px 0', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>
                      {item.title}
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: '15px', background: '#dbeafe', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '500' }}>二手交易</span>
                  <span style={{ color: '#1e40af', fontSize: '14px' }}>{myPosts.secondhand?.length || 0} 条</span>
                </div>
                {myPosts.secondhand?.length === 0 ? (
                  <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '10px' }}>暂无发布</p>
                ) : (
                  myPosts.secondhand.slice(0, 3).map(item => (
                    <div key={item.id} style={{ padding: '8px 0', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>
                      {item.title} - ¥{item.price}
                    </div>
                  ))
                )}
              </div>

              <div style={{ padding: '15px', background: '#d1fae5', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <span style={{ fontWeight: '500' }}>跑腿服务</span>
                  <span style={{ color: '#065f46', fontSize: '14px' }}>{myPosts.errands?.length || 0} 条</span>
                </div>
                {myPosts.errands?.length === 0 ? (
                  <p style={{ fontSize: '14px', color: '#9ca3af', textAlign: 'center', padding: '10px' }}>暂无发布</p>
                ) : (
                  myPosts.errands.slice(0, 3).map(item => (
                    <div key={item.id} style={{ padding: '8px 0', fontSize: '14px', borderBottom: '1px solid #e5e7eb' }}>
                      {item.title} - ¥{item.reward}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'favorites' && (
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>我的收藏</h3>
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>暂无收藏内容</p>
          </div>
        )}

        {activeTab === 'messages' && (
          <div>
            <h3 style={{ fontSize: '16px', marginBottom: '20px' }}>消息中心</h3>
            <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px' }}>暂无消息</p>
          </div>
        )}
      </div>
    </div>
  )
}

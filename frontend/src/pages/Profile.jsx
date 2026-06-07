import React, { useState, useEffect } from 'react'
import { useStore } from '../store'
import api from '../api'

export default function Profile() {
  const { user, setUser } = useStore()
  const [formData, setFormData] = useState({
    phone: '',
    real_name: '',
    location: ''
  })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      setFormData({
        phone: user.phone || '',
        real_name: user.real_name || '',
        location: user.location || ''
      })
    }
  }, [user])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.put('/users/profile', formData)
      const res = await api.get('/users/profile')
      setUser(res.data)
      alert('保存成功')
    } catch (err) {
      alert('保存失败')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="container" style={{ padding: '40px 20px', maxWidth: '600px' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '32px' }}>个人中心</h1>

      <div className="card" style={{ marginBottom: '24px', textAlign: 'center', padding: '32px' }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '40px',
          color: 'white',
          fontWeight: '600',
          margin: '0 auto 16px'
        }}>
          {user.username.charAt(0).toUpperCase()}
        </div>
        <h2 style={{ marginBottom: '8px' }}>{user.username}</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>{user.email}</p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '24px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
              {user.rating?.toFixed(1) || '5.0'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>评分</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
              {user.rating_count || 0}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>评价</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--primary)' }}>
              {user.credit_score || 100}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>信用分</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--success)' }}>
              ¥{user.balance?.toFixed(2) || '0.00'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--gray-600)' }}>余额</div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <h2 style={{ fontSize: '20px', marginBottom: '24px' }}>基本信息</h2>

        <div className="form-group">
          <label className="form-label">用户名</label>
          <input
            type="text"
            className="form-input"
            value={user.username}
            disabled
            style={{ background: 'var(--gray-50)' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">邮箱</label>
          <input
            type="email"
            className="form-input"
            value={user.email}
            disabled
            style={{ background: 'var(--gray-50)' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">角色</label>
          <input
            type="text"
            className="form-input"
            value={user.role === 'provider' ? '服务者' : user.role === 'admin' ? '管理员' : '需求方'}
            disabled
            style={{ background: 'var(--gray-50)' }}
          />
        </div>

        <div className="form-group">
          <label className="form-label">手机号</label>
          <input
            type="tel"
            name="phone"
            className="form-input"
            value={formData.phone}
            onChange={handleChange}
            placeholder="请输入手机号"
          />
        </div>

        <div className="form-group">
          <label className="form-label">真实姓名</label>
          <input
            type="text"
            name="real_name"
            className="form-input"
            value={formData.real_name}
            onChange={handleChange}
            placeholder="请输入真实姓名"
          />
        </div>

        <div className="form-group">
          <label className="form-label">所在地区</label>
          <input
            type="text"
            name="location"
            className="form-input"
            value={formData.location}
            onChange={handleChange}
            placeholder="例如：北京市朝阳区"
          />
        </div>

        <div className="form-group">
          <label className="form-label">实名认证</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{
              padding: '4px 12px',
              borderRadius: '20px',
              fontSize: '12px',
              background: user.is_verified ? '#dcfce7' : '#fef3c7',
              color: user.is_verified ? '#15803d' : '#d97706'
            }}>
              {user.is_verified ? '已认证' : '未认证'}
            </span>
            {!user.is_verified && (
              <button type="button" className="btn btn-outline" style={{ padding: '6px 16px', fontSize: '12px' }}>
                去认证
              </button>
            )}
          </div>
        </div>

        <button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={loading}>
          {loading ? '保存中...' : '保存修改'}
        </button>
      </form>
    </div>
  )
}

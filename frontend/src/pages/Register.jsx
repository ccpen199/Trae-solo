import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import api from '../api'

export default function Register() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'client',
    phone: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToken, setUser } = useStore()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await api.post('/users/register', formData)
      setToken(res.data.token)
      setUser(res.data.user)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-title">创建账户</h1>
        <p className="auth-subtitle">加入技能零工，开启新旅程</p>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#fef2f2',
            color: '#dc2626',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">账户类型</label>
            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{
                flex: 1,
                padding: '12px',
                border: `2px solid ${formData.role === 'client' ? '#2563eb' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                background: formData.role === 'client' ? '#eff6ff' : 'white'
              }}>
                <input
                  type="radio"
                  name="role"
                  value="client"
                  checked={formData.role === 'client'}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                我是需求方
              </label>
              <label style={{
                flex: 1,
                padding: '12px',
                border: `2px solid ${formData.role === 'provider' ? '#2563eb' : '#e5e7eb'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                background: formData.role === 'provider' ? '#eff6ff' : 'white'
              }}>
                <input
                  type="radio"
                  name="role"
                  value="provider"
                  checked={formData.role === 'provider'}
                  onChange={handleChange}
                  style={{ marginRight: '8px' }}
                />
                我是服务者
              </label>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              placeholder="请输入用户名"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">邮箱</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              placeholder="请输入邮箱"
              required
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
              placeholder="请输入手机号（选填）"
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入密码"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={loading}
          >
            {loading ? '注册中...' : '注册'}
          </button>
        </form>

        <div className="auth-switch">
          已有账户？<Link to="/login">立即登录</Link>
        </div>
      </div>
    </div>
  )
}

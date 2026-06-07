import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import api from '../api'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const { setToken, setUser } = useStore()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      setLoading(false)
      return
    }

    try {
      const res = await api.post('/users/login', { username, password })
      const { token, user } = res.data
      setToken(token)
      setUser(user)
      
      const rolePaths = {
        admin: '/admin/dashboard',
        provider: '/provider/dashboard',
        client: '/client/dashboard'
      }
      const roleNames = {
        admin: '管理员工作台',
        provider: '服务者工作台',
        client: '客户工作台'
      }
      
      setSuccess(`登录成功！正在跳转到${roleNames[user.role]}...`)
      
      setTimeout(() => {
        navigate(rolePaths[user.role], { replace: true })
      }, 300)
    } catch (err) {
      const msg = err.response?.data?.error || '用户名或密码错误，请重试'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h1 className="auth-title">欢迎回来</h1>
        <p className="auth-subtitle">登录您的技能零工账户</p>

        {error && (
          <div style={{
            padding: '12px 16px',
            background: '#fef2f2',
            color: '#dc2626',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            border: '1px solid #fecaca'
          }}>
            ❌ {error}
          </div>
        )}

        {success && (
          <div style={{
            padding: '12px 16px',
            background: '#f0fdf4',
            color: '#16a34a',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            border: '1px solid #bbf7d0'
          }}>
            ✅ {success}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名 / 邮箱</label>
            <input
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名或邮箱"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px' }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div className="auth-switch">
          还没有账户？<Link to="/register">立即注册</Link>
        </div>

        <div style={{ marginTop: '24px', padding: '16px', background: '#f8fafc', borderRadius: '8px', fontSize: '13px', color: '#475569' }}>
          <div style={{ fontWeight: '600', marginBottom: '8px', color: '#1e293b' }}>平台安全保障</div>
          <div style={{ display: 'grid', gap: '4px' }}>
            <div>✓ 实名认证 · 技能核验 · 信用评分</div>
            <div>✓ 预约确认 · 现场打卡 · 分阶段付款</div>
            <div>✓ 纠纷仲裁 · 信用冻结 · 平台担保</div>
          </div>
        </div>
      </div>
    </div>
  )
}

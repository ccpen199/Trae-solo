import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      const res = await api.post('/auth/login', { username, password })
      onLogin(res.data.user, res.data.token)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.error || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h1>🏫 校园安全事件上报系统</h1>
        <p className="subtitle">请登录以继续使用系统</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>
          
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 8 }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
        
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #eee' }}>
          <p style={{ fontSize: 13, color: '#888', marginBottom: 12 }}>测试账号：</p>
          <div style={{ fontSize: 12, color: '#666', lineHeight: 1.8 }}>
            <div>管理员：admin / admin123</div>
            <div>学生：student1 / student123</div>
            <div>教师：teacher1 / teacher123</div>
            <div>安保：security1 / security123</div>
            <div>校医：doctor1 / doctor123</div>
            <div>管理者：manager1 / manager123</div>
          </div>
        </div>
      </div>
    </div>
  )
}
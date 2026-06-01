import React, { useState } from 'react'

function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const res = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      })
      
      const data = await res.json()
      
      if (data.success) {
        onLogin(data.user)
      } else {
        setError(data.message || '登录失败')
      }
    } catch (err) {
      setError('网络错误，请检查服务是否启动')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>社区矛盾调解系统</h2>
        <p>请登录您的账号</p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
            />
          </div>
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
            />
          </div>
          {error && <p style={{ color: '#e74c3c', fontSize: '14px', marginBottom: '16px' }}>{error}</p>}
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '12px' }}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div style={{ marginTop: '20px', fontSize: '12px', color: '#999', textAlign: 'center' }}>
          <p>测试账号：admin / admin123</p>
        </div>
      </div>
    </div>
  )
}

export default Login

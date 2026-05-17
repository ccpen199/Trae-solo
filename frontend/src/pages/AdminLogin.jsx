import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

const AdminLogin = ({ showToast }) => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!username || !password) {
      showToast('请输入用户名和密码')
      return
    }

    setLoading(true)
    try {
      const res = await axios.post('/api/admin/login', { username, password })
      if (res.data.success) {
        showToast('登录成功')
        navigate('/admin/dashboard')
      } else {
        showToast(res.data.message || '登录失败')
      }
    } catch (error) {
      showToast('网络错误')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>←</span>
          <h1>管理员登录</h1>
        </div>
      </div>

      <div style={{ marginTop: 60 }}>
        <input
          className="input"
          placeholder="用户名"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ marginBottom: 16 }}
        />
        <input
          className="input"
          type="password"
          placeholder="密码"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
        />
        <button
          className="btn btn-primary"
          style={{ marginTop: 24 }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </button>

        <p style={{ textAlign: 'center', marginTop: 24, color: '#999', fontSize: 13 }}>
          默认账号: admin / admin123
        </p>
      </div>
    </div>
  )
}

export default AdminLogin

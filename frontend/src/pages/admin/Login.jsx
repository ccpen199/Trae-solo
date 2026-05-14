import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useStore from '../../store'
import { adminApi } from '../../api'

const AdminLogin = () => {
  const navigate = useNavigate()
  const setAdmin = useStore(state => state.setAdmin)
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username || !password) {
      alert('请输入用户名和密码')
      return
    }

    setLoading(true)
    try {
      const res = await adminApi.login({ username, password })
      if (res.success) {
        setAdmin(res.data)
        navigate('/admin')
      }
    } catch (e) {
      alert(e.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1 className="auth-title">🎯 管理后台</h1>
        <p className="auth-subtitle">精品自营电商平台管理系统</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">用户名</label>
            <input
              type="text"
              className="form-input"
              placeholder="请输入用户名"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">密码</label>
            <input
              type="password"
              className="form-input"
              placeholder="请输入密码"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-block btn-lg"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <div style={{ marginTop: 24, padding: 16, background: '#f5f5f5', borderRadius: 8, fontSize: 13, color: '#666' }}>
          <div style={{ fontWeight: 500, marginBottom: 8 }}>测试账号：</div>
          <div>用户名：admin</div>
          <div>密码：admin123</div>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin

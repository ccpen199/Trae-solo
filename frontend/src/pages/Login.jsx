import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function Login({ onLogin, onRegister, isRegister = false }) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    phone: '',
    role: 'owner'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = isRegister 
        ? await onRegister(formData)
        : await onLogin({ username: formData.username, password: formData.password })
      
      if (!result.success) {
        setError(result.error)
      }
    } catch (err) {
      setError('操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const demoAccounts = [
    { username: 'owner1', password: 'owner123', role: '宠物主人' },
    { username: 'store1', password: 'store123', role: '门店管理员' },
    { username: 'staff1', password: 'staff123', role: '服务人员' },
    { username: 'driver1', password: 'driver123', role: '司机' },
    { username: 'cs1', password: 'cs123', role: '客服' },
    { username: 'admin', password: 'admin123', role: '系统管理员' }
  ]

  const fillDemo = (username, password) => {
    setFormData(prev => ({ ...prev, username, password }))
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>🐕 宠物服务预约平台</h2>
        <p className="subtitle">{isRegister ? '创建新账户' : '欢迎回来，请登录'}</p>
        
        {error && <div className="alert alert-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>用户名</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="请输入用户名"
              required
            />
          </div>
          
          {isRegister && (
            <>
              <div className="form-group">
                <label>姓名</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="请输入姓名"
                  required
                />
              </div>
              <div className="form-group">
                <label>手机号</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="请输入手机号"
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label>密码</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="请输入密码"
              required
            />
          </div>
          
          <div className="form-actions">
            <button 
              type="submit" 
              className="btn btn-primary btn-lg"
              disabled={loading}
            >
              {loading ? '处理中...' : (isRegister ? '注册' : '登录')}
            </button>
          </div>
        </form>
        
        {!isRegister && (
          <div className="card" style={{ marginTop: '20px', padding: '16px' }}>
            <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>演示账号（点击快速填充）：</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
              {demoAccounts.map((acc, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={() => fillDemo(acc.username, acc.password)}
                  style={{ fontSize: '11px', padding: '6px 8px' }}
                >
                  {acc.role}
                </button>
              ))}
            </div>
          </div>
        )}
        
        <p className="switch-mode">
          {isRegister ? (
            <>已有账户？<a onClick={() => navigate('/login')}>立即登录</a></>
          ) : (
            <>还没有账户？<a onClick={() => navigate('/register')}>立即注册</a></>
          )}
        </p>
      </div>
    </div>
  )
}

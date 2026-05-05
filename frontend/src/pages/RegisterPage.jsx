import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { userApi } from '../api'
import { useUserStore } from '../store'

function RegisterPage() {
  const navigate = useNavigate()
  const { setUser } = useUserStore()
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    nickname: ''
  })
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }
  
  const handleRegister = async () => {
    const { username, password, confirmPassword, phone, nickname } = formData
    
    if (!username.trim()) {
      showToast('请输入用户名')
      return
    }
    if (!password) {
      showToast('请输入密码')
      return
    }
    if (password.length < 6) {
      showToast('密码至少6位')
      return
    }
    if (password !== confirmPassword) {
      showToast('两次密码输入不一致')
      return
    }
    
    setLoading(true)
    try {
      const result = await userApi.register({
        username: username.trim(),
        password,
        phone: phone || undefined,
        nickname: nickname || undefined
      })
      
      if (result.success) {
        setUser(result.data.user, result.data.token)
        showToast('注册成功')
        setTimeout(() => navigate('/user'), 500)
      } else {
        showToast(result.message || '注册失败')
      }
    } catch (error) {
      showToast(error.message || '注册失败')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="login-page">
      <div className="login-header">
        <div className="login-logo">🥬</div>
        <h1 className="login-title">注册新用户</h1>
        <p className="login-subtitle">加入一品鲜，享受新鲜生活</p>
      </div>
      
      <div className="login-form">
        <div className="input-group">
          <label className="input-label">用户名 *</label>
          <input
            type="text"
            className="input-field"
            placeholder="请输入用户名"
            value={formData.username}
            onChange={(e) => handleChange('username', e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">昵称</label>
          <input
            type="text"
            className="input-field"
            placeholder="请输入昵称（选填）"
            value={formData.nickname}
            onChange={(e) => handleChange('nickname', e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">手机号</label>
          <input
            type="tel"
            className="input-field"
            placeholder="请输入手机号（选填）"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">密码 *</label>
          <input
            type="password"
            className="input-field"
            placeholder="请输入密码（至少6位）"
            value={formData.password}
            onChange={(e) => handleChange('password', e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">确认密码 *</label>
          <input
            type="password"
            className="input-field"
            placeholder="请再次输入密码"
            value={formData.confirmPassword}
            onChange={(e) => handleChange('confirmPassword', e.target.value)}
          />
        </div>
        
        <button
          className="btn btn-primary btn-block btn-lg mt-lg"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? '注册中...' : '注册'}
        </button>
        
        <div className="text-center mt-lg">
          已有账号？<Link to="/login" className="login-link">立即登录</Link>
        </div>
      </div>
      
      <div className="login-footer">
        <p>注册即表示同意 <Link to="/agreement" className="login-link">《用户协议》</Link> 和 <Link to="/privacy" className="login-link">《隐私政策》</Link></p>
      </div>
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default RegisterPage

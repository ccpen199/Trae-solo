import { useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { userApi } from '../api'
import { useUserStore } from '../store'

function LoginPage() {
  const navigate = useNavigate()
  const { setUser } = useUserStore()
  
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState(null)
  
  const showToast = useCallback((message) => {
    setToast(message)
    setTimeout(() => setToast(null), 2000)
  }, [])
  
  const handleLogin = async () => {
    if (!username.trim()) {
      showToast('请输入用户名')
      return
    }
    if (!password) {
      showToast('请输入密码')
      return
    }
    
    setLoading(true)
    try {
      const result = await userApi.login({ username: username.trim(), password })
      if (result.success) {
        setUser(result.data.user, result.data.token)
        showToast('登录成功')
        setTimeout(() => navigate('/user'), 500)
      } else {
        showToast(result.message || '登录失败')
      }
    } catch (error) {
      showToast(error.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }
  
  const handleQuickLogin = async () => {
    setLoading(true)
    try {
      const testUser = {
        username: 'testuser',
        password: '123456'
      }
      
      let result = await userApi.login(testUser)
      if (!result.success) {
        const registerResult = await userApi.register({
          ...testUser,
          nickname: '测试用户',
          phone: '13800138000'
        })
        if (registerResult.success) {
          result = await userApi.login(testUser)
        }
      }
      
      if (result.success) {
        setUser(result.data.user, result.data.token)
        showToast('登录成功')
        setTimeout(() => navigate('/user'), 500)
      } else {
        showToast(result.message || '登录失败')
      }
    } catch (error) {
      showToast(error.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="login-page">
      <div className="login-header">
        <div className="login-logo">🥬</div>
        <h1 className="login-title">一品鲜</h1>
        <p className="login-subtitle">新鲜直达 · 半小时配送</p>
      </div>
      
      <div className="login-form">
        <div className="input-group">
          <label className="input-label">用户名</label>
          <input
            type="text"
            className="input-field"
            placeholder="请输入用户名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        
        <div className="input-group">
          <label className="input-label">密码</label>
          <input
            type="password"
            className="input-field"
            placeholder="请输入密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
          />
        </div>
        
        <button
          className="btn btn-primary btn-block btn-lg mt-lg"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? '登录中...' : '登录'}
        </button>
        
        <button
          className="btn btn-block btn-lg mt-md"
          onClick={handleQuickLogin}
          disabled={loading}
          style={{ backgroundColor: 'var(--bg-gray)' }}
        >
          快速体验登录
        </button>
        
        <div className="flex-between mt-lg">
          <Link to="/register" className="login-link">新用户注册</Link>
          <span className="text-muted">忘记密码？</span>
        </div>
      </div>
      
      <div className="login-footer">
        <p>登录即表示同意 <Link to="/agreement" className="login-link">《用户协议》</Link> 和 <Link to="/privacy" className="login-link">《隐私政策》</Link></p>
      </div>
      
      {toast && (
        <div className="toast">{toast}</div>
      )}
    </div>
  )
}

export default LoginPage

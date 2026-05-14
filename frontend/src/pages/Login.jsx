import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, MessageCircle, Shield } from 'lucide-react'
import useStore from '../store/useStore'
import api from '../utils/api'
import { showToast } from '../utils/toast'

function Login() {
  const navigate = useNavigate()
  const login = useStore((state) => state.login)
  
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loginType, setLoginType] = useState('phone')
  
  const sendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入正确的手机号')
      return
    }
    
    try {
      const response = await api.post('/auth/send-code', { phone })
      showToast(`验证码已发送: ${response.mockCode}`)
      setCode(response.mockCode)
      setCountdown(60)
      
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (error) {
      showToast('发送失败，请重试')
    }
  }
  
  const handlePhoneLogin = async (e) => {
    e.preventDefault()
    
    if (!phone || !code) {
      showToast('请填写完整信息')
      return
    }
    
    setLoading(true)
    
    try {
      await login({ phone, code }, 'phone')
      showToast('登录成功')
      
      const redirectPath = localStorage.getItem('redirectAfterLogin') || '/'
      localStorage.removeItem('redirectAfterLogin')
      navigate(redirectPath, { replace: true })
    } catch (error) {
      showToast(error.response?.data?.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }
  
  const handleWechatLogin = async () => {
    setLoading(true)
    
    try {
      await login({ code: 'mock_wechat_code' }, 'wechat')
      showToast('微信登录成功')
      
      const redirectPath = localStorage.getItem('redirectAfterLogin') || '/'
      localStorage.removeItem('redirectAfterLogin')
      navigate(redirectPath, { replace: true })
    } catch (error) {
      showToast(error.response?.data?.error || '微信登录失败')
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <div className="login-container">
      <div className="logo-area">
        <div className="logo">🛍️</div>
        <h1 className="app-name">贝店</h1>
        <p className="app-slogan">S2KOL2C 社交电商平台</p>
      </div>
      
      <div className="login-form">
        <form onSubmit={handlePhoneLogin}>
          <div className="input-group">
            <Phone size={20} color="#999" />
            <input
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={11}
            />
          </div>
          
          <div className="input-group code-input-group">
            <Shield size={20} color="#999" />
            <input
              type="text"
              placeholder="请输入验证码"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              maxLength={6}
            />
            <button
              type="button"
              className="send-code-btn"
              onClick={sendCode}
              disabled={countdown > 0}
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>
          
          <button
            type="submit"
            className="login-btn"
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        
        <div className="divider">
          <span>其他登录方式</span>
        </div>
        
        <button
          type="button"
          className="wechat-login-btn"
          onClick={handleWechatLogin}
          disabled={loading}
        >
          <MessageCircle size={22} />
          微信一键登录
        </button>
      </div>
    </div>
  )
}

export default Login

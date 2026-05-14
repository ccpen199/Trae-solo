import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import useStore from '../store'
import { authApi, cartApi } from '../api'
import './Login.css'

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const setUser = useStore(state => state.setUser)
  
  const [loginType, setLoginType] = useState('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [account, setAccount] = useState('')
  const [password, setPassword] = useState('')
  const [codeCountdown, setCodeCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showSlider, setShowSlider] = useState(false)
  const [sliderVerified, setSliderVerified] = useState(false)

  const from = location.state?.from?.pathname || '/'

  const startCountdown = () => {
    setCodeCountdown(60)
    const timer = setInterval(() => {
      setCodeCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const handleSendCode = async () => {
    if (!phone) {
      setError('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('手机号格式不正确')
      return
    }
    
    setShowSlider(true)
  }

  const handleSliderVerify = async () => {
    setSliderVerified(true)
    setShowSlider(false)
    
    try {
      const res = await authApi.sendCode({
        phone,
        type: 'login'
      })
      if (res.success) {
        startCountdown()
        alert(`验证码已发送：${res.mockCode}`)
      }
    } catch (e) {
      setError(e.error || '发送验证码失败')
    }
  }

  const handlePhoneLogin = async (e) => {
    e.preventDefault()
    if (!phone || !code) {
      setError('请输入手机号和验证码')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      const res = await authApi.phoneLogin({ phone, code })
      if (res.success) {
        setUser(res.user, res.token)
        await mergeCart()
        navigate(from, { replace: true })
      }
    } catch (e) {
      setError(e.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordLogin = async (e) => {
    e.preventDefault()
    if (!account || !password) {
      setError('请输入账号和密码')
      return
    }
    
    setLoading(true)
    setError('')

    try {
      const res = await authApi.login({ account, password })
      if (res.success) {
        setUser(res.user, res.token)
        await mergeCart()
        navigate(from, { replace: true })
      }
    } catch (e) {
      setError(e.error || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const mergeCart = async () => {
    const sessionId = localStorage.getItem('sessionId')
    if (sessionId) {
      try {
        await cartApi.merge({ sessionId })
      } catch (e) {
        console.log('购物车合并失败', e)
      }
    }
  }

  const handleThirdParty = (provider) => {
    authApi.thirdPartyLogin({
      provider,
      openId: `mock_${provider}_${Date.now()}`,
      nickname: `${provider}用户`,
      avatar: ''
    }).then(res => {
      if (res.success) {
        setUser(res.user, res.token)
        mergeCart().then(() => {
          navigate(from, { replace: true })
        })
      }
    }).catch(e => {
      setError(e.error || '第三方登录失败')
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="logo-icon">🎯</span>
            <span className="logo-text">精品自营</span>
          </Link>
          <h1>欢迎回来</h1>
          <p>登录后享受更多会员优惠</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${loginType === 'phone' ? 'active' : ''}`}
            onClick={() => setLoginType('phone')}
          >
            手机号登录
          </button>
          <button 
            className={`auth-tab ${loginType === 'password' ? 'active' : ''}`}
            onClick={() => setLoginType('password')}
          >
            账号密码登录
          </button>
        </div>

        {error && <div className="error-alert">{error}</div>}

        {loginType === 'phone' ? (
          <form onSubmit={handlePhoneLogin} className="auth-form">
            <div className="form-item">
              <label className="form-label">手机号</label>
              <input
                type="tel"
                className="form-input"
                placeholder="请输入手机号"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
            </div>
            <div className="form-item">
              <label className="form-label">验证码</label>
              <div className="code-input-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入验证码"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                />
                <button
                  type="button"
                  className={`code-btn ${codeCountdown > 0 ? 'disabled' : ''}`}
                  onClick={handleSendCode}
                  disabled={codeCountdown > 0}
                >
                  {codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        ) : (
          <form onSubmit={handlePasswordLogin} className="auth-form">
            <div className="form-item">
              <label className="form-label">账号（手机号/邮箱）</label>
              <input
                type="text"
                className="form-input"
                placeholder="请输入手机号或邮箱"
                value={account}
                onChange={e => setAccount(e.target.value)}
              />
            </div>
            <div className="form-item">
              <label className="form-label">密码</label>
              <input
                type="password"
                className="form-input"
                placeholder="请输入密码"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
            <div className="form-links">
              <Link to="/reset-password" className="link">忘记密码？</Link>
            </div>
            <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>还没有账号？<Link to="/register" className="link">立即注册</Link></p>
        </div>

        <div className="third-party-login">
          <div className="divider"><span>第三方登录</span></div>
          <div className="third-party-buttons">
            <button className="third-party-btn wechat" onClick={() => handleThirdParty('wechat')}>
              <span className="btn-icon">💬</span>
              <span>微信</span>
            </button>
            <button className="third-party-btn alipay" onClick={() => handleThirdParty('alipay')}>
              <span className="btn-icon">💰</span>
              <span>支付宝</span>
            </button>
            <button className="third-party-btn qq" onClick={() => handleThirdParty('qq')}>
              <span className="btn-icon">🐧</span>
              <span>QQ</span>
            </button>
          </div>
        </div>
      </div>

      {showSlider && (
        <div className="slider-modal">
          <div className="slider-card">
            <h3>安全验证</h3>
            <p>拖动滑块完成验证</p>
            <div className="slider-track">
              <div className="slider-fill" style={{ width: '100%' }}></div>
              <div className="slider-btn verified">✓</div>
            </div>
            <div className="slider-actions">
              <button className="btn btn-ghost" onClick={() => setShowSlider(false)}>取消</button>
              <button className="btn btn-primary" onClick={handleSliderVerify}>验证通过</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login

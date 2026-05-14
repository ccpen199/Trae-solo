import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import useStore from '../store'
import { authApi } from '../api'
import './Login.css'

const emailDomains = [
  '163.com',
  '126.com',
  'yeah.net',
  'qq.com',
  'gmail.com',
  'outlook.com'
]

const Register = () => {
  const navigate = useNavigate()
  const setUser = useStore(state => state.setUser)
  
  const [registerType, setRegisterType] = useState('phone')
  const [phone, setPhone] = useState('')
  const [emailPrefix, setEmailPrefix] = useState('')
  const [emailDomain, setEmailDomain] = useState('163.com')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [codeCountdown, setCodeCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const email = emailPrefix && emailDomain ? `${emailPrefix}@${emailDomain}` : ''

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
    const contact = registerType === 'phone' ? phone : email
    if (!contact) {
      setError(registerType === 'phone' ? '请输入手机号' : '请输入邮箱')
      return
    }

    try {
      const res = await authApi.sendCode({
        [registerType === 'phone' ? 'phone' : 'email']: contact,
        type: 'register'
      })
      if (res.success) {
        startCountdown()
        alert(`验证码已发送：${res.mockCode}`)
      }
    } catch (e) {
      setError(e.error || '发送验证码失败')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (registerType === 'phone' && !phone) {
      setError('请输入手机号')
      return
    }
    if (registerType === 'email' && !email) {
      setError('请输入邮箱')
      return
    }
    if (!code) {
      setError('请输入验证码')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }
    if (password.length < 6) {
      setError('密码长度至少6位')
      return
    }
    if (password !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }

    setLoading(true)

    try {
      const res = await authApi.register({
        phone: registerType === 'phone' ? phone : null,
        email: registerType === 'email' ? email : null,
        password,
        code,
        type: 'register'
      })
      if (res.success) {
        setUser(res.user, res.token)
        alert('注册成功！')
        navigate('/', { replace: true })
      }
    } catch (e) {
      setError(e.error || '注册失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <Link to="/" className="auth-logo">
            <span className="logo-icon">🎯</span>
            <span className="logo-text">精品自营</span>
          </Link>
          <h1>创建账号</h1>
          <p>加入会员，享受专属优惠</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${registerType === 'phone' ? 'active' : ''}`}
            onClick={() => setRegisterType('phone')}
          >
            手机号注册
          </button>
          <button 
            className={`auth-tab ${registerType === 'email' ? 'active' : ''}`}
            onClick={() => setRegisterType('email')}
          >
            邮箱注册
          </button>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {registerType === 'phone' ? (
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
          ) : (
            <div className="form-item">
              <label className="form-label">邮箱</label>
              <div className="email-input-group">
                <input
                  type="text"
                  className="form-input"
                  placeholder="请输入邮箱前缀"
                  value={emailPrefix}
                  onChange={e => setEmailPrefix(e.target.value)}
                  style={{ flex: 1 }}
                />
                <span className="email-at">@</span>
                <select
                  className="form-input"
                  value={emailDomain}
                  onChange={e => setEmailDomain(e.target.value)}
                  style={{ maxWidth: 150 }}
                >
                  {emailDomains.map(domain => (
                    <option key={domain} value={domain}>{domain}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

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

          <div className="form-item">
            <label className="form-label">设置密码</label>
            <input
              type="password"
              className="form-input"
              placeholder="请设置密码（至少6位）"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="form-item">
            <label className="form-label">确认密码</label>
            <input
              type="password"
              className="form-input"
              placeholder="请再次输入密码"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? '注册中...' : '立即注册'}
          </button>
        </form>

        <div className="auth-footer">
          <p>已有账号？<Link to="/login" className="link">立即登录</Link></p>
        </div>
      </div>
    </div>
  )
}

export default Register

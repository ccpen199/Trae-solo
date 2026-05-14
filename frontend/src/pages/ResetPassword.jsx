import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import './Login.css'

const ResetPassword = () => {
  const navigate = useNavigate()
  
  const [type, setType] = useState('phone')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [codeCountdown, setCodeCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    const contact = type === 'phone' ? phone : email
    if (!contact) {
      setError(type === 'phone' ? '请输入手机号' : '请输入邮箱')
      return
    }

    try {
      const res = await authApi.sendCode({
        [type === 'phone' ? 'phone' : 'email']: contact,
        type: 'reset'
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

    const contact = type === 'phone' ? phone : email
    if (!contact) {
      setError(type === 'phone' ? '请输入手机号' : '请输入邮箱')
      return
    }
    if (!code) {
      setError('请输入验证码')
      return
    }
    if (!password) {
      setError('请输入新密码')
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
      const res = await authApi.resetPassword({
        [type === 'phone' ? 'phone' : 'email']: contact,
        password,
        code
      })
      if (res.success) {
        alert('密码重置成功！')
        navigate('/login', { replace: true })
      }
    } catch (e) {
      setError(e.error || '重置失败')
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
          <h1>找回密码</h1>
          <p>验证身份后重置密码</p>
        </div>

        <div className="auth-tabs">
          <button 
            className={`auth-tab ${type === 'phone' ? 'active' : ''}`}
            onClick={() => setType('phone')}
          >
            手机号找回
          </button>
          <button 
            className={`auth-tab ${type === 'email' ? 'active' : ''}`}
            onClick={() => setType('email')}
          >
            邮箱找回
          </button>
        </div>

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-item">
            <label className="form-label">{type === 'phone' ? '手机号' : '邮箱'}</label>
            <input
              type={type === 'phone' ? 'tel' : 'email'}
              className="form-input"
              placeholder={type === 'phone' ? '请输入手机号' : '请输入邮箱'}
              value={type === 'phone' ? phone : email}
              onChange={e => type === 'phone' ? setPhone(e.target.value) : setEmail(e.target.value)}
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

          <div className="form-item">
            <label className="form-label">新密码</label>
            <input
              type="password"
              className="form-input"
              placeholder="请设置新密码（至少6位）"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>

          <div className="form-item">
            <label className="form-label">确认新密码</label>
            <input
              type="password"
              className="form-input"
              placeholder="请再次输入新密码"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? '重置中...' : '重置密码'}
          </button>
        </form>

        <div className="auth-footer">
          <p>想起密码了？<Link to="/login" className="link">去登录</Link></p>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword

import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore, useAppStore } from '../store'
import { auth } from '../api'

function Register() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuthStore()
  const { showToast, setLoading } = useAppStore()

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    phone: '',
    smsCode: ''
  })
  const [countdown, setCountdown] = useState(0)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleSendCode = async () => {
    if (!formData.phone) {
      showToast('请输入手机号', 'error')
      return
    }

    try {
      setLoading(true)
      await auth.sendSmsCode({ phone: formData.phone, type: 'register' })
      setCountdown(60)
      showToast('验证码已发送', 'success')
    } catch (error) {
      showToast(error.response?.data?.message || '发送失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.password !== formData.confirmPassword) {
      showToast('两次密码输入不一致', 'error')
      return
    }

    try {
      setLoading(true)
      const res = await auth.register({
        username: formData.username,
        password: formData.password,
        phone: formData.phone,
        sms_code: formData.smsCode
      })

      if (res.success) {
        login(res.data.access_token, res.data.user)
        showToast('注册成功', 'success')
        navigate('/')
      } else {
        showToast(res.message || '注册失败', 'error')
      }
    } catch (error) {
      showToast(error.response?.data?.message || '注册失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>注册账号</h1>
        <p style={{ color: '#999', marginTop: '8px' }}>创建您的51信用卡管家账号</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <label>用户名</label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            placeholder="请输入用户名"
          />
        </div>
        <div className="input-group input-row">
          <div style={{ flex: 1 }}>
            <label>手机号</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="请输入手机号"
            />
          </div>
          <button
            type="button"
            className="btn-code"
            onClick={handleSendCode}
            disabled={countdown > 0}
            style={{ marginTop: '30px' }}
          >
            {countdown > 0 ? `${countdown}s` : '获取验证码'}
          </button>
        </div>
        <div className="input-group">
          <label>验证码</label>
          <input
            type="text"
            value={formData.smsCode}
            onChange={(e) => setFormData({ ...formData, smsCode: e.target.value })}
            placeholder="请输入验证码"
          />
        </div>
        <div className="input-group">
          <label>密码</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="请输入密码"
          />
        </div>
        <div className="input-group">
          <label>确认密码</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            placeholder="请再次输入密码"
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block mt-20">
          注册
        </button>
      </form>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Link to="/login" style={{ color: '#ff6b6b', fontSize: '14px' }}>
          已有账号？立即登录
        </Link>
      </div>
    </div>
  )
}

export default Register

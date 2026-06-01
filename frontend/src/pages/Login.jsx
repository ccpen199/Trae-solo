import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore, useAppStore } from '../store'
import { auth } from '../api'

function Login() {
  const navigate = useNavigate()
  const { login, isAuthenticated } = useAuthStore()
  const { showToast, setLoading } = useAppStore()

  const [loginType, setLoginType] = useState('password')
  const [formData, setFormData] = useState({
    username: '',
    password: '',
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
      await auth.sendSmsCode({ phone: formData.phone, type: 'login' })
      setCountdown(60)
      showToast('验证码已发送', 'success')
    } catch (error) {
      showToast('发送失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleThirdPartyLogin = async (platform) => {
    try {
      setLoading(true)
      const res = await auth.thirdPartyLogin({
        platform,
        openid: `${platform}_${Date.now()}`,
        nickname: `${platform}用户`
      })

      if (res.success) {
        login(res.data.access_token, res.data.user)
        showToast('登录成功', 'success')
        navigate('/')
      } else {
        showToast(res.message || '登录失败', 'error')
      }
    } catch (error) {
      showToast('登录失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)
      let res

      if (loginType === 'password') {
        res = await auth.login({
          username: formData.username,
          password: formData.password,
          login_type: 'password'
        })
      } else {
        res = await auth.login({
          phone: formData.phone,
          sms_code: formData.smsCode,
          login_type: 'sms'
        })
      }

      if (res.success) {
        login(res.data.access_token, res.data.user)
        showToast('登录成功', 'success')
        navigate('/')
      } else {
        showToast(res.message || '登录失败', 'error')
      }
    } catch (error) {
      showToast('登录失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>💳</div>
        <h1 style={{ fontSize: '24px', fontWeight: '600', color: '#333' }}>51信用卡管家</h1>
        <p style={{ color: '#999', marginTop: '8px' }}>智能管卡，轻松还款</p>
      </div>

      <div style={{ display: 'flex', marginBottom: '24px', background: '#f5f5f5', borderRadius: '8px', padding: '4px' }}>
        <div
          onClick={() => setLoginType('password')}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '10px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: loginType === 'password' ? 'white' : 'transparent',
            boxShadow: loginType === 'password' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            color: loginType === 'password' ? '#333' : '#999',
            fontWeight: loginType === 'password' ? '500' : 'normal'
          }}
        >
          密码登录
        </div>
        <div
          onClick={() => setLoginType('sms')}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '10px',
            borderRadius: '6px',
            cursor: 'pointer',
            background: loginType === 'sms' ? 'white' : 'transparent',
            boxShadow: loginType === 'sms' ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            color: loginType === 'sms' ? '#333' : '#999',
            fontWeight: loginType === 'sms' ? '500' : 'normal'
          }}
        >
          短信登录
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {loginType === 'password' ? (
          <>
            <div className="input-group">
              <label>用户名/手机号</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="请输入用户名或手机号"
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
          </>
        ) : (
          <>
            <div className="input-group">
              <label>手机号</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="请输入手机号"
              />
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
              <div className="input-group" style={{ flex: 1, marginBottom: 0 }}>
                <label>验证码</label>
                <input
                  type="text"
                  value={formData.smsCode}
                  onChange={(e) => setFormData({ ...formData, smsCode: e.target.value })}
                  placeholder="请输入验证码"
                />
              </div>
              <button
                type="button"
                onClick={handleSendCode}
                disabled={countdown > 0}
                style={{
                  padding: '10px 16px',
                  borderRadius: '8px',
                  background: countdown > 0 ? '#ccc' : '#ff6b6b',
                  color: 'white',
                  fontSize: '14px',
                  whiteSpace: 'nowrap'
                }}
              >
                {countdown > 0 ? `${countdown}s` : '获取验证码'}
              </button>
            </div>
          </>
        )}

        <button
          type="submit"
          style={{
            width: '100%',
            marginTop: '24px',
            padding: '14px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)',
            color: 'white',
            fontSize: '16px',
            fontWeight: '500'
          }}
        >
          登录
        </button>
      </form>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <Link to="/register" style={{ color: '#ff6b6b', fontSize: '14px' }}>
          还没有账号？立即注册
        </Link>
      </div>

      <div style={{ marginTop: '40px' }}>
        <p style={{ textAlign: 'center', color: '#999', fontSize: '13px', marginBottom: '20px' }}>
          第三方登录
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '30px' }}>
          <button
            type="button"
            onClick={() => handleThirdPartyLogin('qq')}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: '#12B7F5',
              color: 'white',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            Q
          </button>
          <button
            type="button"
            onClick={() => handleThirdPartyLogin('wechat')}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: '#07C160',
              color: 'white',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            W
          </button>
          <button
            type="button"
            onClick={() => handleThirdPartyLogin('weibo')}
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              background: '#E6162D',
              color: 'white',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            微
          </button>
        </div>
      </div>

      <div style={{ marginTop: '40px', textAlign: 'center' }}>
        <p style={{ color: '#999', fontSize: '12px' }}>
          测试账号: test / 123456
        </p>
      </div>
    </div>
  )
}

export default Login

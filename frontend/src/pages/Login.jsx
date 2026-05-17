import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import { userApi } from '../api'

const Login = ({ showToast }) => {
  const navigate = useNavigate()
  const { setUser, setToken } = useStore()
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入正确的手机号')
      return
    }

    setLoading(true)
    try {
      const res = await userApi.login(phone)
      if (res.success) {
        setUser(res.data.user)
        setToken(res.data.token)
        showToast('登录成功')
        navigate('/')
      } else {
        showToast(res.message || '登录失败')
      }
    } catch (error) {
      showToast('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <div className="header">
        <h1>登录</h1>
        <p style={{ opacity: 0.9, marginTop: 8 }}>输入手机号即可快速登录</p>
      </div>
      <div style={{ marginTop: 40 }}>
        <input
          className="input"
          type="tel"
          placeholder="请输入手机号"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={11}
        />
        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading}
          style={{ marginTop: 20 }}
        >
          {loading ? '登录中...' : '登录'}
        </button>
      </div>
      <div style={{ textAlign: 'center', marginTop: 40, color: '#999' }}>
        <p>登录即表示同意《用户服务协议》和《隐私政策》</p>
        <p style={{ marginTop: 20, cursor: 'pointer' }} onClick={() => navigate('/admin/login')}>
          管理员登录入口
        </p>
      </div>
    </div>
  )
}

export default Login

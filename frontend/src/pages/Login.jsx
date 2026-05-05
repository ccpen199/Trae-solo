import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Phone, Lock, ArrowRight, Shield } from 'lucide-react'
import { authApi } from '../services/api'
import { useAuthStore } from '../store'

const LoginPage = () => {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [mockCode, setMockCode] = useState('')
  const countdownRef = useRef(null)

  const handleSendCode = async () => {
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      setError('请输入正确的手机号')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await authApi.sendCode(phone)
      setCodeSent(true)
      setMockCode(res.data.mockCode)
      setCountdown(60)
      
      if (countdownRef.current) clearInterval(countdownRef.current)
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } catch (e) {
      setError(e.response?.data?.error || '发送失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleLogin = async () => {
    if (!code) {
      setError('请输入验证码')
      return
    }

    setLoading(true)
    setError('')

    try {
      const res = await authApi.login(phone, code)
      const { token, user, onboardingStatus } = res.data
      setAuth(token, user, onboardingStatus)

      if (!onboardingStatus.isVerified) {
        navigate('/verify')
      } else if (!onboardingStatus.canRide) {
        navigate('/deposit')
      } else {
        navigate('/')
      }
    } catch (e) {
      setError(e.response?.data?.error || '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.logo}>
          <BikeIcon />
        </div>
        <h1 style={styles.title}>街兔电单车</h1>
        <p style={styles.subtitle}>轻松出行，绿色环保</p>
      </div>

      <div style={styles.form}>
        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.inputGroup}>
          <Phone size={20} color="#999" style={styles.inputIcon} />
          <input
            type="tel"
            placeholder="请输入手机号"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            maxLength={11}
            style={styles.input}
            disabled={codeSent}
          />
        </div>

        {codeSent && (
          <div style={styles.inputGroup}>
            <Lock size={20} color="#999" style={styles.inputIcon} />
            <input
              type="text"
              placeholder="请输入验证码"
              value={code}
              onChange={e => setCode(e.target.value)}
              maxLength={6}
              style={styles.input}
            />
            <button
              onClick={handleSendCode}
              disabled={countdown > 0 || loading}
              style={{
                ...styles.codeBtn,
                ...(countdown > 0 || loading ? styles.codeBtnDisabled : {})
              }}
            >
              {countdown > 0 ? `${countdown}s` : '获取验证码'}
            </button>
          </div>
        )}

        {mockCode && (
          <div style={styles.mockHint}>
            <Shield size={14} color="#FF6B00" />
            <span>演示验证码：<strong>{mockCode}</strong></span>
          </div>
        )}

        <button
          onClick={codeSent ? handleLogin : handleSendCode}
          disabled={loading}
          style={styles.submitBtn}
        >
          {loading ? '请稍候...' : (codeSent ? '登录' : '下一步')}
          <ArrowRight size={18} style={{ marginLeft: 8 }} />
        </button>
      </div>

      <div style={styles.footer}>
        <p style={styles.agreement}>
          登录即表示同意
          <span style={styles.link}>《用户协议》</span>
          和
          <span style={styles.link}>《隐私政策》</span>
        </p>
      </div>
    </div>
  )
}

const BikeIcon = () => (
  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="2">
    <circle cx="5.5" cy="17.5" r="3.5" />
    <circle cx="18.5" cy="17.5" r="3.5" />
    <path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2z" />
    <path d="M12.8 17.5L10 13.5l-2-4 4.5-3.5" />
    <path d="M7.5 17.5L10 14" />
    <path d="M10.5 6.5L15.5 9l3 5.5" />
    <path d="M18.5 14v-3.5" />
  </svg>
)

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fff',
    padding: 40,
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  logo: {
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
  },
  form: {
    flex: 1,
  },
  error: {
    backgroundColor: '#FFF2F0',
    color: '#FF4D4F',
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
  inputGroup: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    padding: '0 16px',
    marginBottom: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    border: 'none',
    outline: 'none',
    fontSize: 16,
    backgroundColor: 'transparent',
    color: '#333',
  },
  codeBtn: {
    padding: '8px 12',
    backgroundColor: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    fontSize: 13,
    cursor: 'pointer',
  },
  codeBtnDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed',
  },
  mockHint: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF7E6',
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
    color: '#FF6B00',
    marginBottom: 20,
  },
  submitBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 20,
  },
  agreement: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 1.6,
  },
  link: {
    color: '#FF6B00',
    margin: '0 4px',
  },
}

export default LoginPage

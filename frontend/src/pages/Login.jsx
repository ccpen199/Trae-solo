import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Login = () => {
  const navigate = useNavigate()
  const { login, oauthLogin } = useAuth()
  const [username, setUsername] = useState('demo')
  const [password, setPassword] = useState('123456')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(username, password)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.message || '登录失败')
      }
    } catch (err) {
      setError('登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = async (platform) => {
    setLoading(true)
    try {
      const result = await oauthLogin(platform)
      if (result.success) {
        navigate('/')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.logoSection}>
        <div style={styles.logo}>💧</div>
        <h1 style={styles.title}>水滴</h1>
        <p style={styles.subtitle}>习惯养成社区</p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <input
            type="text"
            placeholder="用户名 / 手机号"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
        </div>
        <div style={styles.inputGroup}>
          <input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>

        <div style={styles.links}>
          <Link to="/register" style={styles.link}>注册账号</Link>
          <span style={styles.divider}>|</span>
          <span style={styles.link}>忘记密码</span>
        </div>
      </form>

      <div style={styles.oauthSection}>
        <p style={styles.oauthLabel}>其他登录方式</p>
        <div style={styles.oauthButtons}>
          <button onClick={() => handleOAuthLogin('wechat')} style={styles.oauthButton}>
            <span style={styles.oauthIcon}>💬</span>
            <span>微信</span>
          </button>
          <button onClick={() => handleOAuthLogin('weibo')} style={styles.oauthButton}>
            <span style={styles.oauthIcon}>📢</span>
            <span>微博</span>
          </button>
          <button onClick={() => handleOAuthLogin('qq')} style={styles.oauthButton}>
            <span style={styles.oauthIcon}>🐧</span>
            <span>QQ</span>
          </button>
        </div>
      </div>

      <p style={styles.tip}>测试账号: demo / 123456</p>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    padding: '40px 24px',
    background: 'linear-gradient(135deg, #4CAF50 0%, #81C784 100%)'
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '40px'
  },
  logo: {
    fontSize: '64px',
    marginBottom: '12px'
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '8px'
  },
  subtitle: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.8)'
  },
  form: {
    background: '#fff',
    borderRadius: '16px',
    padding: '24px',
    marginBottom: '24px'
  },
  inputGroup: {
    marginBottom: '16px'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  error: {
    color: '#f44336',
    fontSize: '13px',
    marginBottom: '12px'
  },
  button: {
    width: '100%',
    padding: '14px',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer'
  },
  links: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '16px',
    gap: '12px'
  },
  link: {
    color: '#4CAF50',
    fontSize: '14px',
    textDecoration: 'none',
    cursor: 'pointer'
  },
  divider: {
    color: '#ddd'
  },
  oauthSection: {
    textAlign: 'center'
  },
  oauthLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: '13px',
    marginBottom: '16px'
  },
  oauthButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '24px'
  },
  oauthButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
    background: 'none',
    border: 'none',
    color: '#fff',
    cursor: 'pointer',
    fontSize: '13px'
  },
  oauthIcon: {
    fontSize: '28px'
  },
  tip: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.6)',
    fontSize: '12px',
    marginTop: '24px'
  }
}

export default Login
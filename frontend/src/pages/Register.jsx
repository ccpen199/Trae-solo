import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

const Register = () => {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    username: '',
    nickname: '',
    password: '',
    phone: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [nicknameAvailable, setNicknameAvailable] = useState(null)

  const checkNickname = async () => {
    if (!form.nickname) return
    try {
      const res = await api.get(`/auth/check-nickname/${form.nickname}`)
      setNicknameAvailable(res.data.data.available)
    } catch (err) {
      setNicknameAvailable(null)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.nickname || !form.password) {
      setError('请填写完整信息')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await register(form)
      if (result.success) {
        navigate('/')
      } else {
        setError(result.message || '注册失败')
      }
    } catch (err) {
      setError('注册失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <Link to="/login" style={styles.back}>← 返回</Link>
        <h1 style={styles.title}>注册账号</h1>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputGroup}>
          <input
            type="text"
            placeholder="用户名"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <div style={styles.nicknameInput}>
            <input
              type="text"
              placeholder="昵称"
              value={form.nickname}
              onChange={(e) => setForm({ ...form, nickname: e.target.value })}
              onBlur={checkNickname}
              style={{ ...styles.input, flex: 1 }}
            />
          </div>
          {nicknameAvailable !== null && (
            <p style={nicknameAvailable ? styles.available : styles.notAvailable}>
              {nicknameAvailable ? '✓ 昵称可用' : '✗ 昵称已被使用'}
            </p>
          )}
        </div>

        <div style={styles.inputGroup}>
          <input
            type="password"
            placeholder="密码"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            style={styles.input}
          />
        </div>

        <div style={styles.inputGroup}>
          <input
            type="tel"
            placeholder="手机号（选填）"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            style={styles.input}
          />
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? '注册中...' : '注册'}
        </button>

        <div style={styles.footer}>
          <span>已有账号？</span>
          <Link to="/login" style={styles.link}>去登录</Link>
        </div>
      </form>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    background: '#f5f5f5'
  },
  header: {
    padding: '16px 20px',
    background: '#fff',
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  back: {
    fontSize: '16px',
    color: '#333',
    textDecoration: 'none'
  },
  title: {
    fontSize: '18px',
    fontWeight: '600'
  },
  form: {
    padding: '24px 20px'
  },
  inputGroup: {
    marginBottom: '16px'
  },
  nicknameInput: {
    display: 'flex',
    gap: '12px'
  },
  input: {
    width: '100%',
    padding: '14px 16px',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '15px',
    outline: 'none',
    background: '#fff'
  },
  checkButton: {
    padding: '0 16px',
    background: '#4CAF50',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    whiteSpace: 'nowrap',
    cursor: 'pointer'
  },
  available: {
    color: '#4CAF50',
    fontSize: '13px',
    marginTop: '8px'
  },
  notAvailable: {
    color: '#f44336',
    fontSize: '13px',
    marginTop: '8px'
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
    cursor: 'pointer',
    marginTop: '12px'
  },
  footer: {
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px',
    color: '#666'
  },
  link: {
    color: '#4CAF50',
    textDecoration: 'none',
    marginLeft: '4px'
  }
}

export default Register
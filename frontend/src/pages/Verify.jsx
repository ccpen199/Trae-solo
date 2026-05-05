import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Shield, Check, AlertCircle } from 'lucide-react'
import { userApi } from '../services/api'
import { useAuthStore } from '../store'

const VerifyPage = () => {
  const navigate = useNavigate()
  const { updateOnboarding, updateUser } = useAuthStore()
  const [realName, setRealName] = useState('')
  const [idCard, setIdCard] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async () => {
    if (!realName.trim()) {
      setError('请输入真实姓名')
      return
    }
    if (!/(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/.test(idCard)) {
      setError('请输入正确的身份证号')
      return
    }

    setLoading(true)
    setError('')

    try {
      await userApi.verify(realName, idCard)
      updateUser({ isVerified: true })
      updateOnboarding({ isVerified: true })
      setSuccess(true)
      
      setTimeout(() => {
        navigate('/deposit')
      }, 1500)
    } catch (e) {
      setError(e.response?.data?.error || '认证失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={successStyles.container}>
        <div style={successStyles.icon}>
          <Check size={48} color="#fff" />
        </div>
        <h2 style={successStyles.title}>实名认证成功</h2>
        <p style={successStyles.desc}>正在跳转到下一步...</p>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button onClick={() => navigate(-1)} style={styles.backBtn}>
          <ArrowLeft size={24} color="#333" />
        </button>
        <h1 style={styles.title}>实名认证</h1>
        <div style={{ width: 40 }} />
      </div>

      <div style={styles.content}>
        <div style={styles.hintCard}>
          <Shield size={24} color="#FF6B00" />
          <div style={styles.hintText}>
            <p style={styles.hintTitle}>为什么需要实名认证？</p>
            <p style={styles.hintDesc}>根据相关规定，使用共享单车需完成实名认证，您的信息将被严格保护</p>
          </div>
        </div>

        {error && (
          <div style={styles.error}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>真实姓名</label>
            <input
              type="text"
              placeholder="请输入真实姓名"
              value={realName}
              onChange={e => setRealName(e.target.value)}
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>身份证号</label>
            <input
              type="text"
              placeholder="请输入身份证号"
              value={idCard}
              onChange={e => setIdCard(e.target.value.toUpperCase())}
              maxLength={18}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.agreement}>
          <p style={styles.agreementText}>
            我已阅读并同意
            <span style={styles.link}>《实名认证服务协议》</span>
          </p>
        </div>
      </div>

      <div style={styles.footer}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          style={{
            ...styles.submitBtn,
            ...(!realName || !idCard ? styles.submitBtnDisabled : {})
          }}
        >
          {loading ? '提交中...' : '确认认证'}
        </button>
      </div>
    </div>
  )
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#F7F8FA',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    backgroundColor: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #f0f0f0',
  },
  backBtn: {
    padding: 4,
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  hintCard: {
    backgroundColor: '#FFF7E6',
    borderRadius: 12,
    padding: 16,
    display: 'flex',
    gap: 12,
    marginBottom: 24,
  },
  hintText: {
    flex: 1,
  },
  hintTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  hintDesc: {
    fontSize: 12,
    color: '#666',
    lineHeight: 1.5,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF2F0',
    color: '#FF4D4F',
    padding: 12,
    borderRadius: 8,
    fontSize: 13,
    marginBottom: 16,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: '0 16px',
  },
  inputGroup: {
    padding: '16px 0',
    borderBottom: '1px solid #f0f0f0',
  },
  label: {
    display: 'block',
    fontSize: 13,
    color: '#999',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    border: 'none',
    outline: 'none',
    fontSize: 16,
    color: '#333',
  },
  agreement: {
    marginTop: 20,
  },
  agreementText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
  link: {
    color: '#FF6B00',
  },
  footer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  submitBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#FF6B00',
    color: '#fff',
    border: 'none',
    borderRadius: 12,
    fontSize: 16,
    fontWeight: '600',
    cursor: 'pointer',
  },
  submitBtnDisabled: {
    backgroundColor: '#FFB366',
    cursor: 'not-allowed',
  },
}

const successStyles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#fff',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    width: 80,
    height: 80,
    backgroundColor: '#52C41A',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  desc: {
    fontSize: 14,
    color: '#999',
  },
}

export default VerifyPage

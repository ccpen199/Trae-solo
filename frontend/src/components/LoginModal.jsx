import { useState } from 'react'
import { useAuth } from '../store/auth'
import { useToast } from './Toast'

const LoginModal = ({ isOpen, onClose }) => {
  const [loginType, setLoginType] = useState('code')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const { login, sendCode } = useAuth()
  const { showToast } = useToast()

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      showToast('请输入正确的手机号', 'error')
      return
    }
    const result = await sendCode(phone)
    if (result.success) {
      showToast(`验证码已发送: ${result.code}`, 'success')
      setCode(result.code)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      showToast(result.message, 'error')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    const result = await login(phone, code, loginType)
    setLoading(false)
    if (result.success) {
      showToast('登录成功', 'success')
      onClose?.()
    } else {
      showToast(result.message, 'error')
    }
  }

  const handleThirdPartyLogin = async (platform) => {
    showToast(`正在跳转${platform}登录...`, 'info')
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const mockUser = {
      id: Date.now(),
      nickname: `${platform}用户${Math.floor(Math.random() * 10000)}`,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${platform}${Date.now()}`
    }
    
    localStorage.setItem('user', JSON.stringify(mockUser))
    localStorage.setItem('token', `mock_${platform}_${Date.now()}`)
    window.dispatchEvent(new CustomEvent('auth:login', { detail: mockUser }))
    
    showToast(`${platform}登录成功！`, 'success')
    onClose?.()
  }

  if (!isOpen) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h3 style={styles.title}>登录</h3>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>
        <div style={styles.tabs}>
          <button
            style={{ ...styles.tab, ...(loginType === 'code' ? styles.tabActive : {}) }}
            onClick={() => setLoginType('code')}
          >
            验证码登录
          </button>
          <button
            style={{ ...styles.tab, ...(loginType === 'password' ? styles.tabActive : {}) }}
            onClick={() => setLoginType('password')}
          >
            密码登录
          </button>
        </div>
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.testAccount}>
            <span style={styles.testAccountIcon}>💡</span>
            <span style={styles.testAccountText}>测试账号: 13800138000，密码: 123456</span>
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>手机号</label>
            <input
              style={styles.input}
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="请输入手机号"
              maxLength={11}
            />
          </div>
          <div style={styles.inputGroup}>
            <label style={styles.label}>{loginType === 'code' ? '验证码' : '密码'}</label>
            <div style={styles.codeInputWrapper}>
              <input
                style={{ ...styles.input, ...styles.codeInput }}
                type={loginType === 'code' ? 'text' : 'password'}
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder={loginType === 'code' ? '请输入验证码' : '请输入密码'}
                maxLength={loginType === 'code' ? 6 : 20}
              />
              {loginType === 'code' && (
                <button
                  type="button"
                  style={styles.sendCodeBtn}
                  onClick={handleSendCode}
                  disabled={countdown > 0}
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              )}
            </div>
          </div>
          <button
            type="submit"
            style={styles.submitBtn}
            disabled={loading}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
        <div style={styles.thirdParty}>
          <p style={styles.thirdPartyTitle}>第三方登录 (演示模式)</p>
          <div style={styles.thirdPartyBtns}>
            <button
              style={{ ...styles.thirdBtn, ...styles.weibo }}
              onClick={() => handleThirdPartyLogin('微博')}
            >🔴 微博登录</button>
            <button
              style={{ ...styles.thirdBtn, ...styles.qq }}
              onClick={() => handleThirdPartyLogin('QQ')}
            >🔵 QQ登录</button>
          </div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  testAccount: {
    padding: '10px 12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px'
  },
  testAccountIcon: {
    fontSize: '16px'
  },
  testAccountText: {
    fontSize: '12px',
    color: '#1976d2'
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    width: '100%',
    maxWidth: '400px',
    margin: '20px'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  title: {
    fontSize: '20px',
    fontWeight: '600',
    margin: 0
  },
  closeBtn: {
    border: 'none',
    background: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: '#999',
    padding: '0 8px'
  },
  tabs: {
    display: 'flex',
    gap: '12px',
    marginBottom: '20px'
  },
  tab: {
    flex: 1,
    padding: '10px',
    border: 'none',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  tabActive: {
    backgroundColor: '#007AFF',
    color: 'white'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontSize: '14px',
    color: '#333'
  },
  input: {
    padding: '12px 16px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    fontSize: '14px',
    outline: 'none'
  },
  codeInputWrapper: {
    display: 'flex',
    gap: '12px'
  },
  codeInput: {
    flex: 1
  },
  sendCodeBtn: {
    padding: '0 16px',
    border: 'none',
    backgroundColor: '#007AFF',
    color: 'white',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer',
    whiteSpace: 'nowrap'
  },
  submitBtn: {
    padding: '14px',
    border: 'none',
    backgroundColor: '#007AFF',
    color: 'white',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer',
    marginTop: '8px'
  },
  thirdParty: {
    marginTop: '24px'
  },
  thirdPartyTitle: {
    fontSize: '12px',
    color: '#999',
    textAlign: 'center',
    marginBottom: '16px'
  },
  thirdPartyBtns: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center'
  },
  thirdBtn: {
    padding: '10px 24px',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    cursor: 'pointer'
  },
  weibo: {
    backgroundColor: '#E6162D',
    color: 'white'
  },
  qq: {
    backgroundColor: '#12B7F5',
    color: 'white'
  }
}

export default LoginModal

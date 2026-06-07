import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, Loader2, Home, Store, Wrench, Shield } from 'lucide-react'
import { authAPI } from '../api'

interface DemoAccount {
  username: string
  password: string
  role: string
  desc: string
}

interface LoginError {
  code?: string
  message: string
  remaining_attempts?: number
  lock_until?: number
}

type IdentityType = 'home' | 'channel' | 'engineer' | 'admin' | null

const identityDefs = [
  {
    key: 'home' as const,
    label: '家庭用户',
    icon: Home,
    color: '#1890ff',
    desc: '设备控制、场景联动、能耗监控、积分兑换',
    keywords: '设备管理 | 场景引擎 | 能耗报告 | 积分商城',
    demoUsers: ['user', 'admin'],
  },
  {
    key: 'channel' as const,
    label: '渠道商',
    icon: Store,
    color: '#722ed1',
    desc: '工单管理、商城运营、渠道分销、以旧换新',
    keywords: '服务工单 | 智家商城 | 渠道管理 | 以旧换新',
    demoUsers: ['platform'],
  },
  {
    key: 'engineer' as const,
    label: '售后工程师',
    icon: Wrench,
    color: '#52c41a',
    desc: '固件升级、设备健康、红外桥接、远程诊断',
    keywords: '固件管理 | 设备健康 | 红外网关 | 远程诊断',
    demoUsers: ['ops'],
  },
  {
    key: 'admin' as const,
    label: '系统管理员',
    icon: Shield,
    color: '#fa541c',
    desc: '全局管控、权限分配、数据分析、灰度发布',
    keywords: '全部权限 | 数据分析 | 权限管理 | 灰度发布',
    demoUsers: ['admin'],
  },
]

const roleTagMap: Record<string, string> = {
  user: 'IoT控制',
  admin: '全平台管控',
  platform: '工单商城',
  ops: '固件运维',
}

const roleColorMap: Record<string, string> = {
  user: '#1890ff',
  admin: '#fa541c',
  platform: '#722ed1',
  ops: '#52c41a',
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 50%, #0050b3 100%)',
    padding: 20,
  },
  card: {
    background: '#fff',
    borderRadius: 16,
    padding: '36px 32px',
    width: '100%',
    maxWidth: 520,
    maxHeight: 'calc(100vh - 40px)',
    overflowY: 'auto',
    boxShadow: '0 24px 64px rgba(0, 0, 0, 0.2)',
  },
  logo: {
    textAlign: 'center' as const,
    marginBottom: 8,
  },
  logoIcon: {
    width: 56,
    height: 56,
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 12px',
    color: '#fff',
    fontSize: 24,
    fontWeight: 700,
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    textAlign: 'center' as const,
    marginBottom: 6,
    color: '#1a1a2e',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center' as const,
    color: '#8c8c8c',
    marginBottom: 24,
  },
  identityGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 12,
    marginBottom: 20,
  },
  identityCard: {
    padding: 14,
    borderRadius: 12,
    border: '2px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'all 0.25s',
    background: '#fafafa',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 6,
  },
  identityCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  identityCardLabel: {
    fontSize: 14,
    fontWeight: 600,
  },
  identityCardDesc: {
    fontSize: 11,
    color: '#8c8c8c',
    lineHeight: 1.5,
  },
  permissionScope: {
    fontSize: 12,
    color: '#8c8c8c',
    textAlign: 'center' as const,
    marginBottom: 16,
    padding: '6px 12px',
    background: '#f5f5f5',
    borderRadius: 8,
  },
  formGroup: {
    marginBottom: 18,
  },
  label: {
    display: 'block',
    fontSize: 13,
    fontWeight: 500,
    color: '#595959',
    marginBottom: 8,
  },
  inputWrapper: {
    position: 'relative' as const,
  },
  inputIcon: {
    position: 'absolute' as const,
    left: 14,
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#bfbfbf',
  },
  input: {
    width: '100%',
    padding: '12px 14px 12px 44px',
    border: '1px solid #d9d9d9',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
    background: '#fafafa',
  },
  inputError: {
    width: '100%',
    padding: '12px 14px 12px 44px',
    border: '1px solid #ff4d4f',
    borderRadius: 10,
    fontSize: 14,
    outline: 'none',
    transition: 'all 0.2s',
    boxSizing: 'border-box' as const,
    background: '#fff2f0',
  },
  inputCheck: {
    position: 'absolute' as const,
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
  },
  helperText: {
    fontSize: 12,
    color: '#ff4d4f',
    marginTop: 4,
    paddingLeft: 4,
  },
  eyeBtn: {
    position: 'absolute' as const,
    right: 12,
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#bfbfbf',
    padding: 4,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    padding: '12px 14px',
    borderRadius: 10,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: '#fff2f0',
    border: '1px solid #ffccc7',
  },
  warningBox: {
    padding: '12px 14px',
    borderRadius: 10,
    marginBottom: 16,
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    background: '#fffbe6',
    border: '1px solid #ffe58f',
  },
  errorIcon: {
    flexShrink: 0,
    marginTop: 1,
  },
  errorText: {
    fontSize: 13,
    color: '#cf1322',
    lineHeight: 1.6,
  },
  warningText: {
    fontSize: 13,
    color: '#d48806',
    lineHeight: 1.6,
  },
  errorTitle: {
    fontWeight: 600,
    marginBottom: 2,
  },
  errorDetail: {
    fontSize: 12,
    opacity: 0.9,
  },
  btn: {
    width: '100%',
    padding: '14px 0',
    border: 'none',
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    transition: 'all 0.2s',
  },
  primaryBtn: {
    background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    color: '#fff',
    boxShadow: '0 4px 12px rgba(24, 144, 255, 0.3)',
  },
  demoSectionTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: '#262626',
    marginBottom: 12,
    marginTop: 4,
  },
  demoAccountList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 12,
  },
  demoAccountCard: {
    padding: 16,
    border: '1px solid #e8e8e8',
    borderRadius: 12,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    transition: 'all 0.2s',
    cursor: 'pointer',
    background: '#fafafa',
  },
  demoAccountInfo: {
    flex: 1,
    minWidth: 0,
  },
  demoAccountName: {
    fontSize: 14,
    fontWeight: 600,
    color: '#262626',
    marginBottom: 4,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  demoAccountRole: {
    display: 'inline-block',
    padding: '2px 8px',
    fontSize: 11,
    borderRadius: 4,
    fontWeight: 500,
  },
  demoAccountDesc: {
    fontSize: 12,
    color: '#8c8c8c',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    marginBottom: 4,
  },
  demoAccountTag: {
    display: 'inline-block',
    padding: '2px 8px',
    background: '#f0f0f0',
    color: '#595959',
    fontSize: 11,
    borderRadius: 4,
  },
  demoLoginBtn: {
    padding: '8px 16px',
    border: 'none',
    borderRadius: 8,
    background: '#1890ff',
    color: '#fff',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    transition: 'all 0.2s',
  },
  divider: {
    height: 1,
    background: '#f0f0f0',
    margin: '20px 0',
  },
  registerLink: {
    textAlign: 'center' as const,
    marginTop: 20,
    fontSize: 13,
    color: '#8c8c8c',
  },
  link: {
    color: '#1890ff',
    cursor: 'pointer',
    fontWeight: 500,
    textDecoration: 'none',
  },
  staticLink: {
    color: '#8c8c8c',
    fontSize: 12,
  },
}

export default function Login() {
  const navigate = useNavigate()
  const [selectedIdentity, setSelectedIdentity] = useState<IdentityType>(null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [demoLoading, setDemoLoading] = useState<string | null>(null)
  const [error, setError] = useState<LoginError | null>(null)
  const [warning, setWarning] = useState<string | null>(null)
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([])
  const [lockCountdown, setLockCountdown] = useState<number | null>(null)
  const [usernameBlurred, setUsernameBlurred] = useState(false)
  const [passwordBlurred, setPasswordBlurred] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/dashboard', { replace: true })
    }
  }, [navigate])

  useEffect(() => {
    fetchDemoAccounts()
  }, [])

  useEffect(() => {
    if (lockCountdown && lockCountdown > 0) {
      const timer = setInterval(() => {
        setLockCountdown((prev) => {
          if (!prev || prev <= 1) {
            clearInterval(timer)
            return null
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [lockCountdown])

  const fetchDemoAccounts = async () => {
    try {
      const res = await authAPI.getLoginInfo()
      if (res.data?.success && res.data?.data?.demo_accounts) {
        setDemoAccounts(res.data.data.demo_accounts)
      }
    } catch (err) {
      console.error('Failed to fetch demo accounts:', err)
    }
  }

  const formatLockTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    if (mins > 0) {
      return `${mins}分${secs}秒`
    }
    return `${secs}秒`
  }

  const handleError = (err: any) => {
    const errorData = err.response?.data
    const errorObj: LoginError = {
      code: errorData?.error?.code || errorData?.code,
      message: errorData?.error?.message || errorData?.message || '登录失败',
      remaining_attempts: errorData?.error?.remaining_attempts ?? errorData?.remaining_attempts,
      lock_until: errorData?.error?.lock_until ?? errorData?.lock_until,
    }

    setError(errorObj)
    setWarning(null)

    if (errorObj.code === 'INVALID_PASSWORD' && errorObj.remaining_attempts !== undefined && errorObj.remaining_attempts > 0) {
      setWarning(`密码错误，还剩${errorObj.remaining_attempts}次尝试机会，5次失败后账号将被锁定1小时`)
    }

    if (errorObj.lock_until) {
      const now = Math.floor(Date.now() / 1000)
      const remaining = Math.max(0, errorObj.lock_until - now)
      if (remaining > 0) {
        setLockCountdown(remaining)
      }
    }

    if (errorObj.code === 'USER_NOT_FOUND') {
      setWarning('账号不存在，请检查用户名是否正确')
    }

    if (errorObj.code === 'TOO_MANY_ATTEMPTS') {
      setWarning('您的账号已被安全锁定，请等待倒计时结束后重试')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setWarning(null)

    if (!username.trim() && !password) {
      setError({ code: 'EMPTY_CREDENTIALS', message: '请输入用户名和密码' })
      return
    }

    if (!username.trim()) {
      setError({ code: 'EMPTY_CREDENTIALS', message: '请输入用户名' })
      return
    }

    if (!password) {
      setError({ code: 'EMPTY_CREDENTIALS', message: '请输入密码' })
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.login({ username, password })
      const data = res.data?.data || res.data
      const token = data?.token
      const user = data?.user

      if (token) {
        localStorage.setItem('token', token)
        if (user) {
          localStorage.setItem('user', JSON.stringify(user))
        }
        const redirectPath = data?.redirect_path || '/dashboard'
        navigate(redirectPath, { replace: true })
      } else {
        setError({ code: 'INVALID_RESPONSE', message: '登录返回数据异常' })
      }
    } catch (err: any) {
      handleError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (account: DemoAccount) => {
    setError(null)
    setWarning(null)
    setDemoLoading(account.username)

    try {
      const res = await authAPI.login({ username: account.username, password: account.password })
      const data = res.data?.data || res.data
      const token = data?.token
      const user = data?.user

      if (token) {
        localStorage.setItem('token', token)
        if (user) {
          localStorage.setItem('user', JSON.stringify(user))
        }
        const redirectPath = data?.redirect_path || '/dashboard'
        navigate(redirectPath, { replace: true })
      } else {
        setError({ code: 'INVALID_RESPONSE', message: '登录返回数据异常' })
      }
    } catch (err: any) {
      handleError(err)
    } finally {
      setDemoLoading(null)
    }
  }

  const handleIdentityClick = (key: IdentityType) => {
    setSelectedIdentity(key === selectedIdentity ? null : key)
  }

  const filteredDemoAccounts = selectedIdentity
    ? demoAccounts.filter((a) => {
        const def = identityDefs.find((d) => d.key === selectedIdentity)
        return def ? def.demoUsers.includes(a.username) : true
      })
    : demoAccounts

  const selectedDef = identityDefs.find((d) => d.key === selectedIdentity)

  const getErrorDisplay = () => {
    if (!error) return null

    const code = error.code
    const isLocked = code === 'ACCOUNT_LOCKED' || lockCountdown !== null
    const isDisabled = code === 'ACCOUNT_DISABLED'
    const isInvalidPassword = code === 'INVALID_PASSWORD'
    const isUserNotFound = code === 'USER_NOT_FOUND'
    const isTooManyAttempts = code === 'TOO_MANY_ATTEMPTS'
    const isEmptyCredentials = code === 'EMPTY_CREDENTIALS'

    let title = ''
    let detail = ''
    let isWarning = false

    if (isLocked) {
      title = '账号已锁定'
      detail = lockCountdown !== null
        ? `请 ${formatLockTime(lockCountdown)} 后再试`
        : '账号已被暂时锁定，请稍后再试'
    } else if (isTooManyAttempts) {
      title = '尝试次数过多'
      detail = '您的账号已被安全锁定，请等待倒计时结束后重试'
      isWarning = true
    } else if (isDisabled) {
      title = '账号已禁用'
      detail = '该账号已被管理员禁用，请联系客服'
    } else if (isInvalidPassword) {
      title = '密码错误'
      if (error.remaining_attempts !== undefined && error.remaining_attempts > 0) {
        detail = `密码错误，还剩${error.remaining_attempts}次尝试机会，5次失败后账号将被锁定1小时`
      } else {
        detail = '请检查密码是否正确，注意区分大小写'
      }
    } else if (isUserNotFound) {
      title = '账号不存在'
      detail = '未找到该用户名，请检查输入是否正确'
    } else if (isEmptyCredentials) {
      title = '输入不完整'
      detail = error.message
    } else {
      title = '登录失败'
      detail = error.message
    }

    return { title, detail, isWarning, isUserNotFound, isLocked, isTooManyAttempts }
  }

  const renderErrorBox = () => {
    const errorDisplay = getErrorDisplay()
    if (!errorDisplay && !warning && !lockCountdown) return null

    return (
      <>
        {errorDisplay && (
          <div style={errorDisplay.isWarning ? styles.warningBox : styles.errorBox}>
            <AlertCircle
              size={18}
              color={errorDisplay.isWarning ? '#d48806' : '#cf1322'}
              style={styles.errorIcon}
            />
            <div style={errorDisplay.isWarning ? styles.warningText : styles.errorText}>
              <div style={styles.errorTitle}>{errorDisplay.title}</div>
              <div style={styles.errorDetail}>
                {errorDisplay.detail}
                {errorDisplay.isLocked && lockCountdown !== null && (
                  <span style={{ fontWeight: 600, marginLeft: 4 }}>
                    {formatLockTime(lockCountdown)}
                  </span>
                )}
              </div>
              {errorDisplay.isUserNotFound && (
                <div
                  style={{ ...styles.link, fontSize: 12, marginTop: 4, cursor: 'pointer' }}
                  onClick={() => {
                    const el = document.getElementById('demo-section')
                    el?.scrollIntoView({ behavior: 'smooth' })
                  }}
                >
                  建议：可选择下方演示账号快速体验
                </div>
              )}
            </div>
          </div>
        )}
        {warning && !errorDisplay && (
          <div style={styles.warningBox}>
            <AlertCircle size={18} color="#d48806" style={styles.errorIcon} />
            <div style={styles.warningText}>{warning}</div>
          </div>
        )}
      </>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>海</div>
          <h1 style={styles.title}>海尔智家IoT控制平台</h1>
          <p style={styles.subtitle}>欢迎回来，请登录您的账号</p>
        </div>

        <div style={styles.identityGrid}>
          {identityDefs.map((def) => {
            const Icon = def.icon
            const isSelected = selectedIdentity === def.key
            return (
              <div
                key={def.key}
                style={{
                  ...styles.identityCard,
                  borderColor: isSelected ? def.color : '#f0f0f0',
                  background: isSelected ? `${def.color}08` : '#fafafa',
                  boxShadow: isSelected
                    ? `0 0 0 1px ${def.color}, 0 4px 12px ${def.color}30`
                    : 'none',
                }}
                onClick={() => handleIdentityClick(def.key)}
              >
                <div style={styles.identityCardHeader}>
                  <Icon size={20} color={def.color} />
                  <span style={{ ...styles.identityCardLabel, color: def.color }}>
                    {def.label}
                  </span>
                </div>
                <div style={styles.identityCardDesc}>{def.desc}</div>
              </div>
            )
          })}
        </div>

        {selectedDef && (
          <div style={styles.permissionScope}>
            权限范围：{selectedDef.keywords}
          </div>
        )}

        {renderErrorBox()}

        <form onSubmit={handleLogin}>
          <div style={styles.formGroup}>
            <label style={styles.label}>用户名</label>
            <div style={styles.inputWrapper}>
              <User size={18} style={styles.inputIcon} />
              <input
                style={error ? styles.inputError : styles.input}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onBlur={() => setUsernameBlurred(true)}
                placeholder="请输入用户名"
                autoComplete="username"
                disabled={lockCountdown !== null}
              />
              {username.trim() && !error && (
                <span style={styles.inputCheck}>
                  <CheckCircle size={16} color="#52c41a" />
                </span>
              )}
            </div>
            {usernameBlurred && !username.trim() && !error && (
              <div style={styles.helperText}>请输入用户名</div>
            )}
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>密码</label>
            <div style={styles.inputWrapper}>
              <Lock size={18} style={styles.inputIcon} />
              <input
                style={error ? styles.inputError : styles.input}
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordBlurred(true)}
                placeholder="请输入密码"
                autoComplete="current-password"
                disabled={lockCountdown !== null}
              />
              {password && !error && !showPassword && (
                <span style={{ ...styles.inputCheck, right: 40 }}>
                  <CheckCircle size={16} color="#52c41a" />
                </span>
              )}
              <button
                type="button"
                style={styles.eyeBtn}
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordBlurred && !password && !error && (
              <div style={styles.helperText}>请输入密码</div>
            )}
          </div>

          <div style={{ position: 'relative' as const }}>
            <button
              type="submit"
              style={{
                ...styles.btn,
                ...styles.primaryBtn,
                opacity: loading || lockCountdown !== null ? 0.7 : 1,
                cursor: loading || lockCountdown !== null ? 'not-allowed' : 'pointer',
              }}
              disabled={loading || lockCountdown !== null}
            >
              {loading ? (
                <>
                  <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  登录中...
                </>
              ) : lockCountdown !== null ? (
                `账号已锁定 (${formatLockTime(lockCountdown)})`
              ) : (
                <>
                  <CheckCircle size={18} />
                  登录
                </>
              )}
            </button>
          </div>
        </form>

        <div style={styles.divider} />

        <div id="demo-section">
          <div style={styles.demoSectionTitle}>
            {selectedIdentity ? `${selectedDef?.label}演示账号` : '演示账号'}
          </div>
          {demoAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#8c8c8c' }}>
              <Loader2
                size={24}
                style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }}
              />
              <div>加载演示账号中...</div>
            </div>
          ) : filteredDemoAccounts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#8c8c8c' }}>
              暂无匹配的演示账号
            </div>
          ) : (
            <div style={styles.demoAccountList}>
              {filteredDemoAccounts.map((account) => {
                const roleColor = roleColorMap[account.username] || '#1890ff'
                const tag = roleTagMap[account.username] || account.role
                return (
                  <div
                    key={account.username}
                    style={{
                      ...styles.demoAccountCard,
                      opacity: demoLoading ? 0.6 : 1,
                    }}
                    onClick={() => !demoLoading && handleDemoLogin(account)}
                  >
                    <div style={styles.demoAccountInfo}>
                      <div style={styles.demoAccountName}>
                        {account.username}
                        <span
                          style={{
                            ...styles.demoAccountRole,
                            background: `${roleColor}15`,
                            color: roleColor,
                          }}
                        >
                          {account.role}
                        </span>
                      </div>
                      <div style={styles.demoAccountDesc}>{account.desc}</div>
                      <span style={styles.demoAccountTag}>适用场景：{tag}</span>
                    </div>
                    <button
                      style={styles.demoLoginBtn}
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDemoLogin(account)
                      }}
                      disabled={demoLoading !== null}
                    >
                      {demoLoading === account.username ? (
                        <>
                          <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                          登录中
                        </>
                      ) : (
                        <>
                          <CheckCircle size={14} />
                          登录
                        </>
                      )}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div style={styles.registerLink}>
          还没有账号？
          <span style={styles.link} onClick={() => navigate('/register')}>
            立即注册
          </span>
          <span style={{ margin: '0 8px' }}>|</span>
          <span style={styles.staticLink}>忘记密码？联系管理员</span>
        </div>
      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { login as loginApi, bindDeviceFingerprint, updateLocation } from '../api/client'

const roleCards = [
  {
    role: 'user',
    icon: '📰',
    title: '区域资讯用户',
    desc: '发现1km内突发新闻，获取个性化推荐，观看视频内容',
    color: 'from-orange-400 to-primary',
  },
  {
    role: 'creator',
    icon: '✨',
    title: '里里号创作者',
    desc: '发布资讯与视频，积累粉丝，参与商业合作',
    color: 'from-blue-400 to-secondary',
  },
  {
    role: 'admin',
    icon: '⚙️',
    title: '运营管理员',
    desc: '地域热度监控，内容安全审核，反欺诈管理',
    color: 'from-gray-400 to-gray-600',
  },
]

const demoAccounts = [
  { username: 'admin', password: 'admin123', label: '管理员' },
  { username: 'zhangsan', password: '123456', label: '资讯用户' },
  { username: 'lisi', password: '123456', label: '创作者' },
]

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [error, setError] = useState('')
  const [errorType, setErrorType] = useState<'account' | 'role' | 'device' | 'antifraud' | 'network'>('account')
  const [loading, setLoading] = useState(false)
  const [locationStatus, setLocationStatus] = useState<'granted' | 'denied' | 'pending'>('pending')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [deviceFingerprint, setDeviceFingerprint] = useState('')
  const [loginSuccess, setLoginSuccess] = useState(false)
  const [loginMessage, setLoginMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const fp = `${navigator.userAgent.slice(0, 20)}-${screen.width}x${screen.height}-${new Date().getTimezoneOffset()}`
    setDeviceFingerprint(fp)
    localStorage.setItem('device_fingerprint', fp)

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocationStatus('granted')
        },
        () => setLocationStatus('denied'),
        { timeout: 10000 },
      )
    } else {
      setLocationStatus('denied')
    }
  }, [])

  const requestLocation = () => {
    if (navigator.geolocation) {
      setLocationStatus('pending')
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
          setLocationStatus('granted')
        },
        () => setLocationStatus('denied'),
        { timeout: 10000 },
      )
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await loginApi({ username, password, device_fingerprint: deviceFingerprint })
      const { token, user } = res.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      setLoginSuccess(true)
      const roleLabel = user.role === 'admin' ? '管理员' : user.role === 'creator' ? '创作者' : '资讯用户'
      setLoginMessage(`登录成功！角色：${roleLabel}，正在跳转...`)

      try {
        if (location) {
          await updateLocation({ latitude: location.lat, longitude: location.lng, accuracy: 10 })
        }
        await bindDeviceFingerprint({ device_fingerprint: deviceFingerprint })
      } catch {}

      const redirectPath = user.role === 'admin' ? '/admin' : user.role === 'creator' ? '/creators' : '/'
      setTimeout(() => navigate(redirectPath), 800)
    } catch (err: any) {
      const status = err.response?.status
      const message = err.response?.data?.message || ''

      if (status === 401) {
        setError('账号或密码错误，请检查后重试')
        setErrorType('account')
      } else if (status === 403) {
        setError('该账号无此角色权限，请联系管理员')
        setErrorType('role')
      } else if (status === 409) {
        setError('账号已在其他设备登录，设备指纹冲突')
        setErrorType('device')
      } else if (status === 429) {
        setError('操作过于频繁，请稍后再试（防刷拦截）')
        setErrorType('antifraud')
      } else if (!status) {
        setError('网络连接失败，请检查网络设置')
        setErrorType('network')
      } else {
        setError('登录失败，请稍后重试')
        setErrorType('account')
      }
    } finally {
      setLoading(false)
    }
  }

  const fillDemoAccount = async (acc: typeof demoAccounts[0]) => {
    setUsername(acc.username)
    setPassword(acc.password)
    setError('')
    setLoginSuccess(false)
    setLoading(true)

    try {
      const res = await loginApi({ username: acc.username, password: acc.password, device_fingerprint: deviceFingerprint })
      const { token, user } = res.data

      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))

      setLoginSuccess(true)
      const roleLabel = user.role === 'admin' ? '管理员' : user.role === 'creator' ? '创作者' : '资讯用户'
      setLoginMessage(`登录成功！角色：${roleLabel}，正在跳转...`)

      try {
        if (location) {
          await updateLocation({ latitude: location.lat, longitude: location.lng, accuracy: 10 })
        }
        await bindDeviceFingerprint({ device_fingerprint: deviceFingerprint })
      } catch {}

      const redirectPath = user.role === 'admin' ? '/admin' : user.role === 'creator' ? '/creators' : '/'
      setTimeout(() => navigate(redirectPath), 800)
    } catch (err: any) {
      const status = err.response?.status
      if (status === 401) {
        setError('账号或密码错误，请检查后重试')
        setErrorType('account')
      } else if (status === 429) {
        setError('操作过于频繁，请稍后再试（防刷拦截）')
        setErrorType('antifraud')
      } else {
        setError('登录失败，请稍后重试')
        setErrorType('network')
      }
    } finally {
      setLoading(false)
    }
  }

  const errorIcon = {
    account: '🔐',
    role: '🚫',
    device: '📱',
    antifraud: '🛡️',
    network: '📶',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-6">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">里里</h1>
          <p className="text-gray-500 mt-2 text-lg">区域资讯社交平台</p>
          <p className="text-sm text-gray-400 mt-1">发现身边精彩 · 连接本地生活</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {roleCards.map((card) => (
            <div
              key={card.role}
              className={`rounded-xl p-4 bg-gradient-to-br ${card.color} text-white text-center shadow-lg hover:scale-105 transition-transform`}
            >
              <div className="text-3xl mb-2">{card.icon}</div>
              <div className="font-semibold text-sm">{card.title}</div>
              <div className="text-xs opacity-80 mt-1 leading-tight">{card.desc}</div>
            </div>
          ))}
        </div>

        <div className="card p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-5">登录账号</h2>

          {loginSuccess && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700">
              <div className="flex items-center gap-2">
                <span className="text-lg">✅</span>
                <span className="font-medium">{loginMessage}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <div className="flex items-center gap-2">
                <span className="text-lg">{errorIcon[errorType]}</span>
                <span className="font-medium">{error}</span>
              </div>
              {errorType === 'antifraud' && (
                <p className="text-xs text-red-500 mt-1">系统检测到异常操作，已触发风控策略</p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                  placeholder="请输入用户名"
                  required
                  minLength={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all"
                    placeholder="请输入密码"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-primary rounded focus:ring-primary"
                />
                <span className="text-sm text-gray-600">记住我</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                {locationStatus === 'granted' ? (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    📍 地理位置已授权
                  </span>
                ) : locationStatus === 'pending' ? (
                  <span className="flex items-center gap-1.5 text-sm text-yellow-600">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                    📍 定位中...
                  </span>
                ) : (
                  <button type="button" onClick={requestLocation} className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium">
                    <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                    📍 点击授权地理位置
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                {deviceFingerprint ? (
                  <span className="flex items-center gap-1.5 text-sm text-green-600 font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    🔒 设备指纹已绑定
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm text-gray-400">
                    <span className="w-2 h-2 rounded-full bg-gray-300"></span>
                    � 设备指纹未绑定
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 text-base font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  登录中...
                </span>
              ) : (
                '登 录'
              )}
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500 mb-3">快速体验：</p>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.username}
                  onClick={() => fillDemoAccount(acc)}
                  className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition-colors"
                >
                  {acc.label}：{acc.username} / {acc.password}
                </button>
              ))}
            </div>
          </div>

          <p className="mt-5 text-center text-sm text-gray-500">
            还没有账号？
            <Link to="/register" className="text-primary hover:text-orange-600 font-medium ml-1">
              立即注册
            </Link>
          </p>

          <p className="mt-3 text-center text-xs text-gray-400">
            🛡️ 登录行为受设备指纹与IP频控保护，异常操作将触发风控校验
          </p>
        </div>
      </div>
    </div>
  )
}

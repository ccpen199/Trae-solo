import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Truck, Phone, Shield, AlertCircle, Info } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

type Role = 'driver' | 'shipper'

const LOGIN_ALIASES = ['admin', 'platform', 'ops', 'driver', 'shipper']

const demoAccounts = [
  { label: '司机 · 张立国', phone: '13800138001', role: 'driver' as Role, hint: '认证通过' },
  { label: '司机 · 李建军', phone: '13800138002', role: 'driver' as Role, hint: '有真实结算' },
  { label: '货主 · 王经理', phone: '13900139001', role: 'shipper' as Role, hint: '宏远物流' },
  { label: '货主 · 赵总', phone: '13900139002', role: 'shipper' as Role, hint: '顺达运输' },
]

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore(s => s.login)
  const isAuthenticated = useAuthStore(s => s.isAuthenticated)
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [role, setRole] = useState<Role>('driver')
  const [countdown, setCountdown] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (isAuthenticated) return
    const fromPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/'
    const timer = window.setTimeout(() => {
      login('admin', '123456', 'admin')
        .then(() => navigate(fromPath, { replace: true }))
        .catch((err: any) => setError(err?.message || '演示自动登录失败，请使用下方账号手动登录'))
    }, 150)
    return () => window.clearTimeout(timer)
  }, [isAuthenticated, location.state, login, navigate])

  const sendCode = () => {
    if (!phone) {
      setError('请输入手机号')
      return
    }
    const isAlias = LOGIN_ALIASES.includes(phone.trim().toLowerCase())
    if (!isAlias && !/^1\d{10}$/.test(phone)) {
      setError('请输入正确的11位手机号，或使用 admin / platform / ops 快捷登录')
      return
    }
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!phone) {
      setError('请输入手机号')
      return
    }
    if (!code) {
      setError('请输入验证码')
      return
    }
    const isAlias = LOGIN_ALIASES.includes(phone.trim().toLowerCase())
    if (!isAlias && !/^1\d{10}$/.test(phone)) {
      setError('手机号格式不正确，演示账号可输入 admin / platform / ops')
      return
    }
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    setLoading(true)
    try {
      await login(phone, code, role)
      setTimeout(() => navigate('/', { replace: true }), 50)
    } catch (err: any) {
      const msg = err?.message || '登录失败，请重试'
      setError(msg)
      if (typeof window !== 'undefined') {
        // eslint-disable-next-line no-console
        console.warn('[login] failed:', msg)
      }
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (acc: typeof demoAccounts[0]) => {
    setPhone(acc.phone)
    setCode('123456')
    setRole(acc.role)
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-500 via-navy-600 to-navy-700 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex flex-col items-center mb-6">
            <div className="h-16 w-16 rounded-2xl bg-amber-500 flex items-center justify-center mb-4">
              <Truck className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-navy-500">运税通</h1>
            <p className="text-sm text-gray-500 mt-1">货运司机财税合规一站式服务平台</p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError('') }}
                  placeholder="11位手机号 或 admin/platform/ops"
                  maxLength={16}
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">验证码</label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="password"
                    value={code}
                    onChange={(e) => { setCode(e.target.value); setError('') }}
                    placeholder="短信验证码"
                    maxLength={20}
                    autoComplete="one-time-code"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-colors"
                  />
                </div>
                <button
                  type="button"
                  onClick={sendCode}
                  disabled={countdown > 0 || loading}
                  className="whitespace-nowrap px-4 py-2.5 text-sm font-medium rounded-lg border border-amber-500 text-amber-500 hover:bg-amber-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {countdown > 0 ? `${countdown}s` : '获取验证码'}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">演示环境统一验证码：123456</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">身份角色</label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setRole('driver'); setError('') }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    role === 'driver'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-amber-300'
                  }`}
                >
                  🚛 司机
                </button>
                <button
                  type="button"
                  onClick={() => { setRole('shipper'); setError('') }}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    role === 'shipper'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-300 hover:border-amber-300'
                  }`}
                >
                  📦 货主
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-amber-500 text-white font-semibold rounded-lg hover:bg-amber-600 active:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base shadow-sm"
            >
              {loading ? '正在登录...' : '登 录 进 入 工 作 台'}
            </button>
          </form>

          <div className="mt-6 p-3.5 bg-amber-50 border border-amber-100 rounded-lg">
            <div className="flex items-center gap-1.5 text-xs text-amber-700 mb-2.5">
              <Info className="h-3.5 w-3.5" />
              <span className="font-medium">快速体验（点击下方账号自动填充）</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.phone}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="text-left px-2.5 py-2 text-xs rounded-md border border-amber-200 bg-white hover:border-amber-400 hover:bg-amber-50 active:bg-amber-100 transition-colors"
                >
                  <div className="font-medium text-gray-800">{acc.label}</div>
                  <div className="text-gray-500 text-[11px] mt-0.5">{acc.phone} · {acc.hint}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

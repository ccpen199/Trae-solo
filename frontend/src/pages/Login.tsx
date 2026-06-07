import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/stores/auth'
import { Truck, User, Lock, Eye, EyeOff, AlertCircle, CheckCircle, ArrowRight, Info } from 'lucide-react'

const DEMO_ACCOUNTS = [
  { username: 'admin', password: 'admin123', role: '管理员', desc: '系统管理、合规校验、全模块访问' },
  { username: 'zhangwei', password: 'shipper123', role: '货主', desc: '发布货源、合同签章、数据看板' },
  { username: 'wangqiang', password: 'driver123', role: '司机', desc: '发布车源、运输打卡、信用评价' },
  { username: 'shunda', password: 'carrier123', role: '承运商', desc: '专线运营、合同承签、供需趋势' },
]

const ROLE_PERMISSIONS: Record<string, string[]> = {
  admin: ['工作台', '货源管理', '车源管理', '专线资源', '智能匹配', '运输跟踪', '合同管理', '信用评价', '数据看板', '系统管理'],
  shipper: ['工作台', '货源管理', '车源查看', '专线资源', '智能匹配', '运输跟踪', '合同管理', '信用评价', '数据看板'],
  driver: ['工作台', '货源查看', '车源管理', '专线资源', '智能匹配', '运输跟踪', '合同查看', '信用评价'],
  carrier: ['工作台', '货源查看', '车源查看', '专线资源', '智能匹配', '运输跟踪', '合同管理', '信用评价', '数据看板'],
}

const ROLE_NAMES: Record<string, string> = {
  admin: '管理员',
  shipper: '货主',
  driver: '司机',
  carrier: '承运商',
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [localError, setLocalError] = useState('')
  const [showDemo, setShowDemo] = useState(false)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, loading, error: storeError, clearError } = useAuthStore()

  const from = (location.state as any)?.from?.pathname || '/'

  useEffect(() => {
    clearError()
  }, [clearError])

  const displayError = localError || storeError || ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError('')
    setLoginSuccess(false)

    if (!username.trim()) {
      setLocalError('请输入用户名')
      return
    }
    if (!password) {
      setLocalError('请输入密码')
      return
    }

    try {
      await login(username, password)
      setLoginSuccess(true)
      setTimeout(() => navigate(from, { replace: true }), 300)
    } catch (err: any) {
      const msg = err?.message || '登录失败，请检查用户名和密码'
      if (msg.includes('401') || msg.includes('密码错误') || msg.includes('用户名或密码')) {
        setLocalError('用户名或密码错误，请检查后重试')
      } else if (msg.includes('403') || msg.includes('禁用')) {
        setLocalError('该账号已被禁用，请联系管理员')
      } else if (msg.includes('404') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setLocalError('无法连接服务器，请检查网络或稍后重试')
      } else {
        setLocalError(msg)
      }
    }
  }

  const handleDemoClick = (account: typeof DEMO_ACCOUNTS[0]) => {
    setUsername(account.username)
    setPassword(account.password)
    setLocalError('')
  }

  const handleQuickLogin = async (account: typeof DEMO_ACCOUNTS[0]) => {
    setLocalError('')
    setLoginSuccess(false)
    try {
      await login(account.username, account.password)
      setLoginSuccess(true)
      setTimeout(() => navigate(from, { replace: true }), 300)
    } catch (err: any) {
      const msg = err?.message || '登录失败，请检查用户名和密码'
      if (msg.includes('401') || msg.includes('密码错误') || msg.includes('用户名或密码')) {
        setLocalError(`账号 ${account.username} 登录失败：用户名或密码错误`)
      } else if (msg.includes('403') || msg.includes('禁用')) {
        setLocalError(`账号 ${account.username} 已被禁用，请联系管理员`)
      } else if (msg.includes('404') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
        setLocalError('无法连接服务器，请检查网络或稍后重试')
      } else {
        setLocalError(`账号 ${account.username} 登录失败：${msg}`)
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1B2A4A] via-[#2D4A7A] to-[#1B2A4A] px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-[#1B2A4A] to-[#2D4A7A] p-8 text-center">
            <div className="inline-flex w-16 h-16 rounded-xl bg-[#E8722A] items-center justify-center mb-4 shadow-lg">
              <Truck className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">公路物流信息协同中枢</h1>
            <p className="text-white/70 mt-2">登录进入智慧物流平台</p>
          </div>

          <div className="p-8">
            {displayError && (
              <div className="mb-6 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-500" />
                <div className="flex-1">
                  <p className="font-medium">登录失败</p>
                  <p className="mt-0.5 opacity-90">{displayError}</p>
                </div>
              </div>
            )}

            {loginSuccess && (
              <div className="mb-6 px-4 py-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm flex items-center gap-3">
                <CheckCircle className="w-5 h-5 shrink-0 text-green-500" />
                <div>
                  <p className="font-medium">登录成功</p>
                  <p className="mt-0.5 opacity-90">正在跳转至工作台...</p>
                </div>
              </div>
            )}

            <form id="login-form" onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">用户名</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => { setUsername(e.target.value); setLocalError(''); }}
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#E8722A] focus:ring-2 focus:ring-[#E8722A]/20 focus:bg-white transition-all"
                    placeholder="请输入用户名，如：admin、zhangwei"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 text-sm font-medium mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setLocalError(''); }}
                    className="w-full pl-11 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#E8722A] focus:ring-2 focus:ring-[#E8722A]/20 focus:bg-white transition-all"
                    placeholder="请输入密码"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || loginSuccess}
                className="w-full py-3.5 bg-[#E8722A] hover:bg-[#d0651f] disabled:bg-[#E8722A]/50 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                    <span>登录中...</span>
                  </>
                ) : loginSuccess ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>登录成功</span>
                  </>
                ) : (
                  <>
                    <span>登 录</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowDemo(!showDemo)}
                className="w-full flex items-center justify-center gap-2 text-gray-600 text-sm hover:text-[#E8722A] transition-colors"
              >
                <Info className="w-4 h-4" />
                <span>{showDemo ? '收起演示账号' : '查看演示账号（一键快速登录）'}</span>
              </button>

              {showDemo && (
                <div className="mt-4 space-y-3">
                  {DEMO_ACCOUNTS.map((account) => (
                    <button
                      key={account.username}
                      type="button"
                      onClick={() => handleQuickLogin(account)}
                      onDoubleClick={() => handleDemoClick(account)}
                      className="w-full flex items-center gap-4 px-4 py-3 rounded-xl bg-gray-50 hover:bg-[#E8722A]/10 border border-gray-100 hover:border-[#E8722A]/30 transition-all group"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#E8722A]/20 text-[#E8722A] font-bold">
                        {account.role.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-base font-semibold text-gray-800 group-hover:text-[#E8722A] transition-colors">{account.username}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E8722A]/15 text-[#E8722A] font-medium">{account.role}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 truncate">{account.desc}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs text-gray-400">点击立即登录</span>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-[#E8722A] ml-auto mt-0.5 transition-colors" />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-3">
                <span className="text-gray-500 text-sm">还没有账户？</span>
                <Link to="/register" className="text-[#E8722A] hover:text-[#d0651f] text-sm font-semibold transition-colors">
                  立即注册
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center text-white/50 text-xs">
          <p>© 2026 公路物流信息协同中枢 · 智能物流解决方案</p>
        </div>
      </div>
    </div>
  )
}

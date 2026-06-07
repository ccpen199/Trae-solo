import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { auth } from '../api'
import { useAuthStore } from '../store/auth'

function classifyLoginError(err: any): string {
  const msg = err?.message || ''
  if (msg.includes('用户不存在') || msg.includes('not found')) return '账号不存在，请检查后重试'
  if (msg.includes('密码错误') || msg.includes('password')) return '密码错误，请重新输入'
  if (msg.includes('已被禁用') || msg.includes('disabled')) return '账号已被禁用，请联系管理员'
  if (msg.includes('网络') || msg.includes('timeout') || msg.includes('Network Error')) return '网络连接失败，请检查网络后重试'
  if (msg.includes('权限') || msg.includes('permission')) return '权限不足，无法访问'
  return msg || '登录失败，请检查账号和密码'
}

export default function LoginPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { setAuth, token, rider } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    if (token && rider) {
      navigate(rider.role === 'admin' ? '/admin/dashboard' : '/rider/dashboard', { replace: true })
    }
  }, [token, rider, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const trimmedPhone = phone.trim()
    const trimmedPassword = password.trim()

    if (!trimmedPhone) {
      setError('请输入账号')
      return
    }
    if (!trimmedPassword) {
      setError('请输入密码')
      return
    }

    setLoading(true)
    try {
      const res = await auth.login({ phone: trimmedPhone, password: trimmedPassword })
      if (!res?.token || !res?.rider) {
        throw new Error('登录响应数据异常')
      }

      setAuth(res.token, res.rider)
      const targetPath = res.rider.role === 'admin' ? '/admin/dashboard' : '/rider/dashboard'
      navigate(targetPath, { replace: true })
    } catch (err: any) {
      setError(classifyLoginError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-secondary via-secondary to-primary/80 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-40 h-40 border-2 border-white rounded-lg rotate-12" />
          <div className="absolute bottom-40 right-20 w-60 h-60 border-2 border-white rounded-full" />
          <div className="absolute top-1/2 left-1/3 w-32 h-32 border-2 border-white rounded rotate-45" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <div className="mb-8">
            <div className="w-24 h-24 bg-primary rounded-2xl flex items-center justify-center shadow-2xl">
              <Zap size={48} className="text-white" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold mb-4">闪送员众包配送平台</h1>
          <p className="text-lg text-white/80 text-center max-w-md">
            高效匹配骑手与订单，智能调度，实时追踪，打造城市即时配送网络
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-display font-bold text-primary">10K+</p>
              <p className="text-sm text-white/60 mt-1">活跃骑手</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-primary">50K+</p>
              <p className="text-sm text-white/60 mt-1">日均订单</p>
            </div>
            <div>
              <p className="text-3xl font-display font-bold text-primary">99%</p>
              <p className="text-sm text-white/60 mt-1">准时率</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Zap size={28} className="text-primary" />
            <span className="font-display text-xl font-bold text-secondary">闪送平台</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-secondary mb-2">欢迎回来</h2>
          <p className="text-gray-500 mb-8">登录您的账户</p>

          {error && (
            <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 text-danger rounded-lg text-sm">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">账号</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError('') }}
                  placeholder="请输入账号（骑手手机号 / admin）"
                  autoComplete="username"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError('') }}
                  placeholder="请输入密码"
                  autoComplete="current-password"
                  className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-500">
            <p className="font-medium text-gray-600 mb-1">测试账号：</p>
            <p>管理员：账号 <span className="font-mono text-primary">admin</span>，密码 <span className="font-mono text-primary">admin123</span></p>
            <p>骑手：账号 <span className="font-mono text-primary">13800001001</span> ~ <span className="font-mono text-primary">13800001005</span>，密码 <span className="font-mono text-primary">123456</span></p>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            还没有账户？{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

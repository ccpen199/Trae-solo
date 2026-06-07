import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Phone, Lock, Eye, EyeOff, User, AlertCircle } from 'lucide-react'
import { auth } from '../api'
import { useAuthStore } from '../store/auth'

export default function RegisterPage() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
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
    const trimmedName = name.trim()

    if (!trimmedPhone || !trimmedPassword || !trimmedName) {
      setError('请填写所有必填项')
      return
    }
    if (!/^1\d{10}$/.test(trimmedPhone)) {
      setError('请输入正确的11位手机号')
      return
    }
    if (trimmedPassword !== confirmPassword) {
      setError('两次密码输入不一致')
      return
    }
    if (trimmedPassword.length < 6) {
      setError('密码长度至少6位')
      return
    }
    setLoading(true)
    try {
      const res = await auth.register({ phone: trimmedPhone, password: trimmedPassword, name: trimmedName })
      if (!res?.token || !res?.rider) {
        throw new Error('注册响应数据异常')
      }
      setAuth(res.token, res.rider)
      const targetPath = res.rider.role === 'admin' ? '/admin/dashboard' : '/rider/dashboard'
      navigate(targetPath, { replace: true })
    } catch (err: any) {
      const errMsg = err?.message || '注册失败，请稍后重试'
      setError(errMsg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary via-primary/90 to-secondary relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-32 right-20 w-48 h-48 border-2 border-white rounded-xl rotate-12" />
          <div className="absolute bottom-20 left-16 w-56 h-56 border-2 border-white rounded-full" />
          <div className="absolute top-1/3 left-1/4 w-24 h-24 border-2 border-white rounded rotate-45" />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full px-12 text-white">
          <div className="mb-8">
            <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center shadow-2xl">
              <Zap size={48} className="text-primary" />
            </div>
          </div>
          <h1 className="font-display text-4xl font-bold mb-4">加入闪送平台</h1>
          <p className="text-lg text-white/80 text-center max-w-md">
            灵活接单，自由配送。成为闪送员，开启您的配送之旅
          </p>
        </div>
      </div>

      {/* Right - Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Zap size={28} className="text-primary" />
            <span className="font-display text-xl font-bold text-secondary">闪送平台</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-secondary mb-2">注册新账户</h2>
          <p className="text-gray-500 mb-8">创建您的骑手账户</p>

          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 text-danger rounded-lg text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">姓名</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="请输入姓名"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
              <div className="relative">
                <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  maxLength={11}
                  placeholder="请输入11位手机号"
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
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码（至少6位）"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">确认密码</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            已有账户？{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

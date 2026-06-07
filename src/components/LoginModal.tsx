import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Eye, EyeOff, User, Mail, Phone, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore, useUIStore } from '@/store'
import { api } from '@/lib/api'

const roles = [
  { value: 'user', label: '普通用户', description: '购房者/装修需求者' },
  { value: 'agent', label: '置业顾问', description: '发布房源、直播带看' },
  { value: 'designer', label: '设计师', description: '设计方案、直播分享' },
  { value: 'company', label: '装修公司', description: '装修服务、报价接单' },
  { value: 'expert', label: '专业人士', description: '律师/估价师/监理' },
]

const demoAccounts = [
  { label: '管理员', username: 'admin', password: 'admin123' },
  { label: '购房用户', username: 'user', password: 'user123' },
  { label: '直播顾问', username: 'host', password: 'host123' },
  { label: '设计师', username: 'designer', password: 'designer123' },
  { label: '置业顾问', username: 'agent', password: 'agent123' },
  { label: '专业人士', username: 'expert', password: 'expert123' },
]

export default function LoginModal() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: 'admin',
    password: 'admin123',
    confirmPassword: '',
    email: '',
    phone: '',
    role: 'user',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [apiError, setApiError] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const visible = useUIStore((state) => state.loginModalVisible)
  const hideLoginModal = useUIStore((state) => state.hideLoginModal)
  const login = useAuthStore((state) => state.login)
  const register = useAuthStore((state) => state.register)

  useEffect(() => {
    if (visible) {
      setMode('login')
      setFormData({
        username: 'admin',
        password: 'admin123',
        confirmPassword: '',
        email: '',
        phone: '',
        role: 'user',
      })
      setErrors({})
    }
  }, [visible])

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名'
    } else if (formData.username.length < 3) {
      newErrors.username = '用户名至少3个字符'
    }

    if (!formData.password) {
      newErrors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少6个字符'
    }

    if (mode === 'register') {
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = '两次密码输入不一致'
      }
      if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        newErrors.email = '邮箱格式不正确'
      }
      if (formData.phone && !/^1[3-9]\d{9}$/.test(formData.phone)) {
        newErrors.phone = '手机号格式不正确'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return

    setLoading(true)
    try {
      if (mode === 'login') {
        const response = await api.auth.login({
          username: formData.username,
          password: formData.password,
        }) as { success: boolean; data?: { user: { id: number; username: string; role: string }; token: string }; error?: string }
        
        if (response.success && response.data) {
          login(response.data.user, response.data.token)
          hideLoginModal()
          const role = response.data.user.role
          if (role === 'admin') {
            navigate('/admin')
          } else if (role === 'host' || role === 'agent' || role === 'designer' || role === 'expert') {
            navigate('/dashboard')
          } else {
            navigate('/dashboard')
          }
        } else {
          setApiError(response.error || '用户名或密码错误，请重试')
        }
      } else {
        const response = await api.auth.register({
          username: formData.username,
          password: formData.password,
          role: formData.role,
          email: formData.email,
          phone: formData.phone,
        }) as { success: boolean; data?: { user: { id: number; username: string; role: string }; token: string }; error?: string }
        
        if (response.success && response.data) {
          register(response.data.user, response.data.token)
          hideLoginModal()
          const role = response.data.user.role
          if (role === 'admin') {
            navigate('/admin')
          } else if (role === 'host' || role === 'agent' || role === 'designer' || role === 'expert') {
            navigate('/dashboard')
          } else {
            navigate('/dashboard')
          }
        } else {
          setApiError(response.error || '注册失败，请重试')
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error)
      setApiError(error.message || (mode === 'login' ? '登录失败，请检查用户名和密码' : '注册失败，请稍后重试'))
    } finally {
      setLoading(false)
    }
  }

  const handleDemoLogin = async (account: typeof demoAccounts[number]) => {
    setMode('login')
    setFormData((prev) => ({ ...prev, username: account.username, password: account.password }))
    setErrors({})
    setApiError('')
    setLoading(true)
    try {
      const response = await api.auth.login({
        username: account.username,
        password: account.password,
      }) as { success: boolean; data?: { user: { id: number; username: string; role: string }; token: string }; error?: string }

      if (response.success && response.data) {
        login(response.data.user, response.data.token)
        hideLoginModal()
        navigate(response.data.user.role === 'admin' ? '/admin' : '/dashboard')
      } else {
        setApiError(response.error || '演示账号登录失败，请重试')
      }
    } catch (error: any) {
      console.error('Demo auth error:', error)
      setApiError(error.message || '演示账号登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      hideLoginModal()
    }
  }

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="relative w-full max-w-md mx-4 bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-teal-600 via-teal-500 to-amber-500" />

        <button
          onClick={hideLoginModal}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 transition-colors z-10"
        >
          <X size={20} className="text-slate-500" strokeWidth={1.5} />
        </button>

        <div className="p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-600 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-2xl">居</span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900">
              {mode === 'login' ? '欢迎回来' : '创建新账号'}
            </h2>
            <p className="text-slate-500 mt-1">
              {mode === 'login' ? '登录您的居界账号' : '加入居界，开启一站式置业装修服务'}
            </p>
          </div>

          <div className="flex bg-slate-100 rounded-xl p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                mode === 'login'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <LogIn size={16} strokeWidth={1.5} />
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all',
                mode === 'register'
                  ? 'bg-white text-teal-600 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              )}
            >
              <UserPlus size={16} strokeWidth={1.5} />
              注册
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {apiError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                <AlertCircle size={18} className="text-red-500 shrink-0" strokeWidth={1.5} />
                <p className="text-sm text-red-600">{apiError}</p>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                用户名
              </label>
              <div className="relative">
                <User
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.5}
                />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className={cn(
                    'input-field pl-10',
                    errors.username && 'border-red-300 focus:ring-red-500'
                  )}
                  placeholder="请输入用户名"
                />
              </div>
              {errors.username && (
                <p className="text-red-500 text-xs mt-1">{errors.username}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                密码
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.5}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={cn(
                    'input-field pl-10 pr-10',
                    errors.password && 'border-red-300 focus:ring-red-500'
                  )}
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff size={18} strokeWidth={1.5} />
                  ) : (
                    <Eye size={18} strokeWidth={1.5} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
              )}
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    确认密码
                  </label>
                  <div className="relative">
                    <Lock
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                      strokeWidth={1.5}
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({ ...formData, confirmPassword: e.target.value })
                      }
                      className={cn(
                        'input-field pl-10',
                        errors.confirmPassword && 'border-red-300 focus:ring-red-500'
                      )}
                      placeholder="请再次输入密码"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      邮箱
                    </label>
                    <div className="relative">
                      <Mail
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        strokeWidth={1.5}
                      />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className={cn(
                          'input-field pl-10',
                          errors.email && 'border-red-300 focus:ring-red-500'
                        )}
                        placeholder="选填"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5">
                      手机
                    </label>
                    <div className="relative">
                      <Phone
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        strokeWidth={1.5}
                      />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className={cn(
                          'input-field pl-10',
                          errors.phone && 'border-red-300 focus:ring-red-500'
                        )}
                        placeholder="选填"
                      />
                    </div>
                    {errors.phone && (
                      <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    选择角色
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {roles.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => setFormData({ ...formData, role: role.value })}
                        className={cn(
                          'p-3 rounded-lg border-2 text-left transition-all',
                          formData.role === role.value
                            ? 'border-teal-500 bg-teal-50'
                            : 'border-slate-200 hover:border-teal-200'
                        )}
                      >
                        <p
                          className={cn(
                            'text-sm font-medium',
                            formData.role === role.value ? 'text-teal-700' : 'text-slate-700'
                          )}
                        >
                          {role.label}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{role.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 mt-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? '登录' : '注册'}
                </>
              )}
            </button>

            {mode === 'login' && (
              <div className="grid grid-cols-3 gap-2">
                {demoAccounts.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => handleDemoLogin(account)}
                    disabled={loading}
                    className="rounded-lg border border-teal-100 bg-teal-50 px-2 py-2 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {account.label}
                  </button>
                ))}
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-sm mt-4">
                <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                  <input type="checkbox" className="rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                  记住我
                </label>
                <button type="button" className="text-teal-600 hover:text-teal-700">
                  忘记密码？
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}

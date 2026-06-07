import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Eye, EyeOff, Loader2, ArrowLeft } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

export default function Register() {
  const navigate = useNavigate()
  const register = useAuthStore((state) => state.register)
  const loading = useAuthStore((state) => state.loading)

  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    phone: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.username || !formData.password || !formData.name) {
      setError('用户名、密码和姓名为必填项')
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError('两次输入的密码不一致')
      return
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位')
      return
    }

    const result = await register({
      username: formData.username,
      password: formData.password,
      name: formData.name,
      phone: formData.phone || undefined,
    })

    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 2000)
    } else {
      setError(result.error || '注册失败')
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-center items-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-secondary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-4">鼎信地产</h1>
          <p className="text-zinc-300 text-lg">
            加入我们，开启您的房产经纪职业生涯
          </p>
          <div className="mt-12 space-y-4">
            <div className="flex items-center gap-4 p-4 bg-primary-light rounded-lg">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">1</span>
              </div>
              <div className="text-left">
                <p className="font-medium">注册账户</p>
                <p className="text-sm text-zinc-400">填写基本信息</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-primary-light rounded-lg">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">2</span>
              </div>
              <div className="text-left">
                <p className="font-medium">实名认证</p>
                <p className="text-sm text-zinc-400">提交身份信息</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-primary-light rounded-lg">
              <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-primary font-bold">3</span>
              </div>
              <div className="text-left">
                <p className="font-medium">开始工作</p>
                <p className="text-sm text-zinc-400">管理您的业务</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <button
            onClick={() => navigate('/login')}
            className="flex items-center gap-2 text-zinc-500 hover:text-primary mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            返回登录
          </button>

          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">鼎信地产</h1>
            <p className="text-zinc-500 mt-1">经纪人工作台</p>
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 mb-2">创建新账户</h2>
          <p className="text-zinc-500 mb-8">填写以下信息完成注册</p>

          {success ? (
            <div className="p-8 bg-green-50 border border-green-200 rounded-lg text-center">
              <div className="w-16 h-16 bg-success rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-success mb-2">注册成功</h3>
              <p className="text-zinc-600">正在跳转到登录页面...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    姓名 <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                    placeholder="请输入姓名"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    手机号
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                    placeholder="请输入手机号"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  用户名 <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                  placeholder="请设置用户名"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  密码 <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) =>
                      setFormData({ ...formData, password: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors pr-12"
                    placeholder="请设置密码（至少6位）"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700 mb-2">
                  确认密码 <span className="text-danger">*</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    setFormData({ ...formData, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                  placeholder="请再次输入密码"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-danger">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full py-3 bg-primary text-white rounded-lg font-medium hover:bg-primary-light transition-colors flex items-center justify-center gap-2',
                  loading && 'opacity-70 cursor-not-allowed'
                )}
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                {loading ? '注册中...' : '注册'}
              </button>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-zinc-500">
            已有账户？{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

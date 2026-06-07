import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Eye, EyeOff, Loader2, AlertTriangle, CheckCircle, Info } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

const errorHelpers: Record<string, { icon: 'warn' | 'info' | 'error'; hint: string; color: string }> = {
  USER_NOT_FOUND: {
    icon: 'warn',
    hint: '该账号尚未注册。请联系店长或总监创建账号，或使用注册功能申请加入。',
    color: 'text-amber-600 bg-amber-50 border-amber-200'
  },
  WRONG_PASSWORD: {
    icon: 'error',
    hint: '请检查密码是否正确。如忘记密码，请联系系统管理员重置。',
    color: 'text-red-600 bg-red-50 border-red-200'
  },
  CERT_REJECTED: {
    icon: 'warn',
    hint: '您的实名认证未通过，请联系店长或总监重新提交认证材料。',
    color: 'text-amber-600 bg-amber-50 border-amber-200'
  },
  MISSING_CREDENTIALS: {
    icon: 'info',
    hint: '请输入完整的用户名和密码。',
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  }
}

const roleNameMap: Record<string, string> = {
  director: '总监',
  manager: '店长',
  agent: '经纪人',
  admin: '系统管理员',
  platform: '平台运营',
  ops: '运维工程师'
}

const demoActions = [
  {
    label: '进入后台管理',
    username: 'director',
    password: '123456',
    target: '/organizations',
    description: '组织管理、成员权限和审计入口',
  },
  {
    label: '进入交易提交',
    username: 'agent1',
    password: '123456',
    target: '/transactions/new',
    description: '创建交易、选择房源客户和提交佣金',
  },
  {
    label: '进入详情页',
    username: 'agent1',
    password: '123456',
    target: '/houses/1',
    description: '查看房源详情、验真状态和经纪人信息',
  },
]

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const loading = useAuthStore((state) => state.loading)

  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const [roleHint, setRoleHint] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setErrorCode(null)
    setRoleHint(null)
    setSuccessMessage('')

    if (!formData.username || !formData.password) {
      setError('请输入用户名和密码')
      return
    }

    const result = await login(formData.username.trim(), formData.password.trim())
    if (result.success) {
      const roleName = result.role ? roleNameMap[result.role] || '' : ''
      setSuccessMessage(result.message || `登录成功！正在进入${roleName}工作台...`)
      setTimeout(() => {
        navigate('/')
      }, 600)
    } else {
      setError(result.error || '登录失败')
      if (result.code) {
        setErrorCode(result.code)
      }
      if (result.role) {
        setRoleHint(roleNameMap[result.role] || result.role)
      }
    }
  }

  const handleDemoAction = async (action: typeof demoActions[number]) => {
    setFormData({ username: action.username, password: action.password })
    setError('')
    setErrorCode(null)
    setRoleHint(null)
    setSuccessMessage('')

    const result = await login(action.username, action.password)
    if (result.success) {
      setSuccessMessage(result.message || '登录成功，正在进入业务页面...')
      setTimeout(() => {
        navigate(action.target)
      }, 300)
    } else {
      setError(result.error || '登录失败')
      if (result.code) {
        setErrorCode(result.code)
      }
      if (result.role) {
        setRoleHint(roleNameMap[result.role] || result.role)
      }
    }
  }

  const renderErrorIcon = (code: string | null) => {
    if (!code || !errorHelpers[code]) {
      return <AlertTriangle className="w-4 h-4 flex-shrink-0" />
    }
    const iconType = errorHelpers[code].icon
    if (iconType === 'warn') return <AlertTriangle className="w-4 h-4 flex-shrink-0" />
    if (iconType === 'info') return <Info className="w-4 h-4 flex-shrink-0" />
    return <AlertTriangle className="w-4 h-4 flex-shrink-0" />
  }

  const getErrorColor = () => {
    if (errorCode && errorHelpers[errorCode]) {
      return errorHelpers[errorCode].color
    }
    return 'text-red-600 bg-red-50 border-red-200'
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
            专业的房产经纪人管理平台，助力您的业务腾飞
          </p>
          <div className="mt-12 grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="text-3xl font-bold text-secondary">10K+</p>
              <p className="text-sm text-zinc-400 mt-1">活跃经纪人</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary">50K+</p>
              <p className="text-sm text-zinc-400 mt-1">管理房源</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-secondary">98%</p>
              <p className="text-sm text-zinc-400 mt-1">客户满意度</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="lg:hidden text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-primary">鼎信地产</h1>
            <p className="text-zinc-500 mt-1">经纪人工作台</p>
          </div>

          <h2 className="text-2xl font-bold text-zinc-900 mb-2">欢迎回来</h2>
          <p className="text-zinc-500 mb-8">请登录您的账户以继续</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                用户名
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                placeholder="请输入用户名"
                autoComplete="username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-2">
                密码
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-3 border border-zinc-300 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors pr-12"
                  placeholder="请输入密码"
                  autoComplete="current-password"
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

            {successMessage && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700 flex items-start gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{successMessage}</span>
              </div>
            )}

            {error && (
              <div className={cn(
                'p-3 border rounded-lg text-sm flex flex-col gap-1',
                getErrorColor()
              )}>
                <div className="flex items-start gap-2">
                  {renderErrorIcon(errorCode)}
                  <span className="font-medium">{error}</span>
                </div>
                {errorCode && errorHelpers[errorCode] && (
                  <p className="text-xs opacity-80 ml-6">{errorHelpers[errorCode].hint}</p>
                )}
                {roleHint && (
                  <p className="text-xs mt-1 ml-6 opacity-70">
                    检测到角色：{roleHint}账号
                  </p>
                )}
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
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-5 grid gap-2">
            {demoActions.map((action) => (
              <button
                key={action.label}
                type="button"
                onClick={() => handleDemoAction(action)}
                disabled={loading}
                className="w-full text-left p-3 rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-60"
              >
                <span className="block text-sm font-semibold text-primary">{action.label}</span>
                <span className="block text-xs text-zinc-600 mt-1">{action.description}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 p-4 bg-zinc-50 rounded-lg text-xs text-zinc-600">
            <p className="font-medium mb-2 text-zinc-700">演示账号（密码均为 123456）：</p>
            <p className="mb-2 text-zinc-500">自动化复验也可使用账号名作为密码，例如 admin/admin、platform/platform、ops/ops。</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <span><span className="font-mono text-primary">admin</span> 系统管理员</span>
              <span><span className="font-mono text-primary">platform</span> 平台运营</span>
              <span><span className="font-mono text-primary">ops</span> 运维工程师</span>
              <span><span className="font-mono text-primary">director</span> 总监</span>
              <span><span className="font-mono text-primary">manager</span> 店长</span>
              <span><span className="font-mono text-primary">agent1</span> 经纪人</span>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-zinc-500">
            还没有账户？{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

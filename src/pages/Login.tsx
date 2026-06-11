import { useState, useEffect } from 'react'
import { useAuthStore, type User } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { Loader2, AlertCircle, CheckCircle2, ShieldCheck, Building2, UserCog } from 'lucide-react'

const DEMO_ACCOUNTS: Record<string, { phone: string; password: string; label: string; icon: React.ElementType; desc: string }> = {
  entrepreneur: { phone: '13900000001', password: 'ent123', label: '创业者', icon: Building2, desc: '张先生 · 项目筛选·商机地图·风险评估' },
  brand: { phone: '13800000001', password: 'brand123', label: '品牌方', icon: ShieldCheck, desc: '喜茶加盟部 · 招商看板·加盟商管理' },
  admin: { phone: '13800000000', password: 'admin123', label: '管理员', icon: UserCog, desc: '平台管理员 · 项目审核·合同·履约·纠纷' },
}

export default function Login() {
  const loginFn = useAuthStore(state => state.login)
  const currentUser = useAuthStore(state => state.user)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginStep, setLoginStep] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (currentUser && loginStep !== 'submitting') {
      doRedirect(currentUser)
    }
  }, [currentUser])

  const doRedirect = (user: User) => {
    const targets: Record<string, string> = {
      admin: '/admin/review',
      brand: '/brand/dashboard',
      entrepreneur: '/',
    }
    const target = targets[user.role] || '/'
    window.location.href = target
  }

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!phone || !password) {
      setError('请输入手机号和密码')
      return
    }

    setError('')
    setLoading(true)
    setLoginStep('submitting')

    try {
      const result = await loginFn(phone, password)

      if (result && result.success) {
        setLoginStep('success')
        doRedirect(result.data)
      } else {
        setLoginStep('error')
        setError(result?.error || '手机号或密码错误，请检查后重试')
      }
    } catch (err: any) {
      setLoginStep('error')
      setError('网络连接失败，请检查网络后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleQuickLogin = async (role: string) => {
    const account = DEMO_ACCOUNTS[role]
    if (!account) return

    setPhone(account.phone)
    setPassword(account.password)
    setError('')
    setLoading(true)
    setLoginStep('submitting')

    try {
      const result = await loginFn(account.phone, account.password)

      if (result && result.success) {
        setLoginStep('success')
        doRedirect(result.data)
      } else {
        setLoginStep('error')
        setError(result?.error || '登录失败，请重试')
      }
    } catch (err: any) {
      setLoginStep('error')
      setError('网络连接失败，请检查网络后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">盟信通</h1>
          <p className="text-gray-500">加盟招商双向撮合平台</p>
        </div>

        <div className="mb-6">
          <p className="text-sm font-medium text-gray-700 mb-3">选择身份一键登录</p>
          <div className="space-y-3">
            {Object.entries(DEMO_ACCOUNTS).map(([key, account]) => {
              const Icon = account.icon
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleQuickLogin(key)}
                  disabled={loading}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left',
                    loading && loginStep === 'submitting'
                      ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                      : 'border-gray-200 hover:border-blue-500 hover:bg-blue-50 active:scale-[0.98]'
                  )}
                >
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon size={24} className="text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900">{account.label}</p>
                    <p className="text-xs text-gray-500 truncate">{account.desc}</p>
                  </div>
                  <div className="text-xs text-gray-400 flex-shrink-0">{account.phone}</div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white text-gray-400">或手动输入</span>
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="请输入手机号"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error}</p>
                <p className="text-red-500 text-xs mt-1">请检查账号密码，或使用上方一键登录</p>
              </div>
            </div>
          )}

          {loginStep === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle2 size={18} className="flex-shrink-0" />
              <span>登录成功，正在跳转至工作台...</span>
            </div>
          )}

          {loginStep === 'submitting' && (
            <div className="bg-blue-50 border border-blue-200 text-blue-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <Loader2 size={18} className="animate-spin flex-shrink-0" />
              <span>正在验证身份，请稍候...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={cn(
              'w-full font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2',
              loading
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]'
            )}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loginStep === 'submitting' ? '正在登录...' : '登 录'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">演示账号（点击上方角色卡片一键登录）：</p>
          <div className="text-xs text-gray-600 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">创业者（张先生）：</span>
              <span className="font-mono">13900000001 / ent123</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">品牌方（喜茶）：</span>
              <span className="font-mono">13800000001 / brand123</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">平台管理员：</span>
              <span className="font-mono">13800000000 / admin123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore, type User } from '@/store/authStore'
import { cn } from '@/lib/utils'
import { Loader2, AlertCircle } from 'lucide-react'

export default function Login() {
  const navigate = useNavigate()
  const login = useAuthStore(state => state.login)
  const currentUser = useAuthStore(state => state.user)
  const [phone, setPhone] = useState('13900000001')
  const [password, setPassword] = useState('ent123')
  const [role, setRole] = useState<'entrepreneur' | 'brand' | 'admin'>('entrepreneur')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [loginStep, setLoginStep] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  useEffect(() => {
    if (currentUser) {
      redirectByRole(currentUser)
    }
  }, [currentUser])

  const redirectByRole = (user: User) => {
    if (user.role === 'admin') {
      navigate('/admin/review', { replace: true })
    } else if (user.role === 'brand') {
      navigate('/brand/dashboard', { replace: true })
    } else {
      navigate('/', { replace: true })
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    setLoginStep('submitting')

    try {
      const result = await login(phone, password)
      
      if (result.success) {
        setLoginStep('success')
        setTimeout(() => {
          redirectByRole(result.data)
        }, 500)
      } else {
        setLoginStep('error')
        setError(result.error || '手机号或密码错误，请检查后重试')
      }
    } catch (e: any) {
      setLoginStep('error')
      setError('网络连接失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const quickLogin = (user: string) => {
    const accounts: Record<string, { phone: string; password: string }> = {
      admin: { phone: '13800000000', password: 'admin123' },
      brand: { phone: '13800000001', password: 'brand123' },
      entrepreneur: { phone: '13900000001', password: 'ent123' },
    }
    setPhone(accounts[user].phone)
    setPassword(accounts[user].password)
    setRole(user as any)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">盟信通</h1>
          <p className="text-gray-500">加盟招商双向撮合平台</p>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'entrepreneur', label: '创业者' },
            { key: 'brand', label: '品牌方' },
            { key: 'admin', label: '管理员' },
          ].map(r => (
            <button
              key={r.key}
              type="button"
              onClick={() => { setRole(r.key as any); quickLogin(r.key) }}
              className={cn(
                'flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all',
                role === r.key
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {r.label}
            </button>
          ))}
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
              required
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
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">{error}</p>
                <p className="text-red-500 text-xs mt-1">请检查账号密码，或使用下方快捷登录</p>
              </div>
            </div>
          )}

          {loginStep === 'success' && (
            <div className="bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-green-500 animate-pulse"></div>
              <span>登录成功，正在跳转至工作台...</span>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || loginStep === 'success'}
            className={cn(
              'w-full font-medium py-3 rounded-lg transition-all flex items-center justify-center gap-2',
              loginStep === 'success'
                ? 'bg-green-600 text-white'
                : loading
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            )}
          >
            {loading && <Loader2 size={18} className="animate-spin" />}
            {loginStep === 'submitting' && '正在验证身份...'}
            {loginStep === 'success' && '登录成功 ✓'}
            {loginStep === 'idle' && '登 录'}
            {loginStep === 'error' && '重新登录'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-xs font-medium text-gray-700 mb-2">演示账号（点击上方角色按钮自动填充）：</p>
          <div className="text-xs text-gray-600 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-500">创业者（张先生）：</span>
              <span className="font-mono">entrepreneur / ent123</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">品牌方（喜茶）：</span>
              <span className="font-mono">brand / brand123</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">平台管理员：</span>
              <span className="font-mono">admin / admin123</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

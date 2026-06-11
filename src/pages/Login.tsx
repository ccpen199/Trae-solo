import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogIn, UserPlus, Phone, ShieldCheck } from 'lucide-react'

const apiBase = import.meta.env.VITE_API_URL || ''

export default function Login() {
  const navigate = useNavigate()
  const [phone, setPhone] = useState('13800138000')
  const [username, setUsername] = useState('运营管理员')
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [message, setMessage] = useState('演示账号已准备，可直接登录或注册')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch(`${apiBase}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, username, nickname: username }),
      })
      const payload = await res.json()
      if (!res.ok || !payload.success) {
        throw new Error(payload.error || payload.message || '认证失败')
      }
      localStorage.setItem('zc_auth_token', payload.token || 'demo-login-token')
      setMessage(`${mode === 'login' ? '登录' : '注册'}成功，正在进入个人中心`)
      setTimeout(() => navigate('/admin/user-profile'), 300)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : '认证服务暂不可用')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="glass-card w-full max-w-md p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-electric-green/10 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-electric-green" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-100">智充网联统一认证</h1>
            <p className="text-xs text-gray-500 mt-1">登录注册 · 个人中心 · 运营后台</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-deep-blue p-1">
          <button
            onClick={() => setMode('login')}
            className={`py-2 rounded-md text-sm transition-colors ${mode === 'login' ? 'bg-electric-green text-deep-blue' : 'text-gray-400 hover:text-gray-200'}`}
          >
            登录
          </button>
          <button
            onClick={() => setMode('register')}
            className={`py-2 rounded-md text-sm transition-colors ${mode === 'register' ? 'bg-electric-green text-deep-blue' : 'text-gray-400 hover:text-gray-200'}`}
          >
            注册
          </button>
        </div>

        <div className="space-y-3">
          <label className="block">
            <span className="text-xs text-gray-400 mb-1 block">手机号</span>
            <div className="relative">
              <Phone className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className="input-field w-full pl-9" />
            </div>
          </label>
          <label className="block">
            <span className="text-xs text-gray-400 mb-1 block">姓名/昵称</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} className="input-field w-full" />
          </label>
        </div>

        <button onClick={submit} disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2 py-2.5 disabled:opacity-60">
          {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
          {loading ? '处理中...' : mode === 'login' ? '登录并进入个人中心' : '注册并进入个人中心'}
        </button>

        <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-xs text-gray-300">
          {message}
        </div>
      </div>
    </div>
  )
}

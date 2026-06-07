import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Truck, Package, Shield, Phone, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuthStore } from '@/stores/auth'

const roles = [
  { key: 'shipper', label: '货主', icon: Package, desc: '发布货源，管理运单' },
  { key: 'driver', label: '司机', icon: Truck, desc: '接单配送，查看收入' },
  { key: 'admin', label: '管理员', icon: Shield, desc: '平台运营，风控管理' },
] as const

const demoAccounts = {
  shipper: { phone: '13700000001', password: 'shipper123' },
  driver: { phone: '13900000001', password: 'driver123' },
  admin: { phone: '13800000001', password: 'admin123' },
} as const

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const [role, setRole] = useState<string>('shipper')
  const [phone, setPhone] = useState<string>(demoAccounts.shipper.phone)
  const [password, setPassword] = useState<string>(demoAccounts.shipper.password)
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(phone, password, role)
      navigate('/dashboard')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const applyDemoAccount = (nextRole: keyof typeof demoAccounts) => {
    setRole(nextRole)
    setPhone(demoAccounts[nextRole].phone)
    setPassword(demoAccounts[nextRole].password)
  }

  return (
    <div className="h-screen w-screen flex" style={{ background: 'linear-gradient(135deg, #0F1A2E 0%, #1B2A4A 40%, #2D4A7A 100%)' }}>
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-accent mx-auto flex items-center justify-center text-white text-3xl font-bold shadow-xl">
            达
          </div>
          <h1 className="mt-6 text-4xl font-bold text-white">货达通</h1>
          <p className="mt-2 text-white/60 text-lg">数字货运 · 智联未来</p>
          <div className="mt-8 flex gap-8 justify-center">
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">50K+</p>
              <p className="text-white/50 text-sm mt-1">在线司机</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">100+</p>
              <p className="text-white/50 text-sm mt-1">覆盖城市</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold text-accent">99.2%</p>
              <p className="text-white/50 text-sm mt-1">准时率</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-[440px] bg-white/95 backdrop-blur-xl flex items-center justify-center p-10">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-bold text-primary">欢迎登录</h2>
          <p className="text-sm text-secondary mt-1">请选择角色并登录</p>

          <div className="flex gap-2 mt-6">
            {roles.map((r) => {
              const Icon = r.icon
              const active = role === r.key
              return (
                <button
                  key={r.key}
                  onClick={() => applyDemoAccount(r.key)}
                  className={`flex-1 py-3 px-2 rounded-lg border-2 transition-all text-center ${
                    active
                      ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon size={20} className={active ? 'text-primary mx-auto' : 'text-muted mx-auto'} />
                  <p className={`text-xs mt-1 font-medium ${active ? 'text-primary' : 'text-secondary'}`}>
                    {r.label}
                  </p>
                </button>
              )
            })}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => applyDemoAccount(r.key)}
                  className="h-8 rounded-md bg-gray-100 text-xs text-secondary hover:bg-gray-200 transition-colors"
                >
                  {r.label}演示
                </button>
              ))}
            </div>
            <div className="relative">
              <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="手机号"
                className="w-full h-11 pl-10 pr-4 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="密码"
                className="w-full h-11 pl-10 pr-10 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[var(--color-primary)] focus:ring-1 focus:ring-[var(--color-primary)]/20"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-secondary"
              >
                {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {error && <p className="text-sm text-coral">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 btn-primary disabled:opacity-50"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <p className="text-center text-xs text-muted mt-6">
            登录即表示同意《用户协议》和《隐私政策》
          </p>
        </div>
      </div>
    </div>
  )
}

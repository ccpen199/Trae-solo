import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore, UserRole } from '@/store/auth'
import {
  Users,
  Building2,
  Shield,
  ArrowRight,
  Leaf,
  Phone,
  Lock,
} from 'lucide-react'

const roleOptions: {
  role: UserRole
  title: string
  subtitle: string
  icon: typeof Users
  gradient: string
}[] = [
  {
    role: 'direct_seller',
    title: '直销员',
    subtitle: '个人展业空间 · 客户管理 · 业绩追踪',
    icon: Users,
    gradient: 'from-emerald-500 to-teal-600',
  },
  {
    role: 'store_owner',
    title: '生活馆店主',
    subtitle: '门店运营 · 预约管理 · 服务记录',
    icon: Building2,
    gradient: 'from-amber-500 to-orange-600',
  },
  {
    role: 'hq_admin',
    title: '总部运营',
    subtitle: '全局管控 · 数据看板 · 合规风控',
    icon: Shield,
    gradient: 'from-sky-500 to-blue-600',
  },
]

export default function Login() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated } = useAuthStore()

  const from = (location.state as { from?: string })?.from || '/dashboard'

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRole || !phone) return
    setLoading(true)
    try {
      await login(selectedRole, phone)
      navigate(from, { replace: true })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-cyan-300 rounded-full blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <Leaf className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">新时代健康</span>
          </div>
          <p className="text-white/80 text-sm mt-2">产业专属展业协同平台</p>
        </div>
        <div className="relative z-10 text-white">
          <h1 className="text-4xl font-bold mb-6 leading-tight">
            人 · 货 · 场
            <br />
            全链路数字化展业
          </h1>
          <p className="text-white/80 text-lg leading-relaxed max-w-md">
            赋能直销员、生活馆与总部运营三位一体，构建合规、高效、透明的健康产业协同生态。
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: '服务直销员', value: '12,800+' },
              { label: '生活馆覆盖', value: '3,200+' },
              { label: '年交易额', value: '¥58亿' },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 backdrop-blur rounded-xl p-4">
                <div className="text-2xl font-bold text-white">{item.value}</div>
                <div className="text-white/70 text-sm mt-1">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 text-white/60 text-sm">
          © 2026 新时代健康产业集团 · 合规经营 稳健发展
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <Leaf className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-slate-800">新时代健康</div>
              <div className="text-xs text-slate-500">展业协同平台</div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-800">欢迎登录</h2>
          <p className="text-slate-500 mt-2">请选择您的身份进入工作台</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                选择身份
              </label>
              <div className="space-y-3">
                {roleOptions.map((item) => {
                  const Icon = item.icon
                  const isSelected = selectedRole === item.role
                  return (
                    <button
                      key={item.role}
                      type="button"
                      onClick={() => setSelectedRole(item.role)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-4 ${
                        isSelected
                          ? `border-transparent bg-gradient-to-r ${item.gradient} text-white shadow-lg`
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div
                        className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          isSelected
                            ? 'bg-white/20'
                            : `bg-gradient-to-br ${item.gradient}`
                        }`}
                      >
                        <Icon
                          className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-white'}`}
                        />
                      </div>
                      <div className="flex-1">
                        <div className={`font-semibold ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                          {item.title}
                        </div>
                        <div className={`text-sm ${isSelected ? 'text-white/80' : 'text-slate-500'}`}>
                          {item.subtitle}
                        </div>
                      </div>
                      <ArrowRight
                        className={`w-5 h-5 ${isSelected ? 'text-white' : 'text-slate-300'}`}
                      />
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                手机号
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="tel"
                  placeholder="请输入手机号"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                登录密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  placeholder="请输入密码（演示环境可留空）"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!selectedRole || !phone || loading}
              className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/40 hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              {loading ? '登录中...' : '进入工作台'}
            </button>

            <div className="text-center text-sm text-slate-400">
              登录即表示同意《用户服务协议》与《隐私政策》
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

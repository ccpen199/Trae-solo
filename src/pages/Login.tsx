import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Scale,
  User,
  Briefcase,
  Shield,
  Phone,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  FileCheck,
  BookOpen,
  Gavel
} from 'lucide-react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { cn } from '@/lib/utils'

type RoleType = 'user' | 'lawyer' | 'admin'

const roles: { key: RoleType; label: string; icon: typeof User; desc: string }[] = [
  { key: 'user', label: '普通用户', icon: User, desc: '需要法律咨询帮助' },
  { key: 'lawyer', label: '执业律师', icon: Briefcase, desc: '提供专业法律服务' },
  { key: 'admin', label: '管理员', icon: Shield, desc: '平台运营与管理' }
]

const demoAccounts: Record<RoleType, { phone: string; password: string; label: string }> = {
  user: { phone: '13800138000', password: '123456', label: '普通用户' },
  lawyer: { phone: '13900139000', password: '123456', label: '律师' },
  admin: { phone: 'admin', password: '123456', label: '管理员' }
}

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useAuthStore(state => state.login)
  
  const state = location.state as { 
    redirectTo?: string
    preselectedCase?: string
    preselectedLawyer?: string
  } | null
  const redirectTo = state?.redirectTo
  const preselectedCase = state?.preselectedCase
  const preselectedLawyer = state?.preselectedLawyer

  const [role, setRole] = useState<RoleType>('user')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!phone.trim()) {
      setError(role === 'admin' ? '请输入用户名' : '请输入手机号')
      return
    }
    if (!password.trim()) {
      setError('请输入密码')
      return
    }
    if (role !== 'admin' && !/^1\d{10}$/.test(phone)) {
      setError('请输入正确的11位手机号')
      return
    }

    setLoading(true)
    try {
      const success = await login(role, phone, password)
      if (success) {
        if (role === 'user') {
          if (redirectTo === '/consultation/submit') {
            navigate(redirectTo, { state: { preselectedCase, preselectedLawyer } })
          } else {
            navigate('/')
          }
        } else if (role === 'lawyer') {
          navigate('/lawyer/workspace')
        } else {
          navigate('/admin/dashboard')
        }
      } else {
        setError('账号或密码错误，请重试')
      }
    } catch {
      setError('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  const handleFillDemo = () => {
    const demo = demoAccounts[role]
    setPhone(demo.phone)
    setPassword(demo.password)
    setError('')
  }

  return (
    <div className="min-h-screen flex bg-hero-gradient relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-96 h-96 bg-justice-400/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-scale-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-公益-400/10 rounded-full blur-3xl" />
      </div>

      <div className="hidden lg:flex flex-1 relative z-10">
        <div className="m-auto max-w-xl px-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                <Scale className="w-8 h-8 text-white" />
              </div>
              <span className="text-2xl font-bold text-white">法援在线</span>
            </div>

            <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
              让正义
              <span className="bg-gradient-to-r from-scale-300 to-scale-500 bg-clip-text text-transparent">触手可及</span>
            </h1>
            <p className="text-white/70 text-lg leading-relaxed mb-10">
              连接全国专业律师，为您提供免费、专业、保密的法律咨询服务。
              用科技赋能法律援助，让每一个人都能平等获得法律保护。
            </p>

            <div className="space-y-4">
              {[
                { title: '专业可靠', desc: '实名认证执业律师，资质严格审核' },
                { title: '隐私保护', desc: '端到端加密通信，阅后即焚功能' },
                { title: '快速响应', desc: '平均15分钟内律师响应' }
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.15 }}
                  className="flex items-start gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10"
                >
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-scale-400 to-scale-600 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-white/60 text-sm">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center relative z-10 p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">法援在线</span>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来</h2>
                <p className="text-gray-500">
                  {redirectTo === '/consultation/submit' 
                    ? '登录后将自动进入咨询提交流程' 
                    : '请选择您的身份并登录'}
                </p>
              </div>
              
              {redirectTo === '/consultation/submit' && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-公益-50 rounded-2xl border border-公益-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-公益-500 flex items-center justify-center flex-shrink-0">
                      <FileCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">咨询流程已开启</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {preselectedCase ? `已选择案由：${preselectedCase === 'marriage' ? '婚姻家庭' : 
                          preselectedCase === 'labor' ? '劳动争议' : 
                          preselectedCase === 'debt' ? '债权债务' : 
                          preselectedCase === 'property' ? '房产纠纷' : 
                          preselectedCase === 'criminal' ? '刑事辩护' : 
                          preselectedCase === 'contract' ? '合同纠纷' : 
                          preselectedCase === 'traffic' ? '侵权责任' : '其他'}` : 
                          preselectedLawyer ? '已选择指定律师' : '登录后填写咨询信息'}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="grid grid-cols-3 gap-2 mb-8 p-1 bg-gray-100 rounded-2xl">
                {roles.map((r) => {
                  const Icon = r.icon
                  const isActive = role === r.key
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => {
                        setRole(r.key)
                        setPhone('')
                        setPassword('')
                        setError('')
                      }}
                      className={cn(
                        'flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl transition-all',
                        isActive
                          ? 'bg-white shadow-sm text-justice-600'
                          : 'text-gray-500 hover:text-gray-700'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', isActive ? 'text-justice-600' : '')} />
                      <span className="text-xs font-medium">{r.label}</span>
                    </button>
                  )
                })}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={role}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="mb-6 p-4 bg-justice-50 rounded-2xl border border-justice-100"
                >
                  <div className="flex items-center gap-2">
                    {(() => {
                      const Icon = roles.find(r => r.key === role)?.icon || User
                      return <Icon className="w-5 h-5 text-justice-600" />
                    })()}
                    <span className="text-sm text-justice-700 font-medium">
                      {roles.find(r => r.key === role)?.desc}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {role === 'admin' ? '用户名' : '手机号'}
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={role === 'admin' ? '请输入用户名' : '请输入手机号'}
                      className={cn(
                        'w-full pl-12 pr-4 py-3.5 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-justice-500/20 focus:border-justice-500 transition-all',
                        error ? 'border-alert-500' : 'border-gray-200'
                      )}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className={cn(
                        'w-full pl-12 pr-12 py-3.5 bg-gray-50 border rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-justice-500/20 focus:border-justice-500 transition-all',
                        error ? 'border-alert-500' : 'border-gray-200'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-2 p-3 bg-alert-50 text-alert-600 rounded-xl text-sm"
                    >
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-justice-500 to-justice-700 text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-justice-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>登录中...</span>
                    </>
                  ) : (
                    <>
                      <span>登录</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-8 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-gray-500">演示账号</span>
                  <button
                    onClick={handleFillDemo}
                    className="text-sm text-justice-600 font-medium hover:text-justice-700 transition-colors"
                  >
                    一键填充
                  </button>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">普通用户</span>
                    <span className="text-gray-700 font-mono">13800138000 / 123456</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">律师</span>
                    <span className="text-gray-700 font-mono">13900139000 / 123456</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">管理员</span>
                    <span className="text-gray-700 font-mono">admin / 123456</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-center text-white/60 text-sm mt-6">
            登录即表示您同意我们的用户协议和隐私政策
          </p>
        </motion.div>
      </div>
    </div>
  )
}

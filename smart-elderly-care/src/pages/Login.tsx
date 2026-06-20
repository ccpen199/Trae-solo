import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, testAccounts } from '../context/AuthContext'
import { Shield, Briefcase, Heart, AlertCircle, ChevronRight, Lock, User as UserIcon } from 'lucide-react'
import type { Role } from '../types'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<Role>('government')
  const [username, setUsername] = useState('admin_gov')
  const [password, setPassword] = useState('gov123456')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const roleConfig: Record<Role, { label: string; subLabel: string; icon: React.ReactNode; color: string; hoverColor: string; bgColor: string; accounts: typeof testAccounts }> = {
    government: {
      label: '民政监管',
      subLabel: '监管看板 · 穿透审计 · 补贴追踪 · 投诉闭环',
      icon: <Shield className="w-7 h-7" />,
      color: 'from-gov-500 to-gov-600',
      hoverColor: 'hover:bg-gov-50 hover:border-gov-300',
      bgColor: 'bg-gov-500',
      accounts: testAccounts.filter(a => a.role === 'government'),
    },
    institution: {
      label: '机构管理',
      subLabel: '护理计划 · 床位管理 · 电子签名 · 星级评定',
      icon: <Briefcase className="w-7 h-7" />,
      color: 'from-primary-500 to-primary-600',
      hoverColor: 'hover:bg-primary-50 hover:border-primary-300',
      bgColor: 'bg-primary-500',
      accounts: testAccounts.filter(a => a.role === 'institution'),
    },
    family: {
      label: '家庭端',
      subLabel: '用药追踪 · 异常预警 · 紧急联系人 · 居家服务',
      icon: <Heart className="w-7 h-7" />,
      color: 'from-elderly-500 to-elderly-400',
      hoverColor: 'hover:bg-elderly-50 hover:border-elderly-300',
      bgColor: 'bg-elderly-500',
      accounts: testAccounts.filter(a => a.role === 'family'),
    },
  }

  const handleRoleSelect = (role: Role) => {
    setSelectedRole(role)
    const account = roleConfig[role].accounts[0]
    setUsername(account.username)
    setPassword(account.password)
    setError('')
  }

  const handleQuickLogin = async (account: typeof testAccounts[0]) => {
    setError('')
    setIsLoading(true)
    setUsername(account.username)
    setPassword(account.password)
    setSelectedRole(account.role)

    const result = await login(account.username, account.password)
    setIsLoading(false)

    if (result.success) {
      const entryPaths: Record<Role, string> = {
        government: '/government/dashboard',
        institution: '/institution/overview',
        family: '/family/overview',
      }
      navigate(entryPaths[account.role], { replace: true })
    } else {
      setError(result.message || '登录失败')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!username.trim()) {
      setError('请输入账号')
      setIsLoading(false)
      return
    }
    if (!password.trim()) {
      setError('请输入密码')
      setIsLoading(false)
      return
    }

    const result = await login(username.trim(), password.trim())
    setIsLoading(false)

    if (result.success) {
      const userRole = selectedRole
      const entryPaths: Record<Role, string> = {
        government: '/government/dashboard',
        institution: '/institution/overview',
        family: '/family/overview',
      }
      navigate(entryPaths[userRole], { replace: true })
    } else {
      setError(result.message || '登录失败')
    }
  }

  const currentRole = roleConfig[selectedRole]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gov-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-elderly-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="flex flex-col lg:flex-row gap-8 items-center">
          <div className="flex-1 text-white lg:pr-8">
            <div className="mb-8">
              <div className="w-20 h-20 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center mb-6 border border-white/10">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h1 className="text-4xl font-bold mb-3 leading-tight">
                智慧养老
                <br />
                <span className="text-primary-300">综合服务平台</span>
              </h1>
              <p className="text-slate-300 text-lg">GBC三端协同 · 以民政监管为底座</p>
            </div>
            <div className="space-y-3 text-slate-300 text-sm">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <Shield className="w-5 h-5 text-gov-400 shrink-0" />
                <span><b className="text-gov-300">G端·民政监管：</b>区域老龄化率、补贴发放精准度、投诉闭环率、穿透式审计</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <Briefcase className="w-5 h-5 text-primary-400 shrink-0" />
                <span><b className="text-primary-300">B端·机构管理：</b>老人档案、床位余量、护理计划执行、电子签名归档</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <Heart className="w-5 h-5 text-elderly-400 shrink-0" />
                <span><b className="text-elderly-300">C端·家庭端：</b>用药依从性、跌倒预警、紧急联系人、居家服务工单</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
                <h2 className="text-lg font-bold text-white">选择角色并登录</h2>
                <p className="text-xs text-slate-400 mt-0.5">点击下方测试账号可快速登录体验</p>
              </div>

              <div className="p-6 space-y-5">
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(roleConfig) as Role[]).map((role) => {
                    const cfg = roleConfig[role]
                    const isSelected = selectedRole === role
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRoleSelect(role)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? `border-slate-800 bg-slate-50 shadow-md`
                            : `border-slate-200 bg-slate-50/50 ${cfg.hoverColor}`
                        }`}
                      >
                        <div className={isSelected ? 'text-slate-800' : 'text-slate-500'}>
                          {cfg.icon}
                        </div>
                        <span className={`text-xs font-semibold ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                          {cfg.label}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className={`p-4 rounded-xl bg-gradient-to-r ${currentRole.color} text-white`}>
                  <div className="flex items-center gap-3 mb-2">
                    {currentRole.icon}
                    <div>
                      <div className="font-semibold">{currentRole.label}</div>
                      <div className="text-xs opacity-80">{currentRole.subLabel}</div>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-white/20 space-y-1.5">
                    <p className="text-xs font-medium opacity-90">测试账号（点击一键登录）：</p>
                    <div className="flex flex-wrap gap-1.5">
                      {currentRole.accounts.map((account) => (
                        <button
                          key={account.username}
                          type="button"
                          onClick={() => handleQuickLogin(account)}
                          disabled={isLoading}
                          className="flex items-center gap-1 text-xs px-2.5 py-1 bg-white/20 hover:bg-white/30 rounded-full transition-colors disabled:opacity-50"
                        >
                          {account.name}
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                      <UserIcon className="w-4 h-4 text-slate-400" />
                      账号
                    </label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="请输入账号"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-1.5 text-sm font-medium text-slate-700 mb-1.5">
                      <Lock className="w-4 h-4 text-slate-400" />
                      密码
                    </label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="请输入密码"
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 outline-none transition-all text-sm"
                      onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                    />
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-100">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-3 px-4 bg-gradient-to-r ${currentRole.color} text-white rounded-lg font-semibold hover:opacity-90 transition-all disabled:opacity-70 flex items-center justify-center gap-2 shadow-md`}
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        登录中，请稍候...
                      </>
                    ) : (
                      <>
                        登录进入 {currentRole.label} 工作台
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                <div className="text-xs text-slate-400 text-center pt-2 border-t border-slate-100">
                  💡 建议直接点击上方彩色卡片中的测试账号按钮，一键快速登录
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

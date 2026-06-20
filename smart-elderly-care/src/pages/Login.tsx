import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, testAccounts, entryPaths } from '../context/AuthContext'
import { Shield, Briefcase, Heart, ChevronRight, CheckCircle2, User as UserIcon, Building2, Home } from 'lucide-react'
import type { Role } from '../types'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [selectedRole, setSelectedRole] = useState<Role>('government')
  const [loggingInAccount, setLoggingInAccount] = useState<string | null>(null)

  const roleConfig: Record<Role, {
    label: string
    subLabel: string
    icon: React.ReactNode
    color: string
    bgGradient: string
    borderColor: string
    textColor: string
    accounts: typeof testAccounts
  }> = {
    government: {
      label: '民政监管（G端）',
      subLabel: '区域监管看板 · 穿透式审计 · 补贴资金追踪 · 投诉闭环管理',
      icon: <Shield className="w-8 h-8" />,
      color: 'from-gov-500 to-gov-600',
      bgGradient: 'from-gov-50 to-white',
      borderColor: 'border-gov-200 hover:border-gov-400',
      textColor: 'text-gov-700',
      accounts: testAccounts.filter((a) => a.role === 'government'),
    },
    institution: {
      label: '机构管理（B端）',
      subLabel: '护理计划执行 · 床位实时管理 · 电子签名归档 · 星级评定',
      icon: <Briefcase className="w-8 h-8" />,
      color: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-white',
      borderColor: 'border-primary-200 hover:border-primary-400',
      textColor: 'text-primary-700',
      accounts: testAccounts.filter((a) => a.role === 'institution'),
    },
    family: {
      label: '家庭端（C端）',
      subLabel: '用药依从追踪 · 跌倒异常预警 · 紧急联系人联动 · 居家服务工单',
      icon: <Heart className="w-8 h-8" />,
      color: 'from-elderly-500 to-elderly-400',
      bgGradient: 'from-elderly-50 to-white',
      borderColor: 'border-elderly-200 hover:border-elderly-400',
      textColor: 'text-elderly-700',
      accounts: testAccounts.filter((a) => a.role === 'family'),
    },
  }

  const handleQuickLogin = async (account: (typeof testAccounts)[0]) => {
    console.log('[Login] 点击一键登录:', account.name, account.username)
    setLoggingInAccount(account.username)

    const result = await login(account.username, account.password)
    setLoggingInAccount(null)

    if (result.success && result.user) {
      console.log('[Login] 登录成功，跳转到:', entryPaths[result.user.role])
      navigate(entryPaths[result.user.role], { replace: true })
    } else {
      console.error('[Login] 登录失败:', result.message)
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
        <div className="flex flex-col lg:flex-row gap-10 items-center">
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
              <p className="text-slate-300 text-lg">GBC 三端协同 · 以民政监管为底座</p>
            </div>
            <div className="space-y-3 text-slate-300 text-sm">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <Shield className="w-5 h-5 text-gov-400 shrink-0" />
                <span><b className="text-gov-300">G端·民政监管：</b>区域老龄化率、补贴发放精准度、投诉闭环率、穿透式审计</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <Building2 className="w-5 h-5 text-primary-400 shrink-0" />
                <span><b className="text-primary-300">B端·机构管理：</b>老人数字档案、床位实时余量、护理计划执行、电子签名归档</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <Home className="w-5 h-5 text-elderly-400 shrink-0" />
                <span><b className="text-elderly-300">C端·家庭端：</b>用药依从性、跌倒异常预警、紧急联系人、居家服务工单</span>
              </div>
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                <span><b className="text-green-300">服务调度：</b>健康等级×地理位置×紧迫度三维智能匹配</span>
              </div>
            </div>
          </div>

          <div className="w-full max-w-lg">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-5">
                <h2 className="text-xl font-bold text-white">选择身份，一键登录</h2>
                <p className="text-xs text-slate-400 mt-1">点击下方账号卡片即可直接进入对应工作台，无需输入密码</p>
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
                        onClick={() => setSelectedRole(role)}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                          isSelected
                            ? `border-slate-800 bg-slate-50 shadow-md`
                            : `border-slate-200 bg-slate-50/50 ${cfg.borderColor}`
                        }`}
                      >
                        <div className={isSelected ? 'text-slate-800' : 'text-slate-500'}>
                          {cfg.icon}
                        </div>
                        <span className={`text-xs font-semibold ${isSelected ? 'text-slate-800' : 'text-slate-500'}`}>
                          {cfg.label.split('（')[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <div className={`p-5 rounded-xl bg-gradient-to-br ${currentRole.bgGradient} border-2 ${currentRole.borderColor.split(' ')[0]}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2.5 rounded-xl bg-gradient-to-r ${currentRole.color} text-white shadow-md`}>
                      {currentRole.icon}
                    </div>
                    <div>
                      <div className={`font-bold text-lg ${currentRole.textColor}`}>{currentRole.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{currentRole.subLabel}</div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <p className="text-xs font-medium text-slate-600 mb-3">
                      测试账号（点击直接登录）：
                    </p>
                    {currentRole.accounts.map((account) => {
                      const isLoggingIn = loggingInAccount === account.username
                      return (
                        <button
                          key={account.username}
                          type="button"
                          onClick={() => handleQuickLogin(account)}
                          disabled={isLoggingIn || loggingInAccount !== null}
                          className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all group ${
                            isLoggingIn
                              ? 'border-slate-300 bg-slate-100 opacity-70'
                              : `border-slate-200 bg-white hover:bg-gradient-to-r hover:from-white hover:to-slate-50 hover:shadow-md hover:${currentRole.borderColor.split(' ')[1]}`
                          } disabled:cursor-not-allowed`}
                        >
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r ${currentRole.color} text-white shadow-md shrink-0`}>
                            {isLoggingIn ? (
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <UserIcon className="w-6 h-6" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-slate-800 flex items-center gap-2">
                              {account.name}
                              <span className="text-xs font-normal text-slate-400">({account.username})</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{account.department}</div>
                          </div>
                          <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${currentRole.color} text-white transition-all ${isLoggingIn ? 'opacity-50' : 'group-hover:translate-x-0.5'}`}>
                            {isLoggingIn ? '登录中...' : '立即登录'}
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="text-center text-xs text-slate-400 pt-1">
                  💡 点击上方「立即登录」按钮即可完成账号校验、角色分流，直接进入工作台
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

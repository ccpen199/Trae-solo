import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth, testAccounts, entryPaths } from '../context/AuthContext'
import { Shield, Briefcase, Heart, ChevronRight, CheckCircle2, User as UserIcon, Building2, Home, Users, FileText, BarChart3 } from 'lucide-react'
import type { Role } from '../types'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [loggingInAccount, setLoggingInAccount] = useState<string | null>(null)

  const roleConfig: Record<Role, {
    label: string
    subLabel: string
    icon: React.ReactNode
    color: string
    bgGradient: string
    borderColor: string
    textColor: string
    badge: string
  }> = {
    government: {
      label: '民政监管（G端）',
      subLabel: '区域监管看板 · 穿透式审计 · 补贴资金追踪 · 投诉闭环管理',
      icon: <Shield className="w-7 h-7" />,
      color: 'from-gov-500 to-gov-600',
      bgGradient: 'from-gov-50 to-white',
      borderColor: 'border-gov-200',
      textColor: 'text-gov-700',
      badge: 'bg-gov-500',
    },
    institution: {
      label: '机构管理（B端）',
      subLabel: '护理计划执行 · 床位实时管理 · 电子签名归档 · 星级评定',
      icon: <Briefcase className="w-7 h-7" />,
      color: 'from-primary-500 to-primary-600',
      bgGradient: 'from-primary-50 to-white',
      borderColor: 'border-primary-200',
      textColor: 'text-primary-700',
      badge: 'bg-primary-500',
    },
    family: {
      label: '家庭端（C端）',
      subLabel: '用药依从追踪 · 跌倒异常预警 · 紧急联系人联动 · 居家服务工单',
      icon: <Heart className="w-7 h-7" />,
      color: 'from-elderly-500 to-elderly-400',
      bgGradient: 'from-elderly-50 to-white',
      borderColor: 'border-elderly-200',
      textColor: 'text-elderly-700',
      badge: 'bg-elderly-500',
    },
  }

  const handleQuickLogin = async (account: (typeof testAccounts)[0]) => {
    console.log('[Login] 点击一键登录:', account.name, account.username, '角色:', account.role)
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

  const roleOrder: Role[] = ['government', 'institution', 'family']

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-primary-900 flex items-center justify-center p-4 py-8">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gov-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-elderly-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 w-full max-w-7xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-2xl flex items-center justify-center border border-white/10">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-3xl font-bold text-white">智慧养老综合服务平台</h1>
              <p className="text-slate-300 text-sm">GBC 三端协同 · 以民政监管为底座</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start justify-center">
          <div className="w-full lg:w-72 bg-white/5 backdrop-blur rounded-2xl p-5 border border-white/10 text-white">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary-300" />
              平台核心能力
            </h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2 p-2.5 bg-white/5 rounded-lg">
                <Shield className="w-4 h-4 text-gov-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-gov-300 font-medium text-xs">G端·民政监管</div>
                  <div className="text-slate-400 text-xs mt-0.5">区域老龄化率、补贴发放精准度、投诉闭环率、穿透式审计</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 bg-white/5 rounded-lg">
                <Building2 className="w-4 h-4 text-primary-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-primary-300 font-medium text-xs">B端·机构管理</div>
                  <div className="text-slate-400 text-xs mt-0.5">老人数字档案、床位实时余量、护理计划执行、电子签名归档</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 bg-white/5 rounded-lg">
                <Home className="w-4 h-4 text-elderly-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-elderly-300 font-medium text-xs">C端·家庭端</div>
                  <div className="text-slate-400 text-xs mt-0.5">用药依从性、跌倒预警、紧急联系人、居家服务工单</div>
                </div>
              </div>
              <div className="flex items-start gap-2 p-2.5 bg-white/5 rounded-lg">
                <Users className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-green-300 font-medium text-xs">服务资源调度</div>
                  <div className="text-slate-400 text-xs mt-0.5">健康等级×地理位置×紧迫度三维智能匹配</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                选择身份，一键登录
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">点击下方任意账号卡片即可直接进入对应工作台，无需输入密码</p>
            </div>

            <div className="p-6">
              <div className="space-y-6">
                {roleOrder.map((role) => {
                  const cfg = roleConfig[role]
                  const accounts = testAccounts.filter((a) => a.role === role)
                  return (
                    <div key={role} className={`p-5 rounded-xl bg-gradient-to-br ${cfg.bgGradient} border-2 ${cfg.borderColor}`}>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-r ${cfg.color} text-white shadow-md shrink-0`}>
                          {cfg.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold ${cfg.textColor}`}>{cfg.label}</span>
                            <span className={`${cfg.badge} text-white text-xs px-2 py-0.5 rounded-full`}>
                              {accounts.length} 个账号
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">{cfg.subLabel}</div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {accounts.map((account) => {
                          const isLoggingIn = loggingInAccount === account.username
                          return (
                            <button
                              key={account.username}
                              type="button"
                              onClick={() => handleQuickLogin(account)}
                              disabled={isLoggingIn || loggingInAccount !== null}
                              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all group ${
                                isLoggingIn
                                  ? 'border-slate-300 bg-slate-100 opacity-70'
                                  : `border-slate-200 bg-white hover:bg-gradient-to-r hover:from-white hover:to-slate-50 hover:shadow-md hover:border-slate-400`
                              } disabled:cursor-not-allowed`}
                            >
                              <div className={`w-11 h-11 rounded-full flex items-center justify-center bg-gradient-to-r ${cfg.color} text-white shadow shrink-0`}>
                                {isLoggingIn ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <UserIcon className="w-5 h-5" />
                                )}
                              </div>
                              <div className="flex-1 text-left min-w-0">
                                <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                                  {account.name}
                                  <span className="text-xs font-normal text-slate-400 truncate">({account.username})</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5 truncate">{account.department}</div>
                              </div>
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${cfg.color} text-white transition-all ${isLoggingIn ? 'opacity-50' : 'group-hover:translate-x-0.5'} shrink-0`}>
                                {isLoggingIn ? '登录中...' : '登录'}
                                <ChevronRight className="w-3 h-3" />
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="mt-6 text-center text-xs text-slate-400 pt-4 border-t border-slate-100">
                <FileText className="w-3.5 h-3.5 inline mr-1" />
                共 {testAccounts.length} 个测试账号 · 点击即可完成账号校验、角色分流，直接进入工作台
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

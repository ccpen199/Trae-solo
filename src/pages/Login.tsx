import { useState, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DoorOpen, Phone, Lock, Eye, EyeOff, AlertTriangle, CheckCircle2,
  Shield, UserCog, Users, Home, Wrench, Building2, MapPin, Sparkles
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { api } from '@/lib/api'

interface TestAccount {
  alias: string
  phone: string
  password: string
  role: string
  desc: string
  tag: string
  icon: React.ReactNode
  color: string
}

const TEST_ACCOUNTS: TestAccount[] = [
  { alias: 'admin', phone: '13800000001', password: '123456', role: '街道管理员', desc: '全辖区数据总览与行政监管', tag: '街道级', icon: <Shield size={16} />, color: 'from-indigo-500 to-purple-600' },
  { alias: 'platform', phone: '13800000002', password: '123456', role: '社区管理员', desc: '社区业务统筹与物业监督', tag: '社区级', icon: <Building2 size={16} />, color: 'from-sky-500 to-cyan-600' },
  { alias: 'ops', phone: '13800000003', password: '123456', role: '物业管理员', desc: '设备运维、工单派单、公告发布', tag: '物业级', icon: <UserCog size={16} />, color: 'from-emerald-500 to-teal-600' },
  { alias: 'committee', phone: '13800000004', password: '123456', role: '业委会成员', desc: '财务流水查看、业主诉求收集', tag: '业委会', icon: <Users size={16} />, color: 'from-amber-500 to-orange-600' },
  { alias: 'owner', phone: '13800000005', password: '123456', role: '业主/住户', desc: '门禁开锁、报修缴费、邻里互动', tag: '业主端', icon: <Home size={16} />, color: 'from-rose-500 to-pink-600' },
  { alias: 'worker', phone: '13800000008', password: '123456', role: '维修人员', desc: '工单接单、维修反馈', tag: '维修端', icon: <Wrench size={16} />, color: 'from-violet-500 to-fuchsia-600' },
]

function classifyError(errorCode?: string) {
  switch (errorCode) {
    case 'EMPTY_CREDENTIALS':
      return { title: '请填写登录信息', icon: <AlertTriangle size={18} />, tone: 'warning', suggest: '账号和密码都不能为空，请检查输入' }
    case 'INVALID_ACCOUNT':
      return { title: '账号格式无效', icon: <AlertTriangle size={18} />, tone: 'warning', suggest: '请输入11位手机号，或从下方选择测试账号' }
    case 'USER_NOT_FOUND':
      return { title: '该账号未注册', icon: <AlertTriangle size={18} />, tone: 'error', suggest: '请确认账号是否正确，或使用下方测试账号一键登录' }
    case 'WRONG_PASSWORD':
      return { title: '密码校验失败', icon: <AlertTriangle size={18} />, tone: 'error', suggest: '密码错误。提示：所有测试账号统一密码为 123456' }
    case 'ACCOUNT_DISABLED':
      return { title: '账号已被锁定', icon: <AlertTriangle size={18} />, tone: 'error', suggest: '该账号已被管理员禁用，请联系上级恢复权限' }
    case 'SYSTEM_ERROR':
      return { title: '系统服务异常', icon: <AlertTriangle size={18} />, tone: 'error', suggest: '登录服务暂时不可用，请刷新页面后重试' }
    default:
      return { title: '登录失败', icon: <AlertTriangle size={18} />, tone: 'error', suggest: '请检查网络连接或联系技术支持' }
  }
}

export default function Login() {
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ message: string; code?: string } | null>(null)
  const [successFlash, setSuccessFlash] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()
  const location = useLocation() as any
  const redirectTo = location.state?.from || '/'

  const errorInfo = useMemo(() => error ? { ...classifyError(error.code), message: error.message } : null, [error])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!phone.trim() || !password.trim()) {
      setError({ message: '账号和密码不能为空', code: 'EMPTY_CREDENTIALS' })
      return
    }
    setLoading(true)
    try {
      const data = await api.auth.login({ phone: phone.trim(), password })
      login(data.token, data.user)
      setSuccessFlash(true)
      setTimeout(() => navigate(redirectTo, { replace: true }), 450)
    } catch (err: any) {
      setError({ message: err.message || '登录失败', code: err.errorCode })
    } finally {
      setLoading(false)
    }
  }

  const selectAccount = (acc: TestAccount) => {
    setPhone(acc.alias)
    setPassword(acc.password)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-slate-900 relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-60">
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-96 h-96 rounded-full bg-sky-500/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[28rem] h-[28rem] rounded-full bg-indigo-500/10 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-5 text-white hidden lg:block">
          <div className="mb-6 inline-flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <DoorOpen className="text-emerald-400" size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">智慧社区治理工作台</h2>
              <p className="text-slate-400 text-sm">Smart Community Governance Platform</p>
            </div>
          </div>
          <h1 className="text-4xl font-extrabold leading-tight mb-4 bg-gradient-to-r from-white via-emerald-100 to-sky-100 bg-clip-text text-transparent">
            以门禁为核心入口<br />构建社区数字治理闭环
          </h1>
          <p className="text-slate-400 text-base leading-relaxed mb-8">
            覆盖门禁通行 · 设备纳管 · 报事报修 · 邻里圈 · 物业缴费 · 公告推送 · 组织架构 · 权限矩阵 · 告警分级 · 统计报表
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: '门禁设备纳管', value: '60+ 台', icon: <DoorOpen size={18} /> },
              { label: '服务响应时效', value: '≤ 2 小时', icon: <Sparkles size={18} /> },
              { label: '四级组织架构', value: '街道→社区→物业→楼栋', icon: <MapPin size={18} /> },
              { label: '物业费收缴率', value: '87.5%', icon: <Building2 size={18} /> },
            ].map((s, i) => (
              <div key={i} className="rounded-xl bg-white/5 border border-white/10 backdrop-blur px-4 py-3">
                <div className="flex items-center gap-2 text-emerald-300 text-xs mb-1.5">{s.icon}{s.label}</div>
                <div className="text-lg font-semibold">{s.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className={`bg-white rounded-3xl shadow-2xl shadow-black/20 overflow-hidden transition-all duration-500 ${successFlash ? 'ring-4 ring-emerald-300 scale-[0.99]' : ''}`}>
            <div className="p-8 sm:p-10">
              <div className="flex items-center justify-between mb-7">
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">账号登录</h3>
                  <p className="text-slate-500 text-sm mt-1">输入手机号或账号别名进入治理工作台</p>
                </div>
                <div className="lg:hidden flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <DoorOpen size={24} />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">手机号 / 账号别名</label>
                  <div className="relative group">
                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); setError(null) }}
                      placeholder="如：admin / ops / 13800000003"
                      autoComplete="username"
                      className="w-full h-12 pl-10 pr-4 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-emerald-50/30 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">登录密码</label>
                    <span className="text-xs text-slate-400">默认密码 <code className="bg-slate-100 px-1.5 py-0.5 rounded">123456</code></span>
                  </div>
                  <div className="relative group">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null) }}
                      placeholder="请输入登录密码"
                      autoComplete="current-password"
                      className="w-full h-12 pl-10 pr-12 rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-emerald-50/30 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      tabIndex={-1}
                    >
                      {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {errorInfo && (
                  <div className={`rounded-xl p-4 flex items-start gap-3 border animate-[shake_0.4s_ease-in-out]
                    ${errorInfo.tone === 'error' ? 'bg-red-50 border-red-200 text-red-800' : ''}
                    ${errorInfo.tone === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : ''}
                  `}>
                    <div className={`mt-0.5 shrink-0 ${errorInfo.tone === 'error' ? 'text-red-500' : 'text-amber-500'}`}>{errorInfo.icon}</div>
                    <div className="min-w-0">
                      <div className="font-semibold text-sm">{errorInfo.title}</div>
                      <div className="text-[13px] mt-0.5 opacity-90">{errorInfo.message}</div>
                      <div className="text-[12px] mt-1.5 opacity-75 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 rounded-full" style={{ backgroundColor: 'currentColor' }} />
                        {errorInfo.suggest}
                      </div>
                    </div>
                  </div>
                )}

                {successFlash && (
                  <div className="rounded-xl p-4 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 animate-pulse">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <div className="font-semibold text-sm">身份验证通过，正在进入工作台...</div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || successFlash}
                  className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-60 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      身份校验中...
                    </span>
                  ) : successFlash ? (
                    <span className="inline-flex items-center gap-2"><CheckCircle2 size={18} />登录成功，正在跳转</span>
                  ) : (
                    '登 录 工 作 台'
                  )}
                </button>
              </form>

              <div className="mt-8">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-slate-200" />
                  <span className="text-xs text-slate-400 font-medium flex items-center gap-1.5">
                    <Sparkles size={12} className="text-amber-400" />
                    快捷账号 · 一键填入 · 体验全业务闭环
                  </span>
                  <div className="flex-1 h-px bg-slate-200" />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {TEST_ACCOUNTS.map((acc) => (
                    <button
                      key={acc.alias}
                      type="button"
                      onClick={() => selectAccount(acc)}
                      className={`group relative rounded-xl border border-slate-200 hover:border-transparent hover:shadow-lg hover:shadow-black/5 p-3.5 text-left transition-all ${
                        phone === acc.alias || phone === acc.phone
                          ? 'ring-2 ring-emerald-400 border-emerald-200 bg-emerald-50/60'
                          : 'hover:-translate-y-0.5'
                      }`}
                    >
                      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${acc.color} opacity-0 group-hover:opacity-[0.08] transition-opacity`} />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md bg-gradient-to-br ${acc.color} text-white`}>
                            {acc.icon}
                          </span>
                          <span className="text-sm font-bold text-slate-800">{acc.role}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] mb-2">
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono">{acc.alias} / {acc.password}</span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">{acc.tag}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 leading-snug line-clamp-2">{acc.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 flex items-start gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <Shield size={18} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="text-[12px] leading-relaxed text-slate-500">
                  <div className="font-medium text-slate-600 mb-0.5">登录即表示同意《社区治理平台服务协议》</div>
                  系统已启用数据加密传输（HTTPS）与令牌双因素验证，操作日志全程可追溯。业务咨询：
                  <span className="font-mono text-slate-700 mx-1">400-888-0101</span>
                </div>
              </div>
            </div>
          </div>
          <p className="text-center text-slate-500 text-xs mt-6">© 2026 智慧社区数字治理平台 · v2.6.0</p>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  )
}

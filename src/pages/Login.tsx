import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Droplets,
  Shield,
  Wrench,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  X,
  Lock,
  Smartphone,
  ArrowRight,
  UserPlus,
} from "lucide-react"
import { useStore } from "@/store"
import { apiFetch } from "@/lib/api"
import type { UserRole } from "@/types"

const roles: {
  label: string
  value: UserRole
  icon: React.ElementType
  desc: string
  color: string
  demoPhone: string
}[] = [
  {
    label: "学生",
    value: "student",
    icon: Droplets,
    desc: "扫码取水 · 账单充值",
    color: "from-blue-500 to-cyan-500",
    demoPhone: "13800001111",
  },
  {
    label: "运维方",
    value: "operator",
    icon: Wrench,
    desc: "设备监控 · 远程管控",
    color: "from-orange-500 to-amber-500",
    demoPhone: "13800002222",
  },
  {
    label: "投资商",
    value: "investor",
    icon: TrendingUp,
    desc: "数据总览 · ROI看板",
    color: "from-emerald-500 to-teal-500",
    demoPhone: "13800003333",
  },
]

const roleRoutes: Record<UserRole, string> = {
  student: "/student",
  operator: "/operator",
  investor: "/investor",
}

const demoCredentials: Record<string, { role: UserRole; phone: string; passwords: string[]; label: string }> = {
  student: { role: "student", phone: "13800001111", passwords: ["123456", "User@123", "Test@123"], label: "学生演示账号" },
  test: { role: "student", phone: "13800001111", passwords: ["123456", "Test@123"], label: "学生测试账号" },
  admin: { role: "operator", phone: "13800002222", passwords: ["123456", "Admin@123"], label: "运维管理员" },
  ops: { role: "operator", phone: "13800002222", passwords: ["123456", "Ops@123"], label: "运维账号" },
  platform: { role: "investor", phone: "13800003333", passwords: ["123456", "Platform@123"], label: "投资商平台账号" },
  investor: { role: "investor", phone: "13800003333", passwords: ["123456", "Platform@123"], label: "投资商演示账号" },
}

const CORRECT_CODE = "123456"

const getDemoCredential = (value: string) => demoCredentials[value.trim().toLowerCase()]

export default function Login() {
  const navigate = useNavigate()
  const login = useStore((s) => s.login)
  const isLoggedIn = useStore((s) => s.isLoggedIn)
  const currentRole = useStore((s) => s.currentUser?.role)
  const [authMode, setAuthMode] = useState<"login" | "register">("login")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [role, setRole] = useState<UserRole>("student")
  const [countdown, setCountdown] = useState(0)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [codeSent, setCodeSent] = useState(false)

  const activeRole = roles.find((r) => r.value === role)!

  useEffect(() => {
    try {
      const token = localStorage.getItem("wateriot-token")
      const role = localStorage.getItem("wateriot-role")
      if (token && role && ["student", "operator", "investor"].includes(role)) {
        window.location.href = `/${role}`
        return
      }
    } catch (e) {
      // ignore
    }
    if (isLoggedIn && currentRole) {
      window.location.href = roleRoutes[currentRole]
    }
  }, [isLoggedIn, currentRole])

  const goToRole = async (targetRole: UserRole, targetPhone: string, mode: "login" | "register" = authMode) => {
    if (loading) return
    setLoading(true)
    setError("")
    let token = `mock-token-${targetRole}`
    try {
      const response = await apiFetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ account: targetPhone, phone: targetPhone, role: targetRole, code: CORRECT_CODE }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || `${mode === "register" ? "注册" : "登录"}服务暂不可用`)
      }
      if (payload?.token) {
        token = payload.token
      }
    } catch (err) {
      console.warn("认证服务暂不可用，已使用本地演示会话继续进入工作台", err)
    }
    localStorage.setItem("wateriot-token", token)
    login(targetPhone, targetRole)
    const target = roleRoutes[targetRole]
    window.location.href = target
  }

  const startCountdown = () => {
    setCodeSent(true)
    setCountdown(60)
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer)
          return 0
        }
        return c - 1
      })
    }, 1000)
  }

  const validatePhone = (value: string): string | null => {
    const trimmed = value.trim().toLowerCase()
    if (!trimmed) return "请输入手机号码"
    if (getDemoCredential(trimmed)) return null
    if (/^[a-z][\w.-]*$/i.test(trimmed)) {
      return "测试账号不存在，请使用 admin / ops / platform / student"
    }
    if (value.length !== 11 || !/^1[3-9]\d{9}$/.test(value)) {
      return "请输入正确的11位手机号"
    }
    return null
  }

  const validateCode = (value: string, account?: { passwords: string[] }): string | null => {
    if (!value.trim()) return "请输入验证码"
    if (value.length < 4) return "验证码至少4位"
    const validValues = account?.passwords ?? [CORRECT_CODE]
    if (!validValues.includes(value)) return "验证码或测试密码错误，请使用 123456"
    return null
  }

  const handleGetCode = () => {
    const err = validatePhone(phone)
    if (err) {
      setError(err)
      return
    }
    setError("")
    startCountdown()
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    const account = getDemoCredential(phone)
    const phoneErr = validatePhone(phone)
    if (phoneErr) {
      setError(phoneErr)
      return
    }
    const codeErr = validateCode(code, account)
    if (codeErr) {
      setError(codeErr)
      return
    }
    void goToRole(account?.role ?? role, account?.phone ?? phone.trim())
  }

  const handleDemoLogin = (demoRole: UserRole) => {
    if (loading) return
    const demo = roles.find((r) => r.value === demoRole)!
    setLoading(true)
    setError("")
    setRole(demoRole)
    setPhone(demo.demoPhone)
    setCode(CORRECT_CODE)
    localStorage.setItem("wateriot-token", `mock-token-${demoRole}`)
    localStorage.setItem("wateriot-role", demoRole)
    localStorage.setItem("wateriot-phone", demo.demoPhone)
    login(demo.demoPhone, demoRole)
    const target = roleRoutes[demoRole]
    window.location.href = target
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0A2E3C] via-[#0D4A5C] to-[#081F29] px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/5 -left-20 w-[500px] h-[500px] bg-[#FF6B35] rounded-full blur-[150px]" />
        <div className="absolute bottom-1/5 -right-20 w-[400px] h-[400px] bg-[#0D8ABC] rounded-full blur-[130px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
          <div className={`h-1.5 bg-gradient-to-r ${activeRole.color}`} />

          <div className="p-7">
            <div className="flex flex-col items-center mb-7">
              <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${activeRole.color} flex items-center justify-center mb-3 shadow-lg`}>
                <activeRole.icon className="w-8 h-8 text-white" strokeWidth={1.8} />
              </div>
              <h1 className="text-xl font-bold text-[#0A2E3C] tracking-tight">
                校园直饮水IoT服务平台
              </h1>
              <p className="text-xs text-gray-400 mt-1">{activeRole.desc}</p>
              <p className="text-[10px] text-gray-400 mt-2">
                测试账号：admin / 123456 · ops / 123456 · platform / 123456
              </p>
            </div>

            <div role="tablist" aria-label="认证模式" className="mb-5 grid grid-cols-2 rounded-xl bg-gray-100 p-1 text-xs font-semibold text-gray-500">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "login"}
                onClick={() => {
                  setAuthMode("login")
                  setError("")
                }}
                className={`rounded-lg py-2 transition-all ${authMode === "login" ? "bg-white text-[#0A2E3C] shadow-sm" : "hover:text-gray-700"}`}
              >
                登录
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "register"}
                onClick={() => {
                  setAuthMode("register")
                  setError("")
                }}
                className={`rounded-lg py-2 transition-all ${authMode === "register" ? "bg-white text-[#0A2E3C] shadow-sm" : "hover:text-gray-700"}`}
              >
                注册体验账号
              </button>
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, y: 0, height: "auto", marginBottom: 16 }}
                  exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
                  className="flex items-start gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3.5 py-2.5"
                >
                  <AlertCircle className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-red-700">登录失败</p>
                    <p className="text-[11px] text-red-500 mt-0.5 break-words">{error}</p>
                  </div>
                  <button onClick={() => setError("")} className="shrink-0">
                    <X className="w-3.5 h-3.5 text-red-400 hover:text-red-600" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="mb-5">
              <label className="text-[11px] font-medium text-gray-500 mb-2 block">选择身份</label>
              <div className="grid grid-cols-3 gap-1.5">
                {roles.map((r) => {
                  const Icon = r.icon
                  const isActive = role === r.value
                  return (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => {
                        setRole(r.value)
                        setError("")
                      }}
                      className={`flex flex-col items-center py-2.5 px-1.5 rounded-lg text-[11px] font-medium transition-all ${
                        isActive
                          ? `bg-gradient-to-br ${r.color} text-white shadow-md scale-[1.02]`
                          : "bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                      }`}
                    >
                      <Icon className="w-4 h-4 mb-1" strokeWidth={isActive ? 2 : 1.5} />
                      {r.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">
                  {authMode === "register" ? "注册手机号码" : "手机号码"}
                </label>
                <div className="flex gap-2">
                  <span className="shrink-0 px-3 py-2.5 bg-gray-50 rounded-lg text-xs text-[#0A2E3C] font-semibold border border-gray-200 flex items-center">
                    +86
                  </span>
                  <div className="flex-1 relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="text"
                      name="account"
                      autoComplete="username"
                      placeholder="请输入手机号或账号"
                      value={phone}
                      onChange={(e) => {
                        setPhone(e.target.value)
                        setError("")
                      }}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0A2E3C] focus:ring-2 focus:ring-[#0A2E3C]/10 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-gray-500 mb-1.5 block">验证码</label>
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input
                      type="password"
                      name="password"
                      autoComplete="current-password"
                      placeholder="验证码或测试密码"
                      value={code}
                      onChange={(e) => {
                        const val = e.target.value.slice(0, 24)
                        setCode(val)
                        setError("")
                      }}
                      className="w-full pl-9 pr-3 py-2.5 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#0A2E3C] focus:ring-2 focus:ring-[#0A2E3C]/10 transition-all tracking-widest font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleGetCode}
                    disabled={countdown > 0 || !phone.trim()}
                    className="shrink-0 px-4 py-2.5 bg-[#0A2E3C] text-white rounded-lg text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-all hover:bg-[#0D3D4F] whitespace-nowrap"
                  >
                    {countdown > 0 ? `${countdown}s` : codeSent ? "重发" : "获取验证码"}
                  </button>
                </div>
                {codeSent && !error && (
                  <p className="text-[10px] text-emerald-500 mt-1 ml-0.5 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    测试验证码：123456
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 mt-2 ${
                  loading
                    ? "bg-gray-400"
                    : `bg-gradient-to-r ${activeRole.color} hover:shadow-lg hover:shadow-black/10 active:scale-[0.98]`
                } disabled:cursor-not-allowed`}
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {authMode === "register" ? "注册中..." : "登录中..."}
                  </>
                ) : (
                  <>
                    {authMode === "register" ? <UserPlus className="w-4 h-4" strokeWidth={1.8} /> : <Shield className="w-4 h-4" strokeWidth={1.8} />}
                    {authMode === "register" ? "注册并进入" : "登录并进入"}{activeRole.label}工作台
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-7">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-100" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-[10px] text-gray-400">快速体验 · 点击直接进入</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-3 gap-2">
                {roles.map((r) => {
                  const Icon = r.icon
                  return (
                    <button
                      type="button"
                      key={r.value}
                      onClick={() => handleDemoLogin(r.value)}
                      disabled={loading}
                      className="flex flex-col items-center gap-1 py-3 px-1.5 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all disabled:opacity-50 group"
                    >
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${r.color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}>
                        <Icon className="w-4 h-4 text-white" strokeWidth={2} />
                      </div>
                      <span className="text-[11px] font-medium text-gray-600">演示{r.label}</span>
                      <span className="text-[9px] text-gray-400">一键进入</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="px-7 py-3 bg-gray-50 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 text-center leading-relaxed">
              登录即同意《用户协议》《隐私政策》· 平台采用 AES-256 加密
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

import { useState, useEffect, useCallback } from "react"
import { useNavigate, Link, useLocation } from "react-router-dom"
import {
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  Briefcase,
  MessageCircle,
  ShieldAlert,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useToast } from "@/components/ui/Toast"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import type { UserRole } from "@shared/types"
import { cn } from "@/lib/utils"

const roleNames: Record<UserRole, string> = {
  artist: "艺人/模特",
  agency_admin: "经纪公司",
  company_hr: "企业HR",
  admin: "系统管理员",
  platform: "平台运营",
  ops: "运维人员",
}

interface RoleOption {
  value: UserRole
  label: string
  description: string
  iconBg: string
  icon: React.ReactNode
  testAccount: string
  testPassword: string
  isAdmin?: boolean
}

const roleOptions: RoleOption[] = [
  {
    value: "artist",
    label: "艺人/模特",
    description: "展示个人作品，获得更多机会",
    iconBg: "from-rose-500 to-rose-400",
    icon: <User className="w-6 h-6" />,
    testAccount: "artist@example.com",
    testPassword: "password123",
  },
  {
    value: "agency_admin",
    label: "经纪公司",
    description: "管理旗下艺人，对接商业合作",
    iconBg: "from-sapphire-500 to-sapphire-400",
    icon: <Building2 className="w-6 h-6" />,
    testAccount: "admin@xingyao.com",
    testPassword: "password123",
  },
  {
    value: "company_hr",
    label: "企业HR",
    description: "发布招聘需求，寻找合适人才",
    iconBg: "from-emerald-500 to-emerald-400",
    icon: <Briefcase className="w-6 h-6" />,
    testAccount: "hr@luxe.com",
    testPassword: "password123",
  },
]

const adminRoleOptions: RoleOption[] = [
  {
    value: "admin",
    label: "系统管理员",
    description: "平台管理、用户审核、数据统计",
    iconBg: "from-purple-500 to-purple-400",
    icon: <ShieldAlert className="w-6 h-6" />,
    testAccount: "admin@talenthub.com",
    testPassword: "admin123",
    isAdmin: true,
  },
  {
    value: "platform",
    label: "平台运营",
    description: "内容运营、活动管理、用户增长",
    iconBg: "from-amber-500 to-amber-400",
    icon: <ShieldAlert className="w-6 h-6" />,
    testAccount: "platform@talenthub.com",
    testPassword: "platform123",
    isAdmin: true,
  },
  {
    value: "ops",
    label: "运维人员",
    description: "系统维护、监控告警、故障处理",
    iconBg: "from-cyan-500 to-cyan-400",
    icon: <ShieldAlert className="w-6 h-6" />,
    testAccount: "ops@talenthub.com",
    testPassword: "ops123",
    isAdmin: true,
  },
]

type FormMode = "login" | "register"
type FieldErrors = Record<string, string>

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register: registerUser, isLoading, error, clearError, isAuthenticated } = useAuthStore()
  const toast = useToast()

  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname
  const redirectTo = from && from !== "/" ? from : "/dashboard"

  // Form state
  const [mode, setMode] = useState<FormMode>("login")
  const [showAdminOptions, setShowAdminOptions] = useState(false)
  const [showTestAccounts, setShowTestAccounts] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Field values (controlled)
  const [role, setRole] = useState<UserRole>("artist")
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [agreeTerms, setAgreeTerms] = useState(false)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitCount, setSubmitCount] = useState(0)
  const [localSubmitting, setLocalSubmitting] = useState(false)

  // 如果用户已登录，直接跳转到首页
  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true })
    }
  }, [isAuthenticated, navigate, redirectTo])

  useEffect(() => {
    if (error) {
      toast.error("登录失败", error)
      setTimeout(() => clearError(), 100)
    }
  }, [error, toast, clearError])

  const validateEmailOrPhone = (val: string): string => {
    if (!val.trim()) return "请输入邮箱或手机号"
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())
    const isPhone = /^1[3-9]\d{9}$/.test(val.trim())
    if (!isEmail && !isPhone) return "请输入正确的邮箱或手机号（11位手机号）"
    return ""
  }

  const validatePassword = (val: string): string => {
    if (!val) return "请输入密码"
    if (val.length < 6) return "密码至少6位"
    return ""
  }

  const validateForm = (): boolean => {
    const newErrors: FieldErrors = {}
    const accountError = validateEmailOrPhone(account)
    if (accountError) newErrors.account = accountError
    const passwordError = validatePassword(password)
    if (passwordError) newErrors.password = passwordError
    if (mode === "register") {
      if (!confirmPassword) newErrors.confirmPassword = "请确认密码"
      else if (confirmPassword !== password) newErrors.confirmPassword = "两次输入的密码不一致"
      if (!agreeTerms) newErrors.agreeTerms = "请同意服务条款和隐私政策"
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim())

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (localSubmitting || isLoading) return
    if (!validateForm()) {
      setSubmitCount((c) => c + 1)
      return
    }

    setSubmitCount((c) => c + 1)
    setLocalSubmitting(true)

    const email = isEmail(account) ? account.trim() : ""
    const phone = isEmail(account) ? "" : account.trim()

    try {
      if (mode === "login") {
        toast.info("登录中...", "正在验证您的身份")
        const success = await login({ email, phone, password, role })
        if (success) {
          toast.success("登录成功", `欢迎回来，${roleNames[role]}！正在跳转工作台...`)
          setTimeout(() => {
            navigate(redirectTo, { replace: true })
          }, 200)
        }
      } else {
        toast.info("注册中...", "正在创建您的账号")
        const success = await registerUser({ email, phone, role, password })
        if (success) {
          toast.success("注册成功", "您的账号已创建，正在跳转...")
          setTimeout(() => {
            navigate("/dashboard")
          }, 600)
        }
      }
    } finally {
      setLocalSubmitting(false)
    }
  }, [mode, account, password, confirmPassword, agreeTerms, role, login, registerUser, navigate, redirectTo, toast, localSubmitting, isLoading])

  const handleRoleSelect = (value: UserRole) => {
    setRole(value)
    setErrors((prev) => {
      const p = { ...prev }
      delete p.role
      return p
    })
  }

  const fillTestAccount = (opt: RoleOption) => {
    setAccount(opt.testAccount)
    setPassword(opt.testPassword)
    setRole(opt.value)
    setErrors({})
    toast.info("已填充测试账号", `账号：${opt.testAccount}\n角色：${roleNames[opt.value]}\n请点击"登录"按钮继续`)
  }

  const displayOptions = showAdminOptions ? [...roleOptions, ...adminRoleOptions] : roleOptions
  const submitting = isLoading || localSubmitting
  const allRoleOptions = [...roleOptions, ...adminRoleOptions]

  const inputClass = (field: string, hasError: boolean) =>
    cn(
      "w-full bg-midnight-900/60 border-2 rounded-xl px-4 pt-5 pb-2 text-white placeholder-transparent transition-all duration-300",
      "focus:outline-none focus:ring-0",
      hasError
        ? "border-red-500 focus:border-red-500"
        : "border-midnight-700 focus:border-rose-500 bg-midnight-900/60"
    )

  const labelClass = (fieldVal: string) =>
    cn(
      "absolute left-4 transition-all duration-300 pointer-events-none z-10",
      fieldVal ? "top-2 text-xs text-midnight-400" : "top-4 text-base text-midnight-400"
    )

  return (
    <AuthLayout>
      <Card variant="glass">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            <span className="text-gradient">欢迎回来</span>
          </CardTitle>
          <CardDescription>登录您的账号，开启演艺之旅</CardDescription>
        </CardHeader>

        <CardContent>
          {/* 模式切换 Tabs */}
          <div className="flex mb-6 p-1 rounded-xl bg-midnight-800/50">
            <button
              type="button"
              onClick={() => {
                setMode("login")
                setErrors({})
                clearError()
              }}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                mode === "login"
                  ? "bg-gradient-primary text-white shadow-lg"
                  : "text-midnight-400 hover:text-white"
              )}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("register")
                setErrors({})
                clearError()
              }}
              className={cn(
                "flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                mode === "register"
                  ? "bg-gradient-primary text-white shadow-lg"
                  : "text-midnight-400 hover:text-white"
              )}
            >
              注册
            </button>
          </div>

          {/* 原生 FORM 开始 */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* 角色选择 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-midnight-200">选择角色</label>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => setShowAdminOptions(!showAdminOptions)}
                    className={cn(
                      "flex items-center gap-1 text-xs px-2 py-1 rounded-lg transition-colors",
                      showAdminOptions
                        ? "bg-sapphire-500/20 text-sapphire-300"
                        : "text-midnight-400 hover:text-white"
                    )}
                  >
                    <ShieldAlert className="w-3 h-3" />
                    <span>{showAdminOptions ? "隐藏管理员" : "管理员入口"}</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                {displayOptions.map((option, index) => (
                  <div
                    key={`${option.value}-${index}`}
                    className={cn(
                      "relative overflow-hidden transition-all duration-300",
                      showAdminOptions && option.isAdmin && "animate-fade-in"
                    )}
                    style={{ animationDelay: `${option.isAdmin ? (index - roleOptions.length) * 50 : 0}ms` }}
                  >
                    <button
                      type="button"
                      onClick={() => handleRoleSelect(option.value)}
                      className={cn(
                        "w-full flex items-start gap-4 p-4 rounded-xl border-2 text-left transition-all duration-300",
                        role === option.value
                          ? "border-rose-500 bg-rose-500/10 shadow-[0_0_30px_rgba(233,69,96,0.15)]"
                          : "border-midnight-700 bg-midnight-900/30 hover:border-rose-500/50 hover:bg-midnight-800/50"
                      )}
                    >
                      <div
                        className={cn(
                          "shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-white bg-gradient-to-br",
                          option.iconBg
                        )}
                      >
                        {option.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{option.label}</span>
                          {option.isAdmin && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              管理员
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-midnight-400 mt-0.5">{option.description}</div>
                      </div>
                      <div
                        className={cn(
                          "mt-1 shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300",
                          role === option.value
                            ? "border-rose-500 bg-gradient-primary"
                            : "border-midnight-600 bg-midnight-900/50"
                        )}
                      >
                        {role === option.value && (
                          <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={3} />
                        )}
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* 账号输入 */}
            <div className="relative">
              <div className="relative">
                <input
                  type="text"
                  autoComplete="username"
                  value={account}
                  onChange={(e) => {
                    setAccount(e.target.value)
                    if (submitCount > 0) {
                      const err = validateEmailOrPhone(e.target.value)
                      setErrors((prev) => ({ ...prev, account: err }))
                    }
                  }}
                  placeholder="邮箱或手机号"
                  className={cn(inputClass("account", !!errors.account), "pl-12 pr-11")}
                />
                <label className={labelClass(account)} style={{ left: "3rem" }}>
                  邮箱或手机号
                </label>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-400">
                  {/^1[3-9]\d{9}$/.test(account.trim()) && !isEmail(account) ? (
                    <Phone className="w-5 h-5" />
                  ) : (
                    <Mail className="w-5 h-5" />
                  )}
                </span>
                {account && !errors.account && submitCount > 0 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                  </span>
                )}
                {errors.account && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400">
                    <XCircle className="w-5 h-5" />
                  </span>
                )}
              </div>
              {errors.account && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.account}
                </p>
              )}
            </div>

            {/* 密码输入 */}
            <div className="relative">
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    if (submitCount > 0) {
                      const err = validatePassword(e.target.value)
                      setErrors((prev) => ({ ...prev, password: err }))
                    }
                  }}
                  placeholder="密码"
                  className={cn(inputClass("password", !!errors.password), "pl-12 pr-12")}
                />
                <label className={labelClass(password)} style={{ left: "3rem" }}>
                  密码
                </label>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-400">
                  <Lock className="w-5 h-5" />
                </span>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-midnight-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
            </div>

            {/* 确认密码（注册模式） */}
            {mode === "register" && (
              <div className="relative">
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value)
                      if (submitCount > 0) {
                        let err = ""
                        if (!e.target.value) err = "请确认密码"
                        else if (e.target.value !== password) err = "两次输入的密码不一致"
                        setErrors((prev) => ({ ...prev, confirmPassword: err }))
                      }
                    }}
                    placeholder="确认密码"
                    className={cn(inputClass("confirmPassword", !!errors.confirmPassword), "pl-12 pr-12")}
                  />
                  <label className={labelClass(confirmPassword)} style={{ left: "3rem" }}>
                    确认密码
                  </label>
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-midnight-400">
                    <Lock className="w-5 h-5" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-midnight-400 hover:text-white transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>
            )}

            {/* 辅助行 */}
            <div className="flex items-center justify-between">
              {mode === "login" ? (
                <>
                  <label className="flex items-center gap-2 cursor-pointer select-none group">
                    <div
                      onClick={() => setRememberMe(!rememberMe)}
                      className={cn(
                        "w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                        rememberMe
                          ? "border-rose-500 bg-gradient-primary"
                          : "border-midnight-600 bg-midnight-900/50 group-hover:border-rose-500/50"
                      )}
                    >
                      {rememberMe && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span className="text-sm text-midnight-300 group-hover:text-white transition-colors">
                      记住我
                    </span>
                  </label>
                  <Link
                    to="/register"
                    className="text-sm text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    需要新账号？
                  </Link>
                </>
              ) : (
                <label className="flex items-start gap-2 cursor-pointer select-none group">
                  <div
                    onClick={() => setAgreeTerms(!agreeTerms)}
                    className={cn(
                      "mt-0.5 shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200",
                      agreeTerms
                        ? "border-rose-500 bg-gradient-primary"
                        : "border-midnight-600 bg-midnight-900/50 group-hover:border-rose-500/50"
                    )}
                  >
                    {agreeTerms && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
                  </div>
                  <input
                    type="checkbox"
                    className="hidden"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <span className="text-sm text-midnight-300 group-hover:text-white transition-colors">
                    我已阅读并同意{" "}
                    <Link to="/terms" className="text-rose-400 hover:text-rose-300">
                      服务条款
                    </Link>{" "}
                    和{" "}
                    <Link to="/privacy" className="text-rose-400 hover:text-rose-300">
                      隐私政策
                    </Link>
                  </span>
                </label>
              )}
            </div>
            {errors.agreeTerms && (
              <p className="text-xs text-red-400 flex items-center gap-1 -mt-3">
                <AlertCircle className="w-3 h-3" />
                {errors.agreeTerms}
              </p>
            )}

            {/* 测试账号面板 */}
            {mode === "login" && (
              <div className="-mt-2">
                <button
                  type="button"
                  onClick={() => setShowTestAccounts(!showTestAccounts)}
                  className="w-full flex items-center justify-center gap-1 text-xs text-midnight-400 hover:text-white transition-colors py-1"
                >
                  <AlertCircle className="w-3 h-3" />
                  <span>{showTestAccounts ? "隐藏测试账号" : "查看测试账号一键填充"}</span>
                  {showTestAccounts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>

                {showTestAccounts && (
                  <div className="bg-midnight-800/50 rounded-xl p-4 space-y-2 border border-midnight-700/50 animate-fade-in">
                    <p className="text-xs text-midnight-400 mb-3 font-medium">点击下方任意账号快速填充并进入对应角色工作台：</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {allRoleOptions.map((opt, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => fillTestAccount(opt)}
                          className="group text-left p-3 rounded-xl border border-midnight-700/50 bg-midnight-900/30 hover:border-rose-500/50 hover:bg-midnight-800/60 transition-all duration-200"
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={cn(
                                "w-7 h-7 rounded-lg flex items-center justify-center text-white bg-gradient-to-br",
                                opt.iconBg
                              )}
                            >
                              {opt.icon}
                            </span>
                            <span className="font-medium text-white text-sm group-hover:text-rose-400 transition-colors">
                              {opt.label}
                            </span>
                            {opt.isAdmin && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                                管理
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-midnight-400 ml-9 space-y-0.5">
                            <div className="font-mono">账号：{opt.testAccount}</div>
                            <div className="font-mono">密码：{opt.testPassword}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 提交按钮 — type="submit" 原生表单提交 */}
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "w-full relative overflow-hidden rounded-xl py-3.5 text-white font-medium text-lg",
                "bg-gradient-primary shadow-[0_8px_30px_rgba(233,69,96,0.35)]",
                "transition-all duration-300 ease-out-expo",
                "hover:-translate-y-0.5 hover:shadow-[0_12px_35px_rgba(233,69,96,0.45)]",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-[0_8px_30px_rgba(233,69,96,0.35)]",
                "active:translate-y-0 active:shadow-[0_4px_20px_rgba(233,69,96,0.3)]"
              )}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                {submitting
                  ? mode === "login"
                    ? "登录中..."
                    : "注册中..."
                  : mode === "login"
                  ? "登录"
                  : "注册"}
              </span>
            </button>

            {/* 其他登录方式 */}
            {mode === "login" && (
              <>
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-midnight-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-midnight-800/0 text-midnight-400">其他登录方式</span>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    type="button"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-midnight-700 bg-midnight-900/30 text-white hover:border-green-500/50 hover:bg-midnight-800/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <MessageCircle className="w-5 h-5" />
                    微信
                  </button>
                  <button
                    type="button"
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl border-2 border-midnight-700 bg-midnight-900/30 text-white hover:border-red-500/50 hover:bg-midnight-800/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.573h.014zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.57-.18-.405-.652.375-1.076.415-2.001.006-2.68-.769-1.28-2.833-1.185-5.163-.033 0 0-.742.334-.555-.271.345-1.17.262-2.155-.272-2.68-.6-2.542-2.992-2.742-5.299-.378-1.126 1.157-1.519 2.884-1.047 4.707.158.615.171 1.139-.062 1.433-.39.488-1.505.786-2.938.786-1.877 0-3.375-.401-4.259-1.094-.388-.301-.876-.196-1.093.202-.345.633-.142 1.552.552 2.41 1.353 1.676 4.059 2.576 7.371 2.576 1.896 0 3.583-.264 4.937-.756.452-.165.776-.19 1.044.093.561.595 1.587 1.387 3.155 1.387 1.162 0 2.033-.416 2.567-.972.18-.187.15-.46-.066-.606-.22-.148-.565-.243-.98-.356z" />
                    </svg>
                    微博
                  </button>
                </div>
              </>
            )}

            {/* 底部提示 */}
            <div className="pt-2 text-center">
              {mode === "login" ? (
                <p className="text-sm text-midnight-400">
                  还没有账号？
                  <button
                    type="button"
                    onClick={() => {
                      setMode("register")
                      setErrors({})
                    }}
                    className="ml-1 text-rose-400 hover:text-rose-300 font-medium transition-colors"
                  >
                    立即注册
                  </button>
                </p>
              ) : (
                <p className="text-sm text-midnight-400">
                  已有账号？
                  <button
                    type="button"
                    onClick={() => {
                      setMode("login")
                      setErrors({})
                    }}
                    className="ml-1 text-rose-400 hover:text-rose-300 font-medium transition-colors"
                  >
                    立即登录
                  </button>
                </p>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default Login

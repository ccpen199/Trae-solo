import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
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
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { useToast } from "@/components/ui/Toast"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import { Badge } from "@/components/ui/Badge"
import type { UserRole } from "@shared/types"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  account: z.string().min(1, "请输入邮箱或手机号"),
  password: z.string().min(6, "密码至少6位"),
  rememberMe: z.boolean().optional(),
  role: z.enum(["artist", "agency_admin", "company_hr", "admin", "platform", "ops"], {
    required_error: "请选择角色",
  }),
})

const registerSchema = z.object({
  account: z.string().min(1, "请输入邮箱或手机号"),
  password: z.string().min(6, "密码至少6位"),
  confirmPassword: z.string().min(6, "请确认密码"),
  role: z.enum(["artist", "agency_admin", "company_hr"], {
    required_error: "请选择角色",
  }),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "请同意服务条款和隐私政策",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
})

type LoginFormValues = z.infer<typeof loginSchema>
type RegisterFormValues = z.infer<typeof registerSchema>

const roleOptions = [
  {
    value: "artist" as UserRole,
    label: "艺人/模特",
    description: "展示个人作品，获得更多机会",
    icon: <User className="w-6 h-6" />,
    testAccount: "artist@example.com",
    testPassword: "password123",
  },
  {
    value: "agency_admin" as UserRole,
    label: "经纪公司",
    description: "管理旗下艺人，对接商业合作",
    icon: <Building2 className="w-6 h-6" />,
    testAccount: "admin@xingyao.com",
    testPassword: "password123",
  },
  {
    value: "company_hr" as UserRole,
    label: "企业HR",
    description: "发布招聘需求，寻找合适人才",
    icon: <Briefcase className="w-6 h-6" />,
    testAccount: "hr@luxe.com",
    testPassword: "password123",
  },
]

const adminRoleOptions = [
  {
    value: "admin" as UserRole,
    label: "系统管理员",
    description: "平台管理、用户审核、数据统计",
    icon: <ShieldAlert className="w-6 h-6" />,
    testAccount: "admin@talenthub.com",
    testPassword: "admin123",
  },
  {
    value: "admin" as UserRole,
    label: "平台运营",
    description: "内容运营、活动管理、用户增长",
    icon: <ShieldAlert className="w-6 h-6" />,
    testAccount: "platform@talenthub.com",
    testPassword: "platform123",
  },
  {
    value: "admin" as UserRole,
    label: "运维人员",
    description: "系统维护、监控告警、故障处理",
    icon: <ShieldAlert className="w-6 h-6" />,
    testAccount: "ops@talenthub.com",
    testPassword: "ops123",
  },
]

const roleNames: Record<UserRole, string> = {
  artist: "艺人/模特",
  agency_admin: "经纪公司",
  company_hr: "企业HR",
  admin: "系统管理员",
  platform: "平台运营",
  ops: "运维人员",
}

const Login = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, register, isLoading, error, clearError } = useAuthStore()
  const toast = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")
  const [showAdminOptions, setShowAdminOptions] = useState(false)
  const [showTestAccounts, setShowTestAccounts] = useState(false)

  const from = (location.state as any)?.from?.pathname || "/"

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLogin,
    watch: watchLogin,
    setValue: setLoginValue,
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: true,
      role: "artist",
    },
  })

  const {
    register: registerRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
    reset: resetRegister,
    setValue: setRegisterValue,
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "artist",
      agreeTerms: false,
    },
  })

  const selectedRole = watchLogin("role")

  useEffect(() => {
    if (error) {
      toast.error("登录失败", error)
      clearError()
    }
  }, [error, toast, clearError])

  const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const getAccountIcon = (value: string) => {
    return isEmail(value) ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />
  }

  const onLogin = async (data: LoginFormValues) => {
    const email = isEmail(data.account) ? data.account : ""
    const phone = isEmail(data.account) ? "" : data.account

    const success = await login({
      email,
      phone,
      password: data.password,
      role: data.role,
    })

    if (success) {
      toast.success("登录成功", `欢迎回来，${roleNames[data.role]}！`)
      setTimeout(() => {
        navigate(from, { replace: true })
      }, 500)
    }
  }

  const onRegister = async (data: RegisterFormValues) => {
    const email = isEmail(data.account) ? data.account : ""
    const phone = isEmail(data.account) ? "" : data.account

    const success = await register({
      email,
      phone,
      role: data.role,
      password: data.password,
    })

    if (success) {
      toast.success("注册成功", "您的账号已创建，正在跳转...")
      setTimeout(() => {
        navigate("/")
      }, 800)
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "register")
    clearError()
    if (value === "login") {
      resetRegister()
    } else {
      resetLogin()
    }
  }

  const fillTestAccount = (account: string, password: string, role: UserRole) => {
    setLoginValue("account", account, { shouldValidate: true })
    setLoginValue("password", password, { shouldValidate: true })
    setLoginValue("role", role, { shouldValidate: true })
    toast.info("已填充测试账号", `账号：${account}`)
  }

  const displayOptions = showAdminOptions ? [...roleOptions, ...adminRoleOptions] : roleOptions

  return (
    <AuthLayout>
      <Card variant="glass">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">
            <span className="text-gradient">欢迎回来</span>
          </CardTitle>
          <CardDescription>
            登录您的账号，开启演艺之旅
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="login">登录</TabsTrigger>
              <TabsTrigger value="register">注册</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLoginSubmit(onLogin)} className="space-y-5">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Input
                      label="选择角色"
                      error={loginErrors.role?.message}
                    />
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
                  </div>

                  <RadioGroup
                    defaultValue="artist"
                    className="grid grid-cols-1 gap-2"
                    {...registerLogin("role")}
                  >
                    {displayOptions.map((option, index) => (
                      <div
                        key={`${option.value}-${index}`}
                        className={cn(
                          "relative overflow-hidden",
                          showAdminOptions && index >= roleOptions.length && "animate-fade-in"
                        )}
                        style={{ animationDelay: `${(index - roleOptions.length) * 50}ms` }}
                      >
                        <RadioGroupItem
                          value={option.value}
                          label={
                            <div className="flex items-center gap-2">
                              <span>{option.label}</span>
                              {showAdminOptions && index >= roleOptions.length && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  管理员
                                </Badge>
                              )}
                            </div>
                          }
                          description={option.description}
                          icon={option.icon}
                        />
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <Input
                  label="邮箱或手机号"
                  placeholder="请输入邮箱或手机号"
                  leftIcon={<Mail className="w-5 h-5" />}
                  error={loginErrors.account?.message}
                  {...registerLogin("account")}
                />

                <Input
                  label="密码"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  leftIcon={<Lock className="w-5 h-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-midnight-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  error={loginErrors.password?.message}
                  {...registerLogin("password")}
                />

                <div className="flex items-center justify-between">
                  <Checkbox
                    label="记住我"
                    {...registerLogin("rememberMe")}
                  />
                  <Link
                    to="/auth/forgot-password"
                    className="text-sm text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    忘记密码？
                  </Link>
                </div>

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
                    <p className="text-xs text-midnight-400 mb-2">点击快速填充测试账号：</p>
                    {[...roleOptions, ...adminRoleOptions].map((opt, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => fillTestAccount(opt.testAccount, opt.testPassword, opt.value)}
                        className="w-full text-left p-2 rounded-lg hover:bg-midnight-700/50 transition-colors text-sm group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-white group-hover:text-rose-400 transition-colors">
                            {opt.label}
                          </span>
                          <span className="text-xs text-midnight-400 font-mono">
                            {opt.testAccount}
                          </span>
                        </div>
                        <div className="text-xs text-midnight-500 mt-0.5">
                          密码：{opt.testPassword}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={isLoading}
                >
                  {isLoading ? "登录中..." : "登录"}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-midnight-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-4 bg-midnight-800/50 text-midnight-400">
                      其他登录方式
                    </span>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <MessageCircle className="w-5 h-5" />
                    微信
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M10.098 20.323c-3.977.391-7.414-1.406-7.672-4.02-.259-2.609 2.759-5.047 6.74-5.441 3.979-.394 7.413 1.404 7.671 4.018.259 2.6-2.759 5.049-6.737 5.439l-.002.004zM9.05 17.219c-.384.616-1.208.884-1.829.602-.612-.279-.793-.991-.406-1.593.379-.595 1.176-.861 1.793-.601.622.263.82.972.442 1.592zm1.27-1.627c-.141.237-.449.353-.689.253-.236-.09-.313-.361-.177-.586.138-.227.436-.346.672-.24.239.09.315.36.18.573h.014zm.176-2.719c-1.893-.493-4.033.45-4.857 2.118-.836 1.704-.026 3.591 1.886 4.21 1.983.64 4.318-.341 5.132-2.179.8-1.793-.201-3.642-2.161-4.149zm7.563-1.224c-.346-.105-.57-.18-.405-.652.375-1.076.415-2.001.006-2.68-.769-1.28-2.833-1.185-5.163-.033 0 0-.742.334-.555-.271.345-1.17.262-2.155-.272-2.68-.6-2.542-2.992-2.742-5.299-.378-1.126 1.157-1.519 2.884-1.047 4.707.158.615.171 1.139-.062 1.433-.39.488-1.505.786-2.938.786-1.877 0-3.375-.401-4.259-1.094-.388-.301-.876-.196-1.093.202-.345.633-.142 1.552.552 2.41 1.353 1.676 4.059 2.576 7.371 2.576 1.896 0 3.583-.264 4.937-.756.452-.165.776-.19 1.044.093.561.595 1.587 1.387 3.155 1.387 1.162 0 2.033-.416 2.567-.972.18-.187.15-.46-.066-.606-.22-.148-.565-.243-.98-.356z" />
                    </svg>
                    微博
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegisterSubmit(onRegister)} className="space-y-5">
                <div className="space-y-3">
                  <Input
                    label="选择角色"
                    error={registerErrors.role?.message}
                  />
                  <RadioGroup
                    defaultValue="artist"
                    className="grid grid-cols-1 gap-2"
                    {...registerRegister("role")}
                  >
                    {roleOptions.map((option) => (
                      <RadioGroupItem
                        key={option.value}
                        value={option.value}
                        label={option.label}
                        description={option.description}
                        icon={option.icon}
                      />
                    ))}
                  </RadioGroup>
                </div>

                <Input
                  label="邮箱或手机号"
                  placeholder="请输入邮箱或手机号"
                  leftIcon={<Mail className="w-5 h-5" />}
                  error={registerErrors.account?.message}
                  {...registerRegister("account")}
                />

                <Input
                  label="密码"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码（至少6位）"
                  leftIcon={<Lock className="w-5 h-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-midnight-400 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  error={registerErrors.password?.message}
                  {...registerRegister("password")}
                />

                <Input
                  label="确认密码"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="请再次输入密码"
                  leftIcon={<Lock className="w-5 h-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-midnight-400 hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  error={registerErrors.confirmPassword?.message}
                  {...registerRegister("confirmPassword")}
                />

                <Checkbox
                  label="我已阅读并同意"
                  description={
                    <span>
                      <Link to="/terms" className="text-rose-400 hover:text-rose-300">服务条款</Link>
                      {" 和 "}
                      <Link to="/privacy" className="text-rose-400 hover:text-rose-300">隐私政策</Link>
                    </span>
                  }
                  error={registerErrors.agreeTerms?.message}
                  {...registerRegister("agreeTerms")}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={isLoading}
                >
                  {isLoading ? "注册中..." : "注册"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default Login

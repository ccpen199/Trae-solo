import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useNavigate, Link } from "react-router-dom"
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
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import type { UserRole } from "@shared/types"

const loginSchema = z.object({
  account: z.string().min(1, "请输入邮箱或手机号"),
  password: z.string().min(6, "密码至少6位"),
  rememberMe: z.boolean().optional(),
  role: z.enum(["artist", "agency_admin", "company_hr"], {
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
  },
  {
    value: "agency_admin" as UserRole,
    label: "经纪公司",
    description: "管理旗下艺人，对接商业合作",
    icon: <Building2 className="w-6 h-6" />,
  },
  {
    value: "company_hr" as UserRole,
    label: "企业HR",
    description: "发布招聘需求，寻找合适人才",
    icon: <Briefcase className="w-6 h-6" />,
  },
]

const Login = () => {
  const navigate = useNavigate()
  const { login, register, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [activeTab, setActiveTab] = useState<"login" | "register">("login")

  const {
    register: registerLogin,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
    reset: resetLogin,
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
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "artist",
      agreeTerms: false,
    },
  })

  const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const getAccountIcon = (value: string) => {
    return isEmail(value) ? <Mail className="w-5 h-5" /> : <Phone className="w-5 h-5" />
  }

  const onLogin = async (data: LoginFormValues) => {
    const email = isEmail(data.account) ? data.account : ""
    const phone = isEmail(data.account) ? "" : data.account

    const success = await login(email, data.password)
    if (success) {
      navigate("/")
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
      navigate("/")
    }
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as "login" | "register")
    if (value === "login") {
      resetRegister()
    } else {
      resetLogin()
    }
  }

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
                  <Input
                    label="选择角色"
                    error={loginErrors.role?.message}
                  />
                  <RadioGroup
                    defaultValue="artist"
                    className="grid grid-cols-1 gap-2"
                    {...registerLogin("role")}
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

                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  loading={isLoading}
                >
                  登录
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
                  >
                    <MessageCircle className="w-5 h-5" />
                    微信
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
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
                  注册
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

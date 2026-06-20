import { useState, useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
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
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Send,
  ShieldCheck,
  UserPlus,
  FileText,
} from "lucide-react"
import { useAuthStore } from "@/store/useAuthStore"
import { AuthLayout } from "@/components/layout/AuthLayout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card"
import { Input } from "@/components/ui/Input"
import { Button } from "@/components/ui/Button"
import { Checkbox } from "@/components/ui/Checkbox"
import { Progress } from "@/components/ui/Progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/RadioGroup"
import { cn } from "@/lib/utils"
import type { UserRole } from "@shared/types"

const step1Schema = z.object({
  role: z.enum(["artist", "agency_admin", "company_hr"], {
    required_error: "请选择角色",
  }),
  account: z.string().min(1, "请输入邮箱或手机号"),
  verificationCode: z.string().min(6, "验证码为6位数字").max(6, "验证码为6位数字"),
  password: z.string().min(8, "密码至少8位").regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
    "密码需包含大小写字母和数字"
  ),
  confirmPassword: z.string().min(1, "请确认密码"),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: "请同意服务条款和隐私政策",
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "两次输入的密码不一致",
  path: ["confirmPassword"],
})

const step2Schema = z.object({
  realName: z.string().min(2, "请输入真实姓名"),
  stageName: z.string().optional(),
  gender: z.enum(["male", "female", "other"], {
    required_error: "请选择性别",
  }),
  age: z.coerce.number().min(1, "请输入有效年龄").max(120, "请输入有效年龄"),
  phone: z.string().min(11, "请输入有效手机号").max(11, "请输入有效手机号"),
  email: z.string().email("请输入有效邮箱"),
  location: z.string().min(2, "请输入所在城市"),
})

const step3Schema = z.object({
  idCardNumber: z.string().min(18, "请输入18位身份证号").max(18, "请输入18位身份证号"),
  idCardFront: z.string().optional(),
  idCardBack: z.string().optional(),
  portraitPhoto: z.string().optional(),
  agreeVerification: z.boolean().refine((val) => val === true, {
    message: "请同意进行实名认证",
  }),
})

type Step1Values = z.infer<typeof step1Schema>
type Step2Values = z.infer<typeof step2Schema>
type Step3Values = z.infer<typeof step3Schema>
type RegisterFormValues = Step1Values & Step2Values & Step3Values

const steps = [
  { id: 1, title: "账户信息", icon: <UserPlus className="w-5 h-5" /> },
  { id: 2, title: "个人资料", icon: <FileText className="w-5 h-5" /> },
  { id: 3, title: "实名认证", icon: <ShieldCheck className="w-5 h-5" /> },
]

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

const genderOptions = [
  { value: "male", label: "男" },
  { value: "female", label: "女" },
  { value: "other", label: "其他" },
]

const getPasswordStrength = (password: string): { score: number; label: string; color: string } => {
  let score = 0
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[^a-zA-Z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: "弱", color: "bg-red-500" }
  if (score <= 4) return { score, label: "中", color: "bg-yellow-500" }
  return { score, label: "强", color: "bg-green-500" }
}

const Register = () => {
  const navigate = useNavigate()
  const { register: registerUser, isLoading } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [verificationCountdown, setVerificationCountdown] = useState(0)
  const [formData, setFormData] = useState<Partial<RegisterFormValues>>({})
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationDirection, setAnimationDirection] = useState<"forward" | "backward">("forward")

  const passwordStrength = getPasswordStrength(password)
  const progress = (currentStep / steps.length) * 100

  const {
    register: registerStep1,
    handleSubmit: handleStep1Submit,
    control: step1Control,
    formState: { errors: step1Errors },
    watch: watchStep1,
    reset: resetStep1,
  } = useForm<Step1Values>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      ...formData,
      role: "artist",
      agreeTerms: false,
    },
  })

  const {
    register: registerStep2,
    handleSubmit: handleStep2Submit,
    formState: { errors: step2Errors },
    watch: watchStep2,
    reset: resetStep2,
  } = useForm<Step2Values>({
    resolver: zodResolver(step2Schema),
    defaultValues: formData,
  })

  const {
    register: registerStep3,
    handleSubmit: handleStep3Submit,
    control: step3Control,
    formState: { errors: step3Errors },
    reset: resetStep3,
  } = useForm<Step3Values>({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      ...formData,
      agreeVerification: false,
    },
  })

  useEffect(() => {
    if (verificationCountdown > 0) {
      const timer = setTimeout(() => {
        setVerificationCountdown(verificationCountdown - 1)
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [verificationCountdown])

  const handleSendCode = () => {
    setVerificationCountdown(60)
  }

  const goToNextStep = (data: Partial<RegisterFormValues>) => {
    setAnimationDirection("forward")
    setIsAnimating(true)
    setTimeout(() => {
      setFormData((prev) => ({ ...prev, ...data }))
      setCurrentStep((prev) => Math.min(prev + 1, steps.length))
      setIsAnimating(false)
    }, 300)
  }

  const goToPrevStep = () => {
    setAnimationDirection("backward")
    setIsAnimating(true)
    setTimeout(() => {
      setCurrentStep((prev) => Math.max(prev - 1, 1))
      setIsAnimating(false)
    }, 300)
  }

  const onStep1Submit = (data: Step1Values) => {
    goToNextStep(data)
  }

  const onStep2Submit = (data: Step2Values) => {
    goToNextStep(data)
  }

  const onStep3Submit = async (data: Step3Values) => {
    const allData = { ...formData, ...data }
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(allData.account || "")

    const success = await registerUser({
      email: isEmail ? allData.account : allData.email,
      phone: isEmail ? allData.phone : allData.account,
      role: allData.role,
      password: allData.password,
    })

    if (success) {
      navigate("/dashboard")
    }
  }

  const handleStepClick = (stepId: number) => {
    if (stepId < currentStep) {
      setAnimationDirection("backward")
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentStep(stepId)
        setIsAnimating(false)
      }, 300)
    }
  }

  return (
    <AuthLayout>
      <Card variant="glass" className="overflow-hidden">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">
            <span className="text-gradient">创建新账户</span>
          </CardTitle>
          <CardDescription>
            只需三步，开启您的演艺之旅
          </CardDescription>
        </CardHeader>

        <div className="px-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => handleStepClick(step.id)}
                  className={cn(
                    "flex items-center gap-2 transition-all duration-300",
                    step.id <= currentStep ? "cursor-pointer" : "cursor-default"
                  )}
                  disabled={step.id > currentStep}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                      step.id < currentStep
                        ? "bg-green-500 text-white"
                        : step.id === currentStep
                        ? "bg-gradient-primary text-white shadow-glow scale-110"
                        : "bg-midnight-700 text-midnight-400"
                    )}
                  >
                    {step.id < currentStep ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      step.icon
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-sm font-medium hidden sm:block transition-colors duration-300",
                      step.id <= currentStep ? "text-white" : "text-midnight-500"
                    )}
                  >
                    {step.title}
                  </span>
                </button>
                {index < steps.length - 1 && (
                  <div className="w-12 sm:w-16 mx-2 sm:mx-4">
                    <Progress
                      value={step.id < currentStep ? 100 : 0}
                      className="h-1"
                      indicatorClassName={step.id < currentStep ? "bg-green-500" : ""}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        <CardContent className="pt-2">
          <div
            className={cn(
              "transition-all duration-300 ease-out-expo",
              isAnimating && animationDirection === "forward" && "opacity-0 translate-x-8",
              isAnimating && animationDirection === "backward" && "opacity-0 -translate-x-8"
            )}
          >
            {currentStep === 1 && (
              <form onSubmit={handleStep1Submit(onStep1Submit)} className="space-y-5 animate-fade-in">
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-midnight-200">
                    选择角色
                  </label>
                  <Controller
                    name="role"
                    control={step1Control}
                    render={({ field }) => (
                      <RadioGroup
                        value={field.value}
                        onValueChange={field.onChange}
                        className="grid grid-cols-1 gap-2"
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
                    )}
                  />
                  {step1Errors.role && (
                    <p className="text-sm text-red-400 animate-fade-in">
                      {step1Errors.role.message}
                    </p>
                  )}
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      label="邮箱或手机号"
                      placeholder="请输入邮箱或手机号"
                      leftIcon={<Mail className="w-5 h-5" />}
                      error={step1Errors.account?.message}
                      {...registerStep1("account")}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <Input
                      label="验证码"
                      placeholder="6位验证码"
                      maxLength={6}
                      error={step1Errors.verificationCode?.message}
                      {...registerStep1("verificationCode")}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="shrink-0 mt-5"
                    onClick={handleSendCode}
                    disabled={verificationCountdown > 0}
                  >
                    {verificationCountdown > 0 ? (
                      `${verificationCountdown}s`
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        发送
                      </>
                    )}
                  </Button>
                </div>

                <Input
                  label="设置密码"
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码（至少8位）"
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
                  error={step1Errors.password?.message}
                  {...registerStep1("password")}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    registerStep1("password").onChange(e)
                  }}
                />

                {password && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-midnight-400">密码强度</span>
                      <span
                        className={cn(
                          "text-xs font-medium",
                          passwordStrength.label === "弱" && "text-red-400",
                          passwordStrength.label === "中" && "text-yellow-400",
                          passwordStrength.label === "强" && "text-green-400"
                        )}
                      >
                        {passwordStrength.label}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      {[...Array(6)].map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "h-1.5 flex-1 rounded-full transition-all duration-300",
                            i < passwordStrength.score
                              ? passwordStrength.color
                              : "bg-midnight-700"
                          )}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-midnight-500">
                      建议包含大小写字母、数字和特殊字符
                    </p>
                  </div>
                )}

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
                  error={step1Errors.confirmPassword?.message}
                  {...registerStep1("confirmPassword")}
                />

                <Controller
                  name="agreeTerms"
                  control={step1Control}
                  render={({ field }) => (
                    <Checkbox
                      label="我已阅读并同意"
                      description={
                        <span>
                          <Link to="/terms" className="text-rose-400 hover:text-rose-300">服务条款</Link>
                          {" 和 "}
                          <Link to="/privacy" className="text-rose-400 hover:text-rose-300">隐私政策</Link>
                        </span>
                      }
                      error={step1Errors.agreeTerms?.message}
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    />
                  )}
                />

                <Button type="submit" size="lg" className="w-full" loading={isLoading}>
                  下一步
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            )}

            {currentStep === 2 && (
              <form onSubmit={handleStep2Submit(onStep2Submit)} className="space-y-5 animate-fade-in">
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="真实姓名"
                    placeholder="请输入真实姓名"
                    leftIcon={<User className="w-5 h-5" />}
                    error={step2Errors.realName?.message}
                    {...registerStep2("realName")}
                  />
                  <Input
                    label="艺名/昵称"
                    placeholder="可选"
                    error={step2Errors.stageName?.message}
                    {...registerStep2("stageName")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-midnight-200 mb-2">
                      性别
                    </label>
                    <div className="flex gap-3">
                      {genderOptions.map((option) => (
                        <label
                          key={option.value}
                          className={cn(
                            "flex-1 flex items-center justify-center gap-2 h-11 rounded-xl border-2 cursor-pointer",
                            "transition-all duration-300 ease-out-expo",
                            watchStep2("gender") === option.value
                              ? "border-rose-500 bg-rose-500/10 text-rose-400"
                              : "border-midnight-700 bg-midnight-900/50 text-midnight-400 hover:border-midnight-600"
                          )}
                        >
                          <input
                            type="radio"
                            value={option.value}
                            {...registerStep2("gender")}
                            className="sr-only"
                          />
                          {option.label}
                        </label>
                      ))}
                    </div>
                    {step2Errors.gender && (
                      <p className="mt-1.5 text-sm text-red-400 animate-fade-in">
                        {step2Errors.gender.message}
                      </p>
                    )}
                  </div>
                  <Input
                    label="年龄"
                    type="number"
                    placeholder="年龄"
                    error={step2Errors.age?.message}
                    {...registerStep2("age")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="手机号"
                    placeholder="请输入手机号"
                    leftIcon={<Phone className="w-5 h-5" />}
                    error={step2Errors.phone?.message}
                    {...registerStep2("phone")}
                  />
                  <Input
                    label="邮箱"
                    placeholder="请输入邮箱"
                    leftIcon={<Mail className="w-5 h-5" />}
                    error={step2Errors.email?.message}
                    {...registerStep2("email")}
                  />
                </div>

                <Input
                  label="所在城市"
                  placeholder="例如：北京市朝阳区"
                  error={step2Errors.location?.message}
                  {...registerStep2("location")}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={goToPrevStep}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    上一步
                  </Button>
                  <Button type="submit" size="lg" className="flex-1" loading={isLoading}>
                    下一步
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </form>
            )}

            {currentStep === 3 && (
              <form onSubmit={handleStep3Submit(onStep3Submit)} className="space-y-5 animate-fade-in">
                <div className="p-4 rounded-xl bg-gradient-to-r from-sapphire-500/10 to-rose-500/10 border border-sapphire-500/20">
                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-6 h-6 text-sapphire-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-white">实名认证</h4>
                      <p className="text-sm text-midnight-400 mt-1">
                        为了保障您的账户安全和平台交易的真实性，请完成实名认证。您的个人信息将受到严格保护。
                      </p>
                    </div>
                  </div>
                </div>

                <Input
                  label="身份证号"
                  placeholder="请输入18位身份证号"
                  maxLength={18}
                  error={step3Errors.idCardNumber?.message}
                  {...registerStep3("idCardNumber")}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-midnight-200">
                      身份证正面
                    </label>
                    <div className="h-32 rounded-xl border-2 border-dashed border-midnight-600 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-rose-500/50 hover:bg-midnight-800/50 transition-all duration-300">
                      <FileText className="w-8 h-8 text-midnight-500" />
                      <span className="text-xs text-midnight-500">点击上传</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-midnight-200">
                      身份证反面
                    </label>
                    <div className="h-32 rounded-xl border-2 border-dashed border-midnight-600 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-rose-500/50 hover:bg-midnight-800/50 transition-all duration-300">
                      <FileText className="w-8 h-8 text-midnight-500" />
                      <span className="text-xs text-midnight-500">点击上传</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-midnight-200">
                    个人头像照片
                  </label>
                  <div className="h-40 rounded-xl border-2 border-dashed border-midnight-600 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-rose-500/50 hover:bg-midnight-800/50 transition-all duration-300">
                    <User className="w-10 h-10 text-midnight-500" />
                    <span className="text-xs text-midnight-500">点击上传头像照片</span>
                    <span className="text-xs text-midnight-600">支持 JPG、PNG 格式，不超过 5MB</span>
                  </div>
                </div>

                <Controller
                  name="agreeVerification"
                  control={step3Control}
                  render={({ field }) => (
                    <Checkbox
                      label="我同意进行实名认证"
                      description="本人确认所提供的身份信息真实有效，并同意平台依法依规进行身份核验"
                      error={step3Errors.agreeVerification?.message}
                      checked={Boolean(field.value)}
                      onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                    />
                  )}
                />

                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={goToPrevStep}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    上一步
                  </Button>
                  <Button type="submit" size="lg" className="flex-1" loading={isLoading}>
                    <CheckCircle2 className="w-4 h-4" />
                    完成注册
                  </Button>
                </div>
              </form>
            )}
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-midnight-400">
              已有账户？{" "}
              <Link to="/login" className="text-rose-400 hover:text-rose-300 font-medium">
                立即登录
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </AuthLayout>
  )
}

export default Register

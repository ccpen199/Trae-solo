import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  UserPlus,
  Sparkles,
  AlertCircle,
  Phone,
  Briefcase,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { authApi } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';
import { cn } from '@/lib/utils';

type RoleTab = 'jobseeker' | 'hr';

const jobseekerSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  email: z.string().email('请输入有效的邮箱地址'),
  phone: z.string().optional(),
  password: z
    .string()
    .min(8, '密码至少8位')
    .regex(/[A-Za-z]/, '密码需包含字母')
    .regex(/[0-9]/, '密码需包含数字'),
  confirmPassword: z.string(),
  verifyCode: z.string().length(6, '验证码为6位数字').optional(),
  agreeTerms: z.boolean().refine((val) => val === true, '请阅读并同意用户协议'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

const hrSchema = z.object({
  name: z.string().min(2, '姓名至少2个字符'),
  companyName: z.string().min(2, '公司名称至少2个字符'),
  position: z.string().min(2, '职位至少2个字符'),
  email: z.string().email('请输入有效的企业邮箱地址'),
  password: z
    .string()
    .min(8, '密码至少8位')
    .regex(/[A-Za-z]/, '密码需包含字母')
    .regex(/[0-9]/, '密码需包含数字'),
  confirmPassword: z.string(),
  companySize: z.string().min(1, '请选择企业规模'),
  agreeTerms: z.boolean().refine((val) => val === true, '请阅读并同意用户协议'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

const companySizes = [
  { value: 'startup', label: '初创企业', sub: '50人以下' },
  { value: 'small', label: '小型企业', sub: '50-200人' },
  { value: 'mid', label: '中型企业', sub: '200-1000人' },
  { value: 'large', label: '大型企业', sub: '1000人以上' },
];

type JobseekerFormData = z.infer<typeof jobseekerSchema>;
type HrFormData = z.infer<typeof hrSchema>;

export default function Register() {
  const navigate = useNavigate();
  const { setUser } = useAppStore();

  const [roleTab, setRoleTab] = useState<RoleTab>('jobseeker');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  const jobseekerForm = useForm<JobseekerFormData>({
    resolver: zodResolver(jobseekerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      verifyCode: '',
      agreeTerms: false,
    },
    mode: 'onBlur',
  });

  const hrForm = useForm<HrFormData>({
    resolver: zodResolver(hrSchema),
    defaultValues: {
      name: '',
      companyName: '',
      position: '',
      email: '',
      password: '',
      confirmPassword: '',
      companySize: '',
      agreeTerms: false,
    },
    mode: 'onBlur',
  });

  const currentForm = roleTab === 'jobseeker' ? jobseekerForm : hrForm;
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = currentForm;

  const sendVerifyCode = () => {
    if (countdown > 0) return;
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const onSubmit = async (data: JobseekerFormData | HrFormData) => {
    setError(null);
    setIsLoading(true);

    try {
      const role = roleTab;
      const registerData = {
        ...data,
        role,
      };

      const response = await authApi.register(registerData);

      setUser({
        isLoggedIn: true,
        profile: response.user,
        token: response.token,
      });

      if (role === 'hr') {
        navigate('/hr/dashboard');
      } else {
        navigate('/onboarding');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败，请稍后重试';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const switchRole = (role: RoleTab) => {
    setRoleTab(role);
    setError(null);
  };

  const InputField = ({
    label,
    name,
    type = 'text',
    icon: Icon,
    placeholder,
    rightAction,
  }: {
    label: string;
    name: string;
    type?: string;
    icon: React.ElementType;
    placeholder?: string;
    rightAction?: React.ReactNode;
  }) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>
          <div className="relative">
            <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={type}
              value={field.value as string}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={placeholder}
              className={cn(
                'w-full h-12 pl-11 pr-4 rounded-xl border bg-white/80 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400/40',
                errors[name as keyof typeof errors]
                  ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/30'
                  : 'border-slate-200 focus:border-emerald-400'
              )}
              style={{ paddingRight: rightAction ? '120px' : undefined }}
            />
            {rightAction && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                {rightAction}
              </div>
            )}
          </div>
          {errors[name as keyof typeof errors] && (
            <p className="mt-1.5 text-xs text-rose-600">
              {(errors[name as keyof typeof errors] as { message?: string })?.message}
            </p>
          )}
        </div>
      )}
    />
  );

  const PasswordField = ({
    label,
    name,
    showValue,
    onToggleShow,
    placeholder,
  }: {
    label: string;
    name: string;
    showValue: boolean;
    onToggleShow: () => void;
    placeholder?: string;
  }) => (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            {label}
          </label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type={showValue ? 'text' : 'password'}
              value={field.value as string}
              onChange={field.onChange}
              onBlur={field.onBlur}
              placeholder={placeholder}
              className={cn(
                'w-full h-12 pl-11 pr-11 rounded-xl border bg-white/80 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-emerald-400/40',
                errors[name as keyof typeof errors]
                  ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-400/30'
                  : 'border-slate-200 focus:border-emerald-400'
              )}
            />
            <button
              type="button"
              onClick={onToggleShow}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showValue ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
          {errors[name as keyof typeof errors] && (
            <p className="mt-1.5 text-xs text-rose-600">
              {(errors[name as keyof typeof errors] as { message?: string })?.message}
            </p>
          )}
        </div>
      )}
    />
  );

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-lavender-50/60 to-emerald-50/60" />

      <div className="absolute top-20 right-10 w-72 h-72 bg-space-indigo-300/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-300/20 rounded-full blur-3xl" />
      <div className="absolute top-1/2 right-1/3 w-64 h-64 bg-lavender-200/20 rounded-full blur-3xl" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1.5 h-1.5 rounded-full bg-lavender-400/40"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -20, 0],
              opacity: [0.3, 0.8, 0.3],
            }}
            transition={{
              duration: 3 + Math.random() * 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="inline-flex items-center gap-2 mb-4"
          >
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 via-lavender-500 to-space-indigo-500 flex items-center justify-center shadow-xl shadow-emerald-300/40">
              <svg viewBox="0 0 24 24" className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-3xl font-heading font-bold mb-2"
          >
            <span className="gradient-text">创建你的账号</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-slate-500 text-sm"
          >
            加入 CareerGraph，开启你的职业成长新篇章
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
        >
          <Card variant="glass" className="p-7 shadow-2xl shadow-lavender-200/20">
            <div className="flex bg-slate-100/80 rounded-full p-1 mb-6">
              <button
                onClick={() => switchRole('jobseeker')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300',
                  roleTab === 'jobseeker'
                    ? 'bg-white text-emerald-600 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <User className="w-4 h-4" />
                求职者注册
              </button>
              <button
                onClick={() => switchRole('hr')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300',
                  roleTab === 'hr'
                    ? 'bg-gradient-to-r from-space-indigo-500 to-lavender-500 text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                )}
              >
                <Building2 className="w-4 h-4" />
                HR企业注册
              </button>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm"
              >
                <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit(onSubmit as (data: JobseekerFormData | HrFormData) => void)} className="space-y-4">
              {roleTab === 'jobseeker' ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key="jobseeker"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <InputField
                      label="姓名"
                      name="name"
                      icon={User}
                      placeholder="请输入你的姓名"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="邮箱"
                        name="email"
                        type="email"
                        icon={Mail}
                        placeholder="邮箱地址"
                      />
                      <InputField
                        label="手机号"
                        name="phone"
                        type="tel"
                        icon={Phone}
                        placeholder="手机号码"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        验证码
                      </label>
                      <div className="relative">
                        <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="请输入验证码"
                          className="w-full h-12 pl-11 pr-28 rounded-xl border border-slate-200 bg-white/80 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400 transition-all"
                        />
                        <button
                          type="button"
                          onClick={sendVerifyCode}
                          disabled={countdown > 0}
                          className={cn(
                            'absolute right-2 top-1/2 -translate-y-1/2 h-8 px-3 rounded-lg text-xs font-medium transition-all',
                            countdown > 0
                              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          )}
                        >
                          {countdown > 0 ? `${countdown}s后重发` : '获取验证码'}
                        </button>
                      </div>
                      <p className="mt-1.5 text-xs text-slate-400">演示模式：无需验证码，直接注册</p>
                    </div>
                    <PasswordField
                      label="设置密码"
                      name="password"
                      showValue={showPassword}
                      onToggleShow={() => setShowPassword(!showPassword)}
                      placeholder="至少8位，包含字母和数字"
                    />
                    <PasswordField
                      label="确认密码"
                      name="confirmPassword"
                      showValue={showConfirmPassword}
                      onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                      placeholder="请再次输入密码"
                    />
                  </motion.div>
                </AnimatePresence>
              ) : (
                <AnimatePresence mode="wait">
                  <motion.div
                    key="hr"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <InputField
                      label="姓名"
                      name="name"
                      icon={User}
                      placeholder="请输入你的姓名"
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <InputField
                        label="公司名称"
                        name="companyName"
                        icon={Building2}
                        placeholder="公司全称"
                      />
                      <InputField
                        label="职位"
                        name="position"
                        icon={Briefcase}
                        placeholder="如：招聘经理"
                      />
                    </div>
                    <InputField
                      label="企业邮箱"
                      name="email"
                      type="email"
                      icon={Mail}
                      placeholder="请使用企业邮箱注册"
                    />
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        企业规模
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {companySizes.map((size) => (
                          <Controller
                            key={size.value}
                            name="companySize"
                            control={control}
                            render={({ field }) => {
                              const selected = field.value === size.value;
                              return (
                                <button
                                  type="button"
                                  onClick={() => field.onChange(size.value)}
                                  className={cn(
                                    'p-3 rounded-xl border-2 text-center transition-all',
                                    selected
                                      ? 'border-emerald-400 bg-emerald-50/60 shadow-sm'
                                      : 'border-slate-200 bg-white/60 hover:border-lavender-200'
                                  )}
                                >
                                  <div className={cn(
                                    'text-xs font-semibold mb-0.5',
                                    selected ? 'text-emerald-700' : 'text-slate-700'
                                  )}>
                                    {size.label}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {size.sub}
                                  </div>
                                </button>
                              );
                            }}
                          />
                        ))}
                      </div>
                      {errors.companySize && (
                        <p className="mt-1.5 text-xs text-rose-600">
                          {(errors.companySize as { message?: string })?.message}
                        </p>
                      )}
                    </div>
                    <PasswordField
                      label="设置密码"
                      name="password"
                      showValue={showPassword}
                      onToggleShow={() => setShowPassword(!showPassword)}
                      placeholder="至少8位，包含字母和数字"
                    />
                    <PasswordField
                      label="确认密码"
                      name="confirmPassword"
                      showValue={showConfirmPassword}
                      onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
                      placeholder="请再次输入密码"
                    />
                  </motion.div>
                </AnimatePresence>
              )}

              <Controller
                name="agreeTerms"
                control={control}
                render={({ field }) => (
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <div className="relative mt-0.5">
                        <input
                          type="checkbox"
                          checked={field.value as boolean}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="sr-only"
                        />
                        <div
                          className={cn(
                            'w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all',
                            field.value
                              ? 'bg-emerald-500 border-emerald-500'
                              : 'bg-white border-slate-300'
                          )}
                        >
                          {field.value && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 leading-relaxed">
                        我已阅读并同意
                        <a href="#" className="text-emerald-600 hover:underline mx-0.5">
                          《用户协议》
                        </a>
                        和
                        <a href="#" className="text-emerald-600 hover:underline mx-0.5">
                          《隐私政策》
                        </a>
                      </span>
                    </label>
                    {errors.agreeTerms && (
                      <p className="mt-1.5 text-xs text-rose-600">
                        {(errors.agreeTerms as { message?: string })?.message}
                      </p>
                    )}
                  </div>
                )}
              />

              <Button
                type="submit"
                size="lg"
                fullWidth
                isLoading={isLoading}
                className="mt-2"
              >
                <UserPlus className="w-5 h-5" />
                创建账号
              </Button>
            </form>
          </Card>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-center mt-6 text-sm text-slate-600"
        >
          已有账号？
          <Link
            to="/login"
            className="ml-1 text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
          >
            立即登录
          </Link>
        </motion.p>
      </motion.div>
    </div>
  );
}

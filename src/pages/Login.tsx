import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
  Lock,
  Send,
  PawPrint,
  Store,
  User,
  Stethoscope,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  XCircle,
  Sparkles,
  LogIn,
  Building2,
  Settings2,
  Cpu,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Tag } from '@/components/common/BadgeTagAvatar';
import { useAuthStore, getRoleLabel, getDefaultRedirectPath } from '@/stores/authStore';
import type { UserRole } from '@/types/auth';
import { cn } from '@/utils/common';

interface LoginForm {
  phone: string;
  password?: string;
  smsCode?: string;
}

interface RoleOption {
  role: UserRole;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
  demoAccount?: string;
}

const roleOptions: RoleOption[] = [
  {
    role: 'owner',
    label: '宠主端',
    icon: User,
    description: '管理宠物档案、预约服务、在线问诊、积分权益',
    color: 'from-primary-500 to-mint-400',
    demoAccount: 'owner / 13800138000',
  },
  {
    role: 'store_admin',
    label: '门店管理端',
    icon: Store,
    description: '排班调度、库存追溯、业绩看板、病历管理',
    color: 'from-accent-500 to-orange-400',
    demoAccount: 'admin / 13900139000',
  },
  {
    role: 'veterinarian',
    label: '兽医审方端',
    icon: Stethoscope,
    description: '在线审方、电子病历、执业签名、合规存档',
    color: 'from-blue-500 to-indigo-400',
    demoAccount: 'vet / 13700137000',
  },
];

interface QuickAccount {
  account: string;
  password: string;
  role: UserRole;
  label: string;
  icon: React.ElementType;
  description: string;
  color: string;
}

const quickAccounts: QuickAccount[] = [
  { account: 'owner', password: '123456', role: 'owner', label: '宠主体验', icon: User, description: '宠物档案·预约服务', color: 'bg-primary-100 text-primary-700' },
  { account: 'admin', password: '123456', role: 'store_admin', label: '门店管理', icon: Building2, description: '排班·库存·运营', color: 'bg-accent-100 text-accent-700' },
  { account: 'staff', password: '123456', role: 'store_staff', label: '服务执行', icon: Settings2, description: 'SOP·拍照留痕', color: 'bg-mint-100 text-mint-700' },
  { account: 'platform', password: '123456', role: 'store_manager', label: '店长看店', icon: Sparkles, description: '排班调度·业绩', color: 'bg-amber-100 text-amber-700' },
  { account: 'vet', password: '123456', role: 'veterinarian', label: '兽医审方', icon: Stethoscope, description: '审方·病历签名', color: 'bg-blue-100 text-blue-700' },
  { account: 'ops', password: '123456', role: 'operator', label: '平台运营', icon: Cpu, description: '知识图谱·数据', color: 'bg-purple-100 text-purple-700' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, clearLoginResult } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [loginMode, setLoginMode] = useState<'password' | 'sms'>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginForm>();

  useEffect(() => {
    clearLoginResult();
  }, [selectedRole, loginMode, clearLoginResult]);

  const onSubmit = async (data: LoginForm) => {
    try {
      const result = await login({
        phone: data.phone.trim(),
        password: data.password,
        smsCode: data.smsCode,
        role: selectedRole,
      });
      setSuccessMessage(result.welcomeMessage);
      setShowSuccessAnimation(true);
      setTimeout(() => {
        navigate(result.redirectPath, { replace: true });
      }, 1200);
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  const handleQuickLogin = async (account: QuickAccount) => {
    clearError();
    setSelectedRole(account.role);
    setValue('phone', account.account);
    setValue('password', account.password);

    try {
      const result = await login({
        phone: account.account,
        password: account.password,
        role: account.role,
      });
      setSuccessMessage(result.welcomeMessage);
      setShowSuccessAnimation(true);
      setTimeout(() => {
        navigate(result.redirectPath, { replace: true });
      }, 1200);
    } catch (err) {
      console.error('Quick login failed:', err);
    }
  };

  const sendSms = () => {
    setSmsSent(true);
    setCountdown(60);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          setSmsSent(false);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
  };

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    clearError();
  };

  if (showSuccessAnimation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-mint-50 flex items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-24 h-24 rounded-full bg-gradient-primary mx-auto flex items-center justify-center mb-6 shadow-float"
          >
            <CheckCircle className="w-12 h-12 text-white" />
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-display text-2xl font-bold text-neutral-900 mb-2"
          >
            登录成功
          </motion.h2>
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-neutral-600"
          >
            {successMessage}
          </motion.p>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 1 }}
            className="w-48 h-1.5 bg-gradient-primary mx-auto mt-8 rounded-full origin-left"
          />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-mint-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-mint-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-50 rounded-full opacity-30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-5 gap-8"
      >
        <div className="lg:col-span-2 hidden lg:flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-14 h-14 bg-gradient-primary rounded-2xl flex items-center justify-center shadow-float">
                <PawPrint className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="font-display text-2xl font-bold text-neutral-900">宠护康</h1>
                <p className="text-xs text-neutral-500">宠物健康全周期管理平台</p>
              </div>
            </div>

            <h2 className="font-display text-3xl font-bold text-neutral-900 mb-3 leading-tight">
              一站式<span className="text-primary-600">宠物健康</span>管理
              <br />
              为每一只毛孩子保驾护航
            </h2>
            <p className="text-neutral-500 mb-8 leading-relaxed">
              覆盖C端宠主与B端直营护理门店双角色，内置品种知识图谱、AI症状自查、会员权益引擎，全程合规电子病历存档。
            </p>

            <div className="space-y-3">
              {[
                '✅ 智能服务预约 & 电子健康档案',
                '✅ 处方药审方 & 执业兽医在线问诊',
                '✅ 门店SOP服务执行 & 前后对比留痕',
                '✅ 耗材批次追溯 & 会员积分通兑',
                '✅ 符合《动物诊疗机构管理办法》存档规范',
              ].map((item, i) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  className="flex items-center gap-2 text-sm text-neutral-700"
                >
                  <span>{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <div className="lg:col-span-3">
          <Card className="p-8 shadow-float">
            <div className="lg:hidden text-center mb-6">
              <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-primary rounded-2xl shadow-float mb-3">
                <PawPrint className="w-7 h-7 text-white" />
              </div>
              <h1 className="font-display text-xl font-bold text-neutral-900">宠护康</h1>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={error ? 'error' : 'no-error'}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4"
              >
                {error && (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-700 text-sm">登录失败</p>
                      <p className="text-sm text-red-600 mt-0.5">{error}</p>
                    </div>
                    <button
                      onClick={clearError}
                      className="text-red-400 hover:text-red-600 transition-colors"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-neutral-700">选择登录身份</p>
                <Tag variant="mint" className="flex items-center gap-1 !text-xs !py-0.5">
                  <Sparkles className="w-3 h-3" />
                  角色权限决定工作台内容
                </Tag>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {roleOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedRole === option.role;
                  return (
                    <motion.button
                      key={option.role}
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleRoleChange(option.role)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all duration-200 text-left relative overflow-hidden',
                        isSelected
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-neutral-200 hover:border-neutral-300 bg-white'
                      )}
                    >
                      {isSelected && (
                        <motion.div
                          layoutId="role-highlight"
                          className={`absolute inset-0 bg-gradient-to-br ${option.color} opacity-5`}
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <div className="relative">
                        <div className={cn(
                          'w-10 h-10 rounded-xl flex items-center justify-center mb-2',
                          isSelected ? `bg-gradient-to-br ${option.color} text-white` : 'bg-neutral-100 text-neutral-400'
                        )}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <p className={cn(
                          'text-sm font-semibold mb-0.5',
                          isSelected ? 'text-primary-700' : 'text-neutral-700'
                        )}>
                          {option.label}
                        </p>
                        <p className="text-xs text-neutral-500 leading-tight line-clamp-2">
                          {option.description}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
              <div className="bg-gradient-to-r from-neutral-50 to-mint-50 rounded-xl px-4 py-3 flex items-center justify-between">
                <span className="text-xs text-neutral-600 flex items-center gap-2">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-mint-500" />
                  您选择的身份：<span className="font-semibold text-primary-700">{getRoleLabel(selectedRole)}</span>
                </span>
                <span className="text-xs text-neutral-500">
                  工作台路径：
                  <code className="bg-white px-2 py-0.5 rounded text-primary-600 ml-1 font-mono text-[11px]">
                    {getDefaultRedirectPath(selectedRole)}
                  </code>
                </span>
              </div>
            </div>

            <div className="flex gap-2 mb-5">
              <Button
                type="button"
                variant={loginMode === 'password' ? 'primary' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setLoginMode('password')}
              >
                <Lock className="w-4 h-4 mr-2" />
                账号密码登录
              </Button>
              <Button
                type="button"
                variant={loginMode === 'sms' ? 'primary' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setLoginMode('sms')}
              >
                <Send className="w-4 h-4 mr-2" />
                验证码登录
              </Button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  账号 / 手机号
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    {...register('phone', {
                      required: '请输入账号或手机号',
                    })}
                    type="text"
                    placeholder="输入账号（如 owner/admin/vet）或手机号"
                    autoComplete="username"
                    className={cn(
                      'w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200',
                      'focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500',
                      errors.phone ? 'border-red-300' : 'border-neutral-200'
                    )}
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errors.phone.message}
                  </p>
                )}
              </div>

              {loginMode === 'password' ? (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <input
                      {...register('password', {
                        required: '请输入密码',
                      })}
                      type={showPassword ? 'text' : 'password'}
                      placeholder="演示账号密码均为 123456"
                      autoComplete="current-password"
                      className={cn(
                        'w-full pl-10 pr-12 py-3 rounded-xl border transition-all duration-200',
                        'focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500',
                        errors.password ? 'border-red-300' : 'border-neutral-200'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.password.message}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                    验证码
                  </label>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <Send className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                      <input
                        {...register('smsCode', {
                          required: '请输入验证码',
                        })}
                        type="text"
                        maxLength={6}
                        placeholder="演示验证码：123456"
                        className={cn(
                          'w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200',
                          'focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500',
                          errors.smsCode ? 'border-red-300' : 'border-neutral-200'
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={sendSms}
                      disabled={smsSent}
                      className="whitespace-nowrap min-w-[110px]"
                    >
                      {smsSent ? `${countdown}s 后重发` : '获取验证码'}
                    </Button>
                  </div>
                  {errors.smsCode && (
                    <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {errors.smsCode.message}
                    </p>
                  )}
                </div>
              )}

              <Button
                type="submit"
                size="lg"
                isLoading={isLoading}
                className="w-full"
              >
                <LogIn className="w-4 h-4 mr-2" />
                {isLoading ? '登录中...' : `登录 ${getRoleLabel(selectedRole)}`}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t border-neutral-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-neutral-200" />
                <span className="text-xs font-medium text-neutral-500 px-2">💡 演示账号一键登录</span>
                <div className="flex-1 h-px bg-neutral-200" />
              </div>
              <div className="grid grid-cols-3 gap-2">
                {quickAccounts.map((acc) => {
                  const Icon = acc.icon;
                  const isActive = selectedRole === acc.role;
                  return (
                    <motion.button
                      key={acc.account}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={() => handleQuickLogin(acc)}
                      disabled={isLoading}
                      className={cn(
                        'p-3 rounded-xl border text-left transition-all',
                        isActive
                          ? 'border-primary-300 bg-primary-50/50'
                          : 'border-neutral-200 bg-white hover:border-primary-200 hover:shadow-soft'
                      )}
                    >
                      <div className={`w-8 h-8 rounded-lg ${acc.color} flex items-center justify-center mb-2`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <p className="text-sm font-semibold text-neutral-800">{acc.label}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <code className="text-[11px] bg-neutral-100 px-1.5 py-0.5 rounded text-neutral-600">
                          {acc.account}
                        </code>
                        <span className="text-[11px] text-neutral-400">/ 123456</span>
                      </div>
                      <p className="text-[11px] text-neutral-500 mt-1 line-clamp-1">
                        {acc.description}
                      </p>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 p-3 bg-neutral-50 rounded-xl text-xs text-neutral-500 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-neutral-600">登录提示：</span>
                使用上方「演示账号」卡片可直接进入对应工作台。密码登录支持手机号或账号名（owner/admin/staff/platform/vet/ops），密码统一为 <code className="bg-white px-1 py-0.5 rounded">123456</code>，验证码为 <code className="bg-white px-1 py-0.5 rounded">123456</code>。
              </div>
            </div>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}

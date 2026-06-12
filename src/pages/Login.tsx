import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Phone, Lock, Send, PawPrint, Store, User, Stethoscope } from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/BadgeTagAvatar';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/types/auth';
import { cn } from '@/utils/common';

interface LoginForm {
  phone: string;
  password?: string;
  smsCode?: string;
}

const roleOptions: { role: UserRole; label: string; icon: React.ElementType; description: string }[] = [
  { role: 'owner', label: '宠主端', icon: User, description: '管理宠物、预约服务' },
  { role: 'store_admin', label: '门店端', icon: Store, description: '门店运营管理' },
  { role: 'veterinarian', label: '兽医端', icon: Stethoscope, description: '在线审方、病历管理' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>('owner');
  const [loginMode, setLoginMode] = useState<'password' | 'sms'>('password');
  const [smsSent, setSmsSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const from = (location.state as { from?: string })?.from || (selectedRole === 'owner' ? '/' : '/store');

  const onSubmit = async (data: LoginForm) => {
    try {
      await login({ ...data, role: selectedRole });
      navigate(from, { replace: true });
    } catch (err) {
      console.error('Login failed:', err);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-mint-50 flex items-center justify-center p-6">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-mint-100 rounded-full opacity-50 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent-50 rounded-full opacity-30 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-gradient-primary rounded-2xl shadow-float mb-4"
          >
            <PawPrint className="w-8 h-8 text-white" />
          </motion.div>
          <h1 className="font-display text-3xl font-bold text-neutral-900 mb-2">宠护康</h1>
          <p className="text-neutral-500">宠物健康全周期管理平台</p>
        </div>

        <Card className="p-8">
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-neutral-700 mb-2">选择登录方式</p>
            <div className="grid grid-cols-3 gap-2">
              {roleOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = selectedRole === option.role;
                return (
                  <button
                    key={option.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(option.role);
                      clearError();
                    }}
                    className={cn(
                      'p-3 rounded-xl border-2 transition-all duration-200 text-center',
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-neutral-300 bg-white'
                    )}
                  >
                    <Icon
                      className={cn(
                        'w-5 h-5 mx-auto mb-1.5',
                        isSelected ? 'text-primary-600' : 'text-neutral-400'
                      )}
                    />
                    <p className={cn(
                      'text-xs font-medium',
                      isSelected ? 'text-primary-700' : 'text-neutral-600'
                    )}>
                      {option.label}
                    </p>
                  </button>
                );
              })}
            </div>
            <Badge variant="info" className="w-full justify-center text-xs">
              {roleOptions.find(r => r.role === selectedRole)?.description}
            </Badge>
          </div>

          <div className="flex gap-2 mb-6">
            <Button
              type="button"
              variant={loginMode === 'password' ? 'primary' : 'outline'}
              size="sm"
              className="flex-1"
              onClick={() => setLoginMode('password')}
            >
              <Lock className="w-4 h-4 mr-2" />
              密码登录
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
                手机号
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  {...register('phone', {
                    required: '请输入手机号',
                    pattern: {
                      value: /^1[3-9]\d{9}$/,
                      message: '请输入正确的手机号',
                    },
                  })}
                  type="tel"
                  placeholder="请输入手机号"
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200',
                    'focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500',
                    errors.phone ? 'border-red-300' : 'border-neutral-200'
                  )}
                />
              </div>
              {errors.phone && (
                <p className="mt-1.5 text-sm text-red-500">{errors.phone.message}</p>
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
                      minLength: { value: 6, message: '密码至少6位' },
                    })}
                    type="password"
                    placeholder="请输入密码"
                    className={cn(
                      'w-full pl-10 pr-4 py-3 rounded-xl border transition-all duration-200',
                      'focus:outline-none focus:ring-4 focus:ring-primary-100 focus:border-primary-500',
                      errors.password ? 'border-red-300' : 'border-neutral-200'
                    )}
                  />
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                  验证码
                </label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      {...register('smsCode', {
                        required: '请输入验证码',
                        pattern: { value: /^\d{6}$/, message: '请输入6位验证码' },
                      })}
                      type="text"
                      placeholder="请输入验证码"
                      className={cn(
                        'w-full px-4 py-3 rounded-xl border transition-all duration-200',
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
                    className="whitespace-nowrap"
                  >
                    {smsSent ? `${countdown}s` : '获取验证码'}
                  </Button>
                </div>
                {errors.smsCode && (
                  <p className="mt-1.5 text-sm text-red-500">{errors.smsCode.message}</p>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              isLoading={isLoading}
              className="w-full"
            >
              登录
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              还没有账号？
              <button className="text-primary-600 font-medium ml-1 hover:underline">
                立即注册
              </button>
            </p>
          </div>
        </Card>

        <p className="text-center text-xs text-neutral-400 mt-6">
          登录即表示同意《用户协议》和《隐私政策》
        </p>
      </motion.div>
    </div>
  );
}

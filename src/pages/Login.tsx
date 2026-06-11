import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Building2,
  Shield,
  Phone,
  Lock,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { login } from '@/services/api';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  phone: z.string().regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码'),
  password: z.string().min(6, '密码至少6位'),
  role: z.enum(['user', 'broker', 'admin'], {
    required_error: '请选择角色',
  }),
  rememberMe: z.boolean().default(false),
});

type LoginFormData = z.infer<typeof loginSchema>;

const roleOptions = [
  { value: 'user', label: '用户', icon: <User className="h-4 w-4" /> },
  { value: 'broker', label: '经纪人', icon: <Building2 className="h-4 w-4" /> },
  { value: 'admin', label: '管理员', icon: <Shield className="h-4 w-4" /> },
];

export default function Login() {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: 'user',
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);
    setError('');

    try {
      const response = await login({
        username: data.phone,
        password: data.password,
        role: data.role,
      });

      if (data.rememberMe) {
        localStorage.setItem('rememberedPhone', data.phone);
      } else {
        localStorage.removeItem('rememberedPhone');
      }

      if (response.user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('登录失败，请检查手机号和密码');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-800 via-primary-700 to-primary-900 flex items-center justify-center p-4">
      <div className="absolute inset-0 grain-overlay opacity-30" />
      <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-accent-verified/10 blur-3xl" />
      <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-accent-up/5 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4"
          >
            <Building2 className="h-8 w-8 text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">
            房产全周期价格治理平台
          </h1>
          <p className="text-white/70">
            真房源认证 · 价格透明 · 数据可信
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="bg-white rounded-2xl shadow-xl p-8"
        >
          <h2 className="text-2xl font-bold text-neutral-900 mb-6 text-center">
            登录账号
          </h2>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                选择角色
              </label>
              <div className="grid grid-cols-3 gap-2">
                {roleOptions.map((role) => (
                  <label
                    key={role.value}
                    className={cn(
                      'flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg border-2 cursor-pointer transition-all',
                      errors.role
                        ? 'border-red-200'
                        : 'border-neutral-200 hover:border-primary-300',
                      'data-[checked=true]:border-primary-800 data-[checked=true]:bg-primary-50'
                    )}
                  >
                    <input
                      type="radio"
                      value={role.value}
                      className="sr-only"
                      {...register('role')}
                      data-checked={
                        role.value === 'user' ? true : undefined
                      }
                    />
                    {role.icon}
                    <span className="text-sm font-medium text-neutral-700">
                      {role.label}
                    </span>
                  </label>
                ))}
              </div>
              {errors.role && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.role.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                手机号码
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type="tel"
                  placeholder="请输入手机号码"
                  className={cn(
                    'input-field pl-10',
                    errors.phone && 'border-red-300 focus:ring-red-200 focus:border-red-500'
                  )}
                  {...register('phone')}
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.phone.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-neutral-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  className={cn(
                    'input-field pl-10 pr-10',
                    errors.password && 'border-red-300 focus:ring-red-200 focus:border-red-500'
                  )}
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-neutral-300 text-primary-800 focus:ring-primary-800"
                  {...register('rememberMe')}
                />
                <span className="text-sm text-neutral-600">记住我</span>
              </label>
              <button
                type="button"
                className="text-sm text-primary-800 hover:text-primary-700"
              >
                忘记密码？
              </button>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              type="submit"
              disabled={isSubmitting}
              className={cn(
                'w-full btn-primary flex items-center justify-center gap-2 py-3',
                isSubmitting && 'opacity-70 cursor-not-allowed'
              )}
            >
              {isSubmitting ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                    className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                  登录中...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  登录
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              还没有账号？
              <button
                type="button"
                className="text-primary-800 hover:text-primary-700 font-medium ml-1"
              >
                立即注册
              </button>
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

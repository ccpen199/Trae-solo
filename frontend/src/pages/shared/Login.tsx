import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Phone, Lock, Eye, EyeOff, User, Zap, Store, Shield } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { authApi, type LoginParams } from '../../services/auth.api';
import { useAuthStore } from '../../store/useAuthStore';
import { useToast } from '../../components/ui/Toast';
import type { UserRole } from '../../types';

export default function Login() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const login = useAuthStore((state) => state.login);
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('user');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginParams>({
    defaultValues: {
      phone: '',
      password: '',
      role: 'user',
    },
  });

  const loginMutation = useMutation({
    mutationFn: (params: LoginParams) => authApi.login(params),
    onSuccess: (data) => {
      login(data.token, data.user);
      showToast('登录成功', 'success');
      if (data.user.role === 'admin') {
        navigate('/admin');
      } else if (data.user.role === 'rider') {
        navigate('/rider');
      } else if (data.user.role === 'merchant') {
        navigate('/merchant');
      } else {
        navigate('/');
      }
    },
    onError: (error: Error) => {
      showToast(error.message || '登录失败', 'error');
    },
  });

  const onSubmit = (data: LoginParams) => {
    loginMutation.mutate({ ...data, role: selectedRole });
  };

  const roles: Array<{ key: UserRole; name: string; icon: typeof User; color: string }> = [
    { key: 'user', name: '用户端', icon: User, color: 'text-brand-500' },
    { key: 'rider', name: '骑手端', icon: Zap, color: 'text-accent-500' },
    { key: 'merchant', name: '商户端', icon: Store, color: 'text-success-500' },
    { key: 'admin', name: '运营端', icon: Shield, color: 'text-admin-600' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-accent-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 shadow-lg shadow-brand-500/30 mb-4">
            <Zap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">闪跑</h1>
          <p className="text-gray-500">同城跑腿服务平台</p>
        </div>

        <div className="bg-white rounded-3xl shadow-card p-6 md:p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">欢迎登录</h2>

          <div className="grid grid-cols-4 gap-2 mb-6">
            {roles.map((role) => {
              const Icon = role.icon;
              const isActive = selectedRole === role.key;
              return (
                <button
                  key={role.key}
                  type="button"
                  onClick={() => setSelectedRole(role.key)}
                  className={`flex flex-col items-center gap-1 py-3 px-2 rounded-xl transition-all ${
                    isActive
                      ? 'bg-brand-50 border-2 border-brand-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isActive ? role.color : 'text-gray-400'}`} />
                  <span className={`text-xs font-medium ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                    {role.name}
                  </span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">手机号</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  placeholder="请输入手机号"
                  {...register('phone', {
                    required: '请输入手机号',
                    pattern: {
                      value: /^1[3-9]\d{9}$/,
                      message: '请输入正确的手机号',
                    },
                  })}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
              </div>
              {errors.phone && (
                <p className="mt-1 text-sm text-danger-500">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请输入密码"
                  {...register('password', {
                    required: '请输入密码',
                    minLength: {
                      value: 6,
                      message: '密码至少6位',
                    },
                  })}
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-danger-500">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <button type="button" className="text-gray-500 hover:text-brand-600">
                忘记密码？
              </button>
              <Link to="/register" className="text-brand-600 hover:text-brand-700 font-medium">
                注册账号
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loginMutation.isPending}
              className="w-full py-3 bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold rounded-xl shadow-lg shadow-brand-500/30 hover:from-brand-600 hover:to-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loginMutation.isPending ? '登录中...' : '登录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

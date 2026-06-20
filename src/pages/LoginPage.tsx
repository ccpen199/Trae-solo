import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Globe, AlertCircle } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { useAuthStore } from '../store/authStore';
import { validateEmail } from '../components/lib/utils';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const locationState = location.state as any;
  const redirectTo = locationState?.from || '/';

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email) {
      newErrors.email = '请输入邮箱地址';
    } else if (!validateEmail(email)) {
      newErrors.email = '请输入有效的邮箱地址';
    }
    
    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码至少需要6个字符';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    
    if (!validateForm()) return;

    try {
      await login(email, password, rememberMe);
      navigate(redirectTo);
    } catch (err: any) {
      // Error is handled by the store
    }
  };

  const quickLoginOptions = [
    { email: 'user@stayglobal.com', label: '普通用户 (Gold会员)' },
    { email: 'hotel@stayglobal.com', label: '酒店管理员' },
    { email: 'admin@stayglobal.com', label: '平台管理员' },
  ];

  return (
    <>
      <div className="flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-deep-blue to-deep-blue-light rounded-2xl mb-4">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-graphite-900 mb-2">
              欢迎回来
            </h1>
            <p className="text-graphite-500">
              登录您的 StayGlobal 账号，继续探索世界
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-elevated p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">登录失败</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <Input
                label="邮箱地址"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                leftIcon={<Mail className="w-5 h-5" />}
                error={errors.email}
                autoComplete="email"
              />

              <Input
                label="密码"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="w-5 h-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-graphite-400 hover:text-graphite-600"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                }
                error={errors.password}
                autoComplete="current-password"
              />

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-cloud-300 text-deep-blue focus:ring-deep-blue"
                  />
                  <span className="text-sm text-graphite-600">记住我</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-deep-blue hover:text-deep-blue-light font-medium"
                >
                  忘记密码？
                </Link>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
              >
                登录
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-cloud-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-graphite-500">或者</span>
                </div>
              </div>

              <div className="mt-6 space-y-2">
                <p className="text-xs text-graphite-500 text-center mb-3">
                  演示账号快速登录：
                </p>
                {quickLoginOptions.map((option) => (
                  <button
                    key={option.email}
                    type="button"
                    onClick={() => {
                      setEmail(option.email);
                      setPassword('password123');
                    }}
                    className="w-full px-4 py-2 text-sm bg-cloud-50 hover:bg-cloud-100 rounded-lg text-left text-graphite-600 transition-colors flex items-center justify-between"
                  >
                    <span>{option.label}</span>
                    <Badge variant="primary" size="sm">点击填入</Badge>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-cloud-200 text-center">
              <p className="text-graphite-600">
                还没有账号？{' '}
                <Link
                  to="/register"
                  className="text-deep-blue hover:text-deep-blue-light font-medium"
                >
                  立即注册
                </Link>
              </p>
            </div>
          </div>

          <div className="mt-8 text-center text-sm text-graphite-500">
            <p>
              登录即表示您同意我们的{' '}
              <Link to="/terms" className="text-deep-blue hover:underline">
                服务条款
              </Link>{' '}
              和{' '}
              <Link to="/privacy" className="text-deep-blue hover:underline">
                隐私政策
              </Link>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;

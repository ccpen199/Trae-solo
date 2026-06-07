import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, Building2, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { useAuthStore, type UserRole, type LoginResult } from '@/store/authStore';

const roleOptions: { value: UserRole; label: string; description: string; icon: string }[] = [
  { value: 'admin', label: '系统管理员', description: 'admin / 123456', icon: '🛡️' },
  { value: 'property', label: '物业管理员', description: 'property1 / 123456', icon: '🏢' },
  { value: 'resident', label: '小区居民', description: 'resident1 / 123456', icon: '🏠' },
  { value: 'merchant', label: '入驻商家', description: 'merchant1 / 123456', icon: '🏪' },
];

const roleDashboards: Record<UserRole, string> = {
  admin: '/dashboard/admin',
  property: '/dashboard/property',
  resident: '/dashboard/resident',
  merchant: '/dashboard/merchant',
};

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, user, loginError, loginMessage, clearLoginError } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>('resident');
  const [username, setUsername] = useState('resident1');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isAuthenticated && user) {
      setSuccessMsg(`登录成功！正在进入${
        user.role === 'admin' ? '系统管理' :
        user.role === 'property' ? '物业管理' :
        user.role === 'resident' ? '居民服务' : '商家管理'
      }工作台...`);
      const timer = setTimeout(() => {
        navigate(roleDashboards[user.role] || '/', { replace: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    if (loginError) {
      setLocalError(loginError);
    }
  }, [loginError]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const userMap: Record<UserRole, string> = {
      admin: 'admin',
      property: 'property1',
      resident: 'resident1',
      merchant: 'merchant1',
    };
    setUsername(userMap[role]);
    setPassword('123456');
    setLocalError('');
    setSuccessMsg('');
    clearLoginError();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLocalError('');
    setSuccessMsg('');
    clearLoginError();

    if (!username.trim()) {
      setLocalError('请输入用户名');
      setLoading(false);
      return;
    }
    if (!password.trim()) {
      setLocalError('请输入密码');
      setLoading(false);
      return;
    }

    try {
      const result: LoginResult = await login(username.trim(), password);
      if (!result.success) {
        setLocalError(result.error || result.message || '登录失败，请重试');
      }
    } catch (err: any) {
      setLocalError(err?.message || '登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 via-white to-secondary-50 p-4">
      <div className="w-full max-w-5xl flex rounded-3xl shadow-2xl overflow-hidden bg-white animate-fade-in">
        <div className="hidden lg:flex lg:w-1/2 gradient-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative z-10 p-12 flex flex-col justify-center text-white">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-6">
              <Building2 className="w-10 h-10" />
            </div>
            <h1 className="text-4xl font-bold mb-4 font-serif">智慧社区</h1>
            <h2 className="text-2xl font-light mb-6">Smart Community</h2>
            <p className="text-white/80 leading-relaxed mb-8">
              一站式社区管理平台，集物业服务、邻里互动、商圈服务于一体，让社区生活更智能、更便捷、更有温度。
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
                <span>智能工单管理</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
                <span>邻里互动社区</span>
              </div>
              <div className="flex items-center gap-3 text-white/90">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">✓</div>
                <span>社区商圈服务</span>
              </div>
            </div>
          </div>
        </div>
        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 font-serif">智慧社区</h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2 font-serif">欢迎回来</h2>
          <p className="text-gray-500 mb-8">请选择身份并登录您的账号</p>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {roleOptions.map((role) => (
              <button
                key={role.value}
                onClick={() => handleRoleSelect(role.value)}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  selectedRole === role.value
                    ? 'border-primary-500 bg-primary-50 shadow-md'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{role.icon}</span>
                  <p className={`font-medium ${selectedRole === role.value ? 'text-primary-600' : 'text-gray-900'}`}>
                    {role.label}
                  </p>
                </div>
                <p className="text-xs text-gray-500 font-mono">{role.description}</p>
              </button>
            ))}
          </div>

          <div className="mb-5 p-3 bg-blue-50 border border-blue-100 rounded-lg">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-xs text-blue-700">
                <p className="font-medium mb-1">演示账号说明</p>
                <p>上方选择身份后自动填入对应账号，密码统一为：<span className="font-mono font-bold text-blue-800">123456</span></p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setLocalError('');
                  }}
                  className={`input pl-10 ${localError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                  placeholder="请输入用户名"
                  required
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="label">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setLocalError('');
                  }}
                  className={`input pl-10 pr-10 ${localError ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : ''}`}
                  placeholder="请输入密码"
                  required
                  autoComplete="current-password"
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e as any)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {successMsg && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3 animate-pulse">
                <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-green-700">{successMsg}</p>
                  <div className="mt-2 flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            {localError && !successMsg && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-red-700">登录失败</p>
                  <p className="text-sm text-red-600 mt-1">{localError}</p>
                </div>
              </div>
            )}

            {loginMessage && !localError && !successMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-blue-700">{loginMessage}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!successMsg}
              className="w-full btn-primary py-3.5 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 font-medium text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  正在验证身份...
                </span>
              ) : successMsg ? (
                '登录成功，正在跳转...'
              ) : (
                '登录'
              )}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            登录即表示您同意我们的服务条款和隐私政策
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

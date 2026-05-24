import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, Shield, LogIn, Car } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { UserRole, RoleLabels, TestAccounts } from '@/types';

interface FormData {
  username: string;
  password: string;
  role: UserRole;
}

interface FormErrors {
  username?: string;
  password?: string;
  role?: string;
}

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuthStore();

  const [formData, setFormData] = useState<FormData>({
    username: '',
    password: '',
    role: 'admin',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showTestAccounts, setShowTestAccounts] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  const roles: UserRole[] = ['admin', 'dealer', 'buyer', 'inspector', 'sales', 'customer_service', 'finance'];

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = '请输入用户名';
    }

    if (!formData.password) {
      newErrors.password = '请输入密码';
    } else if (formData.password.length < 6) {
      newErrors.password = '密码长度不能少于6位';
    }

    if (!formData.role) {
      newErrors.role = '请选择角色';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      await login(formData);
      const from = (location.state as { from?: Location })?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (error) {
      setLoginError(error instanceof Error ? error.message : '登录失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    if (loginError) {
      setLoginError(null);
    }
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData(prev => ({ ...prev, role }));
    if (errors.role) {
      setErrors(prev => ({ ...prev, role: undefined }));
    }
  };

  const handleTestAccountSelect = (account: typeof TestAccounts[0]) => {
    setFormData({
      username: account.username,
      password: account.password,
      role: account.role,
    });
    setShowTestAccounts(false);
    setErrors({});
    setLoginError(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-950 via-primary-800 to-primary-700 flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-500/10 rounded-full blur-3xl" />
      </div>

      <div className="animate-fade-in relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <Car className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-noto-serif-sc text-3xl font-bold text-white mb-2">
            汽车交易管理系统
          </h1>
          <p className="text-primary-200 font-noto-sans-sc">
            专业、高效、透明的二手车交易平台
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl p-8 animate-slide-up">
          <div className="flex items-center gap-2 mb-6">
            <LogIn className="w-5 h-5 text-primary-700" />
            <h2 className="font-noto-serif-sc text-xl font-semibold text-neutral-800">
              用户登录
            </h2>
          </div>

          {loginError && (
            <div className="animate-slide-in mb-4 p-4 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2">
              <Shield className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-danger-700">{loginError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                选择角色
              </label>
              <div className="flex flex-wrap gap-2">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => handleRoleChange(role)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
                      formData.role === role
                        ? 'bg-primary-700 text-white shadow-md'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {RoleLabels[role]}
                  </button>
                ))}
              </div>
              {errors.role && (
                <p className="mt-1.5 text-sm text-danger-500 animate-slide-in">{errors.role}</p>
              )}
            </div>

            <div>
              <label htmlFor="username" className="block text-sm font-medium text-neutral-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="username"
                  name="username"
                  type="text"
                  value={formData.username}
                  onChange={handleInputChange}
                  placeholder="请输入用户名"
                  className={`input-field pl-10 ${errors.username ? 'border-danger-400 focus:ring-danger-500' : ''}`}
                />
              </div>
              {errors.username && (
                <p className="mt-1.5 text-sm text-danger-500 animate-slide-in">{errors.username}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="请输入密码"
                  className={`input-field pl-10 pr-10 ${errors.password ? 'border-danger-400 focus:ring-danger-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1.5 text-sm text-danger-500 animate-slide-in">{errors.password}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  <span>登录中...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>登录</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-neutral-200">
            <button
              type="button"
              onClick={() => setShowTestAccounts(!showTestAccounts)}
              className="w-full text-sm text-primary-700 hover:text-primary-800 font-medium flex items-center justify-center gap-1 transition-colors"
            >
              <Shield className="w-4 h-4" />
              {showTestAccounts ? '收起测试账号' : '使用测试账号快速登录'}
            </button>

            {showTestAccounts && (
              <div className="mt-4 grid grid-cols-1 gap-2 animate-fade-in">
                {TestAccounts.map((account) => (
                  <button
                    key={account.username}
                    type="button"
                    onClick={() => handleTestAccountSelect(account)}
                    className="p-3 text-left bg-neutral-50 hover:bg-primary-50 rounded-lg transition-colors border border-neutral-200 hover:border-primary-300"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-neutral-800">{account.name}</span>
                      <span className="text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded-full">
                        {RoleLabels[account.role]}
                      </span>
                    </div>
                    <div className="text-sm text-neutral-500 mt-1">
                      账号: {account.username} / 密码: {account.password}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 text-center text-sm text-primary-200">
          <p>© 2025 汽车交易管理系统 | 专业二手车交易平台</p>
          <p className="mt-1 text-primary-300/70">
            <Link to="/" className="hover:text-white transition-colors">返回首页</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

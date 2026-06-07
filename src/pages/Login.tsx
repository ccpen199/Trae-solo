import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Eye, EyeOff, Box, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../lib/api';
import { cn } from '../lib/utils';

export default function Login() {
  const navigate = useNavigate();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const login = useAuthStore((state) => state.login);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [touched, setTouched] = useState({ username: false, password: false });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const validateForm = () => {
    const errors: { username?: string; password?: string } = {};
    if (!username.trim()) errors.username = '请输入用户名';
    if (!password) errors.password = '请输入密码';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ username: true, password: true });
    setError('');

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);
    try {
      const result = await authApi.login(username, password);
      if (result.success && result.data) {
        const responseData = result.data as {
          id: string;
          username: string;
          phone: string;
          real_name: string;
          role: string;
          token: string;
        };
        const user: {
          id: string;
          username: string;
          phone: string;
          real_name: string;
          role: string;
        } = {
          id: responseData.id,
          username: responseData.username,
          phone: responseData.phone,
          real_name: responseData.real_name,
          role: responseData.role,
        };
        login(responseData.token, user);
        navigate('/');
      } else {
        setError(result.error || '登录失败，请检查用户名和密码');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('登录失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = () => {
    setUsername('admin');
    setPassword('admin123');
  };

  const usernameError = touched.username && !username.trim();
  const passwordError = touched.password && !password;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-2xl mb-4">
            <Box className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">智能柜服务中台</h1>
          <p className="text-sky-100">Smart Cabinet Service Platform</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 mb-6 text-center">
            登录账户
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, username: true }))}
                  placeholder="请输入用户名"
                  className={cn(
                    'w-full pl-10 pr-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all',
                    usernameError
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 bg-slate-50'
                  )}
                />
              </div>
              {usernameError && (
                <p className="mt-1 text-xs text-red-500">请输入用户名</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                  placeholder="请输入密码"
                  className={cn(
                    'w-full pl-10 pr-12 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all',
                    passwordError
                      ? 'border-red-300 bg-red-50'
                      : 'border-slate-200 bg-slate-50'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {passwordError && (
                <p className="mt-1 text-xs text-red-500">请输入密码</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-3 bg-sky-500 text-white rounded-lg font-medium text-sm transition-all',
                loading
                  ? 'opacity-70 cursor-not-allowed'
                  : 'hover:bg-sky-600 active:scale-[0.98]'
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  登录中...
                </span>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <p className="text-xs text-slate-500 text-center mb-3">
              测试账号快速登录
            </p>
            <button
              onClick={handleDemoLogin}
              className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              填充测试账号 (admin / admin123)
            </button>
          </div>
        </div>

        <p className="text-center text-sky-200 text-xs mt-6">
          © 2024 智能柜服务中台 · 版本 v1.0.0
        </p>
      </div>
    </div>
  );
}

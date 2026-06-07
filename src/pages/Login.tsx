import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Phone, Lock, Eye, EyeOff, LogIn } from 'lucide-react';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();
  const location = useLocation();
  const fromPath = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const redirectTo = `${fromPath?.pathname || '/'}${fromPath?.search || ''}`;
  const redirectLabel = fromPath?.pathname?.startsWith('/admin')
    ? '管理后台'
    : fromPath?.pathname === '/profile'
      ? '个人中心'
      : fromPath?.pathname === '/applications'
        ? '我的申办'
        : fromPath?.pathname === '/subscriptions'
          ? '消息订阅'
          : fromPath?.pathname === '/complaints'
            ? '诉求通道'
            : '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(phone, password);
      navigate(redirectTo, { replace: true });
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="font-serif-cn text-2xl font-bold text-primary">用户登录</h1>
          <p className="text-warm-500 text-sm mt-2">登录南京市公共服务聚合平台</p>
          {redirectLabel && (
            <p className="text-sm text-primary mt-2">请登录后继续访问{redirectLabel}</p>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-accent-50 text-accent text-sm rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-phone" className="block text-sm font-medium text-warm-700 mb-1.5">手机号</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                id="login-phone"
                name="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="请输入手机号"
                autoComplete="username"
                required
                className="w-full h-11 pl-10 pr-4 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-warm-700 mb-1.5">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-warm-400" />
              <input
                id="login-password"
                name="password"
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                autoComplete="current-password"
                required
                className="w-full h-11 pl-10 pr-10 border border-warm-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPwd(!showPwd)}
                aria-label={showPwd ? '隐藏输入内容' : '显示输入内容'}
                title={showPwd ? '隐藏密码' : '显示密码'}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-warm-400 hover:text-warm-600"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-primary text-white rounded-md font-medium hover:bg-primary-light transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <LogIn className="w-4 h-4" />
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>

        <p className="text-center text-sm text-warm-500 mt-6">
          还没有账号？
          <Link to="/register" className="text-primary font-medium hover:underline ml-1">
            立即注册
          </Link>
        </p>
        <div className="mt-5 rounded-md bg-warm-50 p-4 text-sm text-warm-600">
          <p className="font-medium text-warm-800 mb-1">测试账号</p>
          <p>管理员：admin / admin123</p>
          <p>手机号：13800000001 / admin123</p>
        </div>
      </div>
    </div>
  );
}

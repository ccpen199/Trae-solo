import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Wallet, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, register, isLoading, error, clearError, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (token) {
      navigate('/');
    }
  }, [token, navigate]);

  useEffect(() => {
    if (location.pathname === '/register') {
      setIsLogin(false);
    }
  }, [location.pathname]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register(username, email, password);
      }
    } catch (err: any) {
      console.error('Auth error:', err);
    }
  };

  const fillDemoAccount = (role: 'admin' | 'user' | 'collaborator') => {
    const accounts = {
      admin: { email: 'admin@example.com', password: 'admin123' },
      user: { email: 'user@example.com', password: 'user123' },
      collaborator: { email: 'collab@example.com', password: 'collab123' },
    };
    setEmail(accounts[role].email);
    setPassword(accounts[role].password);
    clearError();
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: '系统管理员',
      user: '个人用户',
      collaborator: '家庭协作者',
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8">
            <Wallet className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4 text-center">个人资产负债管理系统</h1>
          <p className="text-lg text-white/80 text-center max-w-md">
            全方位管理您的资产与负债，追踪净资产变化，实现财务自由
          </p>
          <div className="mt-12 grid grid-cols-2 gap-6 w-full max-w-md">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">5</p>
              <p className="text-sm text-white/70">核心功能模块</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
              <p className="text-3xl font-bold">10+</p>
              <p className="text-sm text-white/70">账户类型支持</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-slate-800">资产管家</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-slate-800">
                {isLogin ? '欢迎回来' : '创建账户'}
              </h2>
              <p className="text-slate-500 mt-2">
                {isLogin ? '请登录以查看您的财务状况' : '开始管理您的财务旅程'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-lg">
                <p className="text-rose-600 text-sm font-medium">{error}</p>
                {error.includes('密码') && (
                  <p className="text-rose-500 text-xs mt-1">
                    提示：测试账号密码为 admin123 / user123 / collab123
                  </p>
                )}
                {error.includes('邮箱') && (
                  <p className="text-rose-500 text-xs mt-1">
                    请检查邮箱是否正确，或点击下方快速体验按钮填充测试账号
                  </p>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!isLogin && (
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
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                      placeholder="请输入用户名"
                      required={!isLogin}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  邮箱
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="your@email.com"
                    required
                  />
                </div>
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
                    className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    placeholder="请输入密码"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 text-white font-medium rounded-lg hover:from-primary-700 hover:to-primary-800 focus:ring-4 focus:ring-primary-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? '处理中...' : isLogin ? '登录' : '注册'}
              </button>
            </form>

            {isLogin && (
              <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-xs text-slate-500 mb-3">快速体验（点击填充）：</p>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fillDemoAccount('admin')}
                      className="flex-1 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      系统管理员
                    </button>
                    <button
                      type="button"
                      onClick={() => fillDemoAccount('user')}
                      className="flex-1 py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      个人用户
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => fillDemoAccount('collaborator')}
                    className="w-full py-2 text-xs bg-white border border-slate-200 rounded-md hover:bg-slate-50 text-slate-700 transition-colors flex items-center justify-center gap-1"
                  >
                    <span className="w-2 h-2 rounded-full bg-primary-500"></span>
                    家庭协作者
                  </button>
                </div>
                <p className="text-xs text-slate-400 mt-2">
                  管理员可访问运营管理视图，协作者可参与家庭财务协作
                </p>
              </div>
            )}

            <div className="mt-6 text-center text-sm text-slate-500">
              {isLogin ? '还没有账户？' : '已有账户？'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  clearError();
                  navigate(isLogin ? '/register' : '/login');
                }}
                className="ml-1 text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                {isLogin ? '立即注册' : '立即登录'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

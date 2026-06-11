import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const { login, loading, error, clearError, token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: Location })?.from?.pathname || '/admin/dashboard';

  useEffect(() => {
    clearError();
  }, [clearError]);

  if (token) {
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login({ username, password });
      navigate(from, { replace: true });
    } catch (err) {
      console.error('登录失败:', err);
    }
  };

  const quickLogin = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
  };

  const quickAccounts = [
    { label: '超级管理员', user: 'admin', pass: 'admin123' },
    { label: '文旅主管', user: 'gov', pass: 'gov123' },
    { label: '景区运营', user: 'scenic', pass: 'scenic123' },
    { label: '文旅企业', user: 'enterprise', pass: 'ent123' },
    { label: '内容编辑', user: 'editor', pass: 'editor123' },
    { label: '专业读者', user: 'pro', pass: 'pro123' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-ink-50 via-primary-50 to-porcelain-50 p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-96 h-96 rounded-full bg-primary-400 blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 rounded-full bg-porcelain-400 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-landscape-400 blur-3xl"></div>
      </div>

      <div className="absolute top-10 left-10 text-6xl opacity-20">山</div>
      <div className="absolute bottom-10 right-10 text-6xl opacity-20">水</div>
      <div className="absolute top-1/3 right-1/4 text-4xl opacity-15">文</div>
      <div className="absolute bottom-1/3 left-1/4 text-4xl opacity-15">旅</div>

      <div className="relative w-full max-w-5xl flex bg-white rounded-2xl shadow-2xl overflow-hidden chinese-border">
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-ink-900 via-ink-800 to-ink-900 p-12 flex-col justify-between relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-64 h-64 border-2 border-primary-500/30 rounded-full -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 border-2 border-porcelain-500/20 rounded-full translate-y-1/2 -translate-x-1/3"></div>
          </div>
          <div className="relative z-10">
            <div className="w-16 h-16 rounded-xl bg-primary-500 flex items-center justify-center mb-6">
              <span className="text-3xl font-bold text-white">文</span>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-wider">文旅中台</h1>
            <p className="text-ink-300 text-lg mb-2">权威文旅垂直领域</p>
            <p className="text-ink-400 mb-8">内容生产与产业服务平台</p>
            <div className="space-y-3">
              {['内容+数据+服务三位一体', '多级审核与版权保护', '智能分发与舆情分析'].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 text-sm">✓</span>
                  <span className="text-ink-300">{item}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative z-10 text-ink-500 text-sm">
            <p>© 2024 文旅中台 · 权威发布</p>
            <p className="mt-1">Content Security Gateway</p>
          </div>
        </div>

        <div className="w-full lg:w-1/2 p-8 lg:p-12">
          <div className="lg:hidden mb-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-primary-500 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">文</span>
            </div>
            <h1 className="text-2xl font-bold text-ink-800">文旅中台</h1>
            <p className="text-ink-500 text-sm mt-1">内容生产与产业服务平台</p>
          </div>

          <h2 className="text-2xl font-bold text-ink-800 mb-2">欢迎登录</h2>
          <p className="text-ink-500 mb-8">请输入您的账号密码</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">账号</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="请输入用户名"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink-700 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="请输入密码"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 text-primary-500 rounded focus:ring-primary-500 border-ink-300"
                />
                <span className="text-sm text-ink-600">记住我</span>
              </label>
              <a href="#" className="text-sm text-primary-600 hover:text-primary-700">忘记密码？</a>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center">
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-ink-100">
            <p className="text-xs text-ink-500 mb-3">快捷登录（演示账号）：</p>
            <div className="flex flex-wrap gap-2">
              {quickAccounts.map((acc) => (
                <button
                  key={acc.user}
                  onClick={() => quickLogin(acc.user, acc.pass)}
                  className="px-3 py-1.5 text-xs bg-ink-50 hover:bg-ink-100 text-ink-600 rounded-lg transition-colors border border-ink-200"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

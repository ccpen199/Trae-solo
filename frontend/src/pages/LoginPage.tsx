import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore, useToastStore } from '../store';
import { Activity, Lock, User } from 'lucide-react';

const LoginPage: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const addToast = useToastStore((s) => s.addToast);
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      addToast('error', '请输入用户名和密码');
      return;
    }

    setLoading(true);
    try {
      const response = await authApi.login({ username, password });
      if (response.data.success) {
        login(response.data.data.token, response.data.data.user);
        addToast('success', '登录成功');
        navigate(from, { replace: true });
      }
    } catch (error: any) {
      addToast('error', error.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (user: string, pwd: string) => {
    setUsername(user);
    setPassword(pwd);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Activity className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">健康运动数据平台</h1>
            <p className="text-gray-500 mt-2">请登录您的账户</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  placeholder="请输入用户名"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition"
                  placeholder="请输入密码"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500 mb-3">快速登录测试账号：</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLogin('user1', '123456')}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
              >
                普通用户 user1
              </button>
              <button
                onClick={() => quickLogin('coach1', '123456')}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
              >
                教练 coach1
              </button>
              <button
                onClick={() => quickLogin('advisor1', '123456')}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
              >
                健康顾问 advisor1
              </button>
              <button
                onClick={() => quickLogin('admin', '123456')}
                className="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-gray-700 transition"
              >
                管理员 admin
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

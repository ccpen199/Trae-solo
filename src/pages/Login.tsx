import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Lock, User, Eye, EyeOff } from 'lucide-react';
import { authApi } from '@/api';
import { useAuthStore } from '@/store';
import type { UserRole } from '@shared/types';

const roleNames: Record<UserRole, string> = {
  owner: '业主',
  tenant: '租户',
  visitor: '访客',
  property: '物业员工',
  merchant: '商户',
};

const demoAccounts = [
  { username: 'owner1', password: '123456', role: 'owner' as UserRole, name: '张先生' },
  { username: 'tenant1', password: '123456', role: 'tenant' as UserRole, name: '王先生' },
  { username: 'property1', password: '123456', role: 'property' as UserRole, name: '物业管理员' },
  { username: 'worker1', password: '123456', role: 'property' as UserRole, name: '维修师傅' },
  { username: 'merchant1', password: '123456', role: 'merchant' as UserRole, name: '商户管理员' },
];

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ username, password });
      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.message || '登录失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account: typeof demoAccounts[0]) => {
    setUsername(account.username);
    setPassword(account.password);
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ username: account.username, password: account.password });
      if (res.success && res.data) {
        login(res.data.token, res.data.user);
        navigate('/dashboard');
      } else {
        setError(res.message || '登录失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '网络错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">智慧社区服务平台</h1>
          <p className="text-blue-200">碧桂园·在管小区专属服务</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">欢迎登录</h2>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-medium rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center mb-3">演示账号（密码均为 123456）</p>
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.username}
                  onClick={() => handleDemoLogin(account)}
                  className="px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-lg transition-colors border border-gray-200 hover:border-blue-300"
                >
                  <span className="font-medium">{account.name}</span>
                  <span className="text-xs text-gray-500 block">{roleNames[account.role]}</span>
                  <span className="text-xs text-gray-500 block">{account.username} / {account.password}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-blue-300 text-sm mt-6">
          © 2024 碧桂园智慧社区服务平台
        </p>
      </div>
    </div>
  );
};

export default Login;

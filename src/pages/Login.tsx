import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Building2, Phone, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import api, { ApiResponse, User } from '@/utils/api';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const from = (location.state as { from?: string })?.from || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
        phone,
        password,
      }) as unknown as ApiResponse<{ token: string; user: User }>;

      if (response.code === 200) {
        login(response.data.token, response.data.user);
        navigate(from, { replace: true });
      } else {
        setError(response.message || '登录失败');
      }
    } catch (err: unknown) {
      if (phone === '13800138000' && password === '123456') {
        login('mock-token', {
          id: 1,
          phone: '13800138000',
          name: '测试用户',
          role: 'customer',
          city: '上海',
          tags: ['刚需', '首次购房'],
          createdAt: new Date().toISOString(),
        });
        navigate(from, { replace: true });
        return;
      }
      if (phone === 'admin' && password === 'admin123') {
        login('mock-admin-token', {
          id: 0,
          phone: 'admin',
          name: '管理员',
          role: 'admin',
          city: '全国',
          tags: [],
          createdAt: new Date().toISOString(),
        });
        navigate('/admin/dashboard', { replace: true });
        return;
      }
      setError('手机号或密码错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-700 via-primary-800 to-primary-950 px-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gold-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-10 h-10 text-gold-400" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-white mb-2">金域房产</h1>
          <p className="text-primary-200">专业房地产交易平台</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">欢迎回来</h2>
          <p className="text-gray-500 mb-6">请登录您的账户</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                手机号
              </label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="请输入手机号"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-gray-300 text-primary-700 focus:ring-primary-700" />
                <span className="text-gray-600">记住我</span>
              </label>
              <a href="#" className="text-primary-700 hover:text-primary-800">
                忘记密码?
              </a>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  登录中...
                </>
              ) : (
                '登录'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            还没有账户?{' '}
            <Link to="/register" className="text-primary-700 hover:text-primary-800 font-medium">
              立即注册
            </Link>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 text-center">
              测试账号：客户 13800138000 / 123456，管理员 admin / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

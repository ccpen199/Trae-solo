import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { Button, Card } from '../components/ui';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const [phone, setPhone] = useState('13900000000');
  const [password, setPassword] = useState('123456');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(phone, password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const quickAccounts = [
    { label: '管理员', phone: '13800000000', desc: '完整后台权限' },
    { label: '政府账号', phone: '13800000001', desc: '可发官方通知' },
    { label: '商户账号', phone: '13700000000', desc: '老王川菜馆' },
    { label: '市民用户', phone: '13900000000', desc: '普通居民' },
  ];

  const handleQuickLogin = async (quickPhone: string) => {
    setPhone(quickPhone);
    setPassword('123456');
    setLoading(true);
    setError('');
    try {
      await login(quickPhone, '123456');
      navigate('/profile');
    } catch (err: any) {
      setError(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-white text-2xl font-bold mb-4 shadow-lg shadow-primary-500/30">
            邻
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">邻里圈</h1>
          <p className="text-gray-500">本地化社区生活服务平台</p>
        </div>

        <Card className="p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入手机号"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                placeholder="请输入密码"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full py-3" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-center text-sm text-gray-500 mb-4">
              还没有账号？
              <Link to="/register" className="text-primary-600 font-medium ml-1">
                立即注册
              </Link>
            </p>

            <div className="space-y-2">
              <p className="text-xs text-gray-400 mb-2">💡 快速体验账号（密码均为 123456）：</p>
              <div className="grid grid-cols-2 gap-2">
                {quickAccounts.map((a) => (
                  <button
                    key={a.phone}
                    type="button"
                    onClick={() => handleQuickLogin(a.phone)}
                    className="text-left p-2.5 rounded-lg bg-gray-50 hover:bg-primary-50 border border-transparent hover:border-primary-200 transition-all"
                  >
                    <div className="text-xs font-medium text-gray-700">{a.label}</div>
                    <div className="text-[10px] text-gray-400">{a.phone}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;

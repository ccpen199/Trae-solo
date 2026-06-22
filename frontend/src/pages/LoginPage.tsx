import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export default function LoginPage() {
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, isLoading } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(account, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    }
  };

  return (
    <div className="card p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">欢迎回来</h2>
      <p className="text-gray-500 mb-6">登录您的账号，继续您的装修之旅</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">账号</label>
          <input
            type="text"
            value={account}
            onChange={e => setAccount(e.target.value)}
            className="input"
            placeholder="用户名 / 邮箱 / 手机号"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input"
            placeholder="请输入密码"
            required
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button type="submit" className="w-full btn-primary" disabled={isLoading}>
          {isLoading ? '登录中...' : '登录'}
        </button>
      </form>

      <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-100">
        <p className="text-xs text-amber-800 mb-1">🧪 演示账号：</p>
        <p className="text-xs text-amber-700">业主：homeowner1 / 123456</p>
        <p className="text-xs text-amber-700">设计师：designer1 / 123456</p>
        <p className="text-xs text-amber-700">管理员：admin / 123456</p>
      </div>

      <p className="mt-6 text-center text-sm text-gray-500">
        还没有账号？{' '}
        <Link to="/auth/register" className="text-primary-700 font-medium hover:text-primary-800">
          立即注册
        </Link>
      </p>
    </div>
  );
}

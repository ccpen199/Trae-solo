import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Lock, AlertCircle, LogIn, Shield, Users, Truck } from 'lucide-react';

const TEST_ACCOUNTS = [
  { label: '管理员', username: 'admin', password: 'admin123', icon: Shield, color: 'text-primary' },
  { label: '网点管理员', username: 'platform01', password: 'platform123', icon: Users, color: 'text-accent' },
  { label: '快递员', username: 'ops01', password: 'ops123', icon: Truck, color: 'text-success' },
];

const ERROR_STYLES: Record<string, { bg: string; border: string; icon: string }> = {
  '账号不存在': { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500' },
  '密码错误': { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-500' },
  '账号已禁用': { bg: 'bg-gray-50', border: 'border-gray-300', icon: 'text-gray-500' },
  '角色无权限': { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-500' },
};

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
    setLoading(true);
    try {
      await login(u, p);
      navigate('/');
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  const errStyle = error ? (ERROR_STYLES[error] || { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500' }) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-white to-accent/5 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary-dark rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <LogIn size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">快递末端作业平台</h1>
          <p className="text-gray-500 mt-2">快递末端作业统一管理</p>
        </div>

        <div className="card">
          {error && errStyle && (
            <div className={`mb-4 p-3 ${errStyle.bg} border ${errStyle.border} rounded-xl flex items-center gap-2`}>
              <AlertCircle size={16} className={errStyle.icon} />
              <span className={`text-sm font-medium ${errStyle.icon}`}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">账号</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入账号"
                  className="input-field pl-10"
                  required
                  autoComplete="username"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="input-field pl-10"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100">
            <p className="text-xs text-gray-400 mb-3">快速登录测试账号：</p>
            <div className="space-y-2">
              {TEST_ACCOUNTS.map((acc) => {
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => handleQuickLogin(acc.username, acc.password)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-100 hover:border-primary/30 hover:bg-primary/5 transition-all text-left disabled:opacity-50"
                  >
                    <Icon size={16} className={acc.color} />
                    <span className="text-sm font-medium text-gray-700">{acc.label}</span>
                    <span className="text-xs text-gray-400 ml-auto">{acc.username} / {acc.password}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

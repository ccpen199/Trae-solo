import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Shield } from 'lucide-react';
import useAuthStore from '@/stores/authStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    setLoading(true);
    try {
      await login(username, password);
      navigate('/');
    } catch (err: any) {
      setError(err?.message || '登录失败，请检查用户名和密码');
    } finally {
      setLoading(false);
    }
  };

  const fillAccount = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-teal-600 to-teal-800 px-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-700 rounded-full mb-4">
            <Shield className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">农村宅基地管理平台</h1>
          <p className="text-slate-500 mt-1">请登录您的账号</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">用户名</label>
            <div className="relative">
              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="请输入用户名"
                required
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">密码</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                placeholder="请输入密码"
                required
              />
            </div>
          </div>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-200">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal-700 text-white rounded-lg text-sm font-medium hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '登录中...' : '登录'}
          </button>
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-500 text-center mb-2">演示账号（密码均为 123456）</p>
            <div className="space-y-1.5">
              <button
                type="button"
                className="w-full flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors text-left"
                onClick={() => fillAccount('admin', '123456')}
              >
                <span className="text-xs font-medium text-teal-700 bg-teal-100 px-1.5 py-0.5 rounded">监管人员</span>
                <span className="text-xs text-slate-700">admin</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors text-left"
                onClick={() => fillAccount('platform', '123456')}
              >
                <span className="text-xs font-medium text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">乡镇审批员</span>
                <span className="text-xs text-slate-700">platform</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors text-left"
                onClick={() => fillAccount('ops', '123456')}
              >
                <span className="text-xs font-medium text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">村委</span>
                <span className="text-xs text-slate-700">ops</span>
              </button>
              <button
                type="button"
                className="w-full flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-lg hover:bg-teal-50 transition-colors text-left"
                onClick={() => fillAccount('farmer1', '123456')}
              >
                <span className="text-xs font-medium text-green-700 bg-green-100 px-1.5 py-0.5 rounded">农户</span>
                <span className="text-xs text-slate-700">farmer1</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

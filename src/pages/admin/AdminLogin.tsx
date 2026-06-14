import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, Shield } from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';

const AdminLogin = () => {
  const navigate = useNavigate();
  const { login, loading } = useAdminStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('请输入用户名和密码');
      return;
    }

    const result = await login(username, password);
    if (result.success) {
      navigate('/admin');
    } else {
      setError(result.message || '登录失败');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-800 to-dark-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-primary-400 to-accent-500 rounded-2xl flex items-center justify-center shadow-2xl">
            <Shield size={40} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">赚金币管理后台</h1>
          <p className="text-gray-400">Task Earnings Admin Dashboard</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="text-sm text-gray-300 mb-2 block">用户名</label>
              <div className="relative">
                <User size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-gray-300 mb-2 block">密码</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/20 transition-all"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 text-red-300 text-sm text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold rounded-xl shadow-lg hover:shadow-primary-500/30 transition-all disabled:opacity-50"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-center text-xs text-gray-500">
              默认账号：admin / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;

import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/useAuthStore';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const success = login(username, password);
    if (success) {
      navigate('/admin/dashboard');
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="glass w-full max-w-sm rounded-2xl p-8"
      >
        <div className="text-center mb-8">
          <h1 className="text-2xl font-serif font-bold text-white tracking-wide">
            AR景区导览
          </h1>
          <div className="mt-2 h-0.5 w-12 mx-auto rounded-full bg-gradient-to-r from-transparent via-amber-600 to-transparent" />
          <p className="text-xs text-gray-500 mt-3">运营管理平台</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="用户名"
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/20 transition-colors"
            />
          </div>
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              className="w-full h-10 px-3 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-amber-600/50 focus:ring-1 focus:ring-amber-600/20 transition-colors"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 text-center">{error}</p>
          )}

          <button
            type="submit"
            className="w-full h-10 rounded-lg bg-gradient-to-r from-indigo-900 to-indigo-800 text-sm font-medium text-white hover:from-indigo-800 hover:to-indigo-700 transition-all duration-200 active:scale-[0.98]"
          >
            登录
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link
            to="/visitor/welcome/1"
            className="text-xs text-gray-500 hover:text-amber-600 transition-colors"
          >
            游客入口 →
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

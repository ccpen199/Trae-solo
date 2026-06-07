import { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Camera, Eye, EyeOff, Lock, User } from 'lucide-react';
import api from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { cn } from '@/lib/utils';
import type { User } from '@/types';

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore(s => s.login);
  const isAuth = useAuthStore(s => s.isAuthenticated);
  const navigate = useNavigate();

  useEffect(() => {
    document.title = '登录 - 云瞳视频监控';
  }, []);

  if (isAuth) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { username, password });
      if (res.data.success) {
        login(res.data.token, res.data.user as User);
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.data.error || '登录失败');
      }
    } catch (e: any) {
      setError(e.response?.data?.error || '网络错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-vms-bg via-vms-bg to-slate-900">
        <div className="absolute inset-0 bg-vms-grid bg-vms-grid opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="vms-card p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-vms-primary to-blue-700 flex items-center justify-center mb-4 shadow-vms-glow">
              <Camera className="w-9 h-9 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white font-mono tracking-widest">云 瞳</h1>
            <p className="text-sm text-vms-text-muted mt-1">视频监控管理平台</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vms-text-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="vms-input pl-10"
                  placeholder="请输入用户名"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm text-vms-text-muted">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-vms-text-muted" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="vms-input pl-10 pr-10"
                  placeholder="请输入密码"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-vms-text-muted hover:text-vms-text transition-colors"
                >
                  {showPwd ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !username || !password}
              className={cn(
                "w-full vms-btn-primary h-11 text-base font-semibold",
                loading && "opacity-70 cursor-wait"
              )}
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-vms-border text-center">
            <p className="text-xs text-vms-text-muted">
              默认账号：<span className="text-vms-primary font-mono">admin / admin123</span>
            </p>
            <p className="text-xs text-vms-text-muted mt-1">
              查看员：<span className="text-vms-primary font-mono">viewer / viewer123</span>
              ，访客：<span className="text-vms-primary font-mono">guest / guest123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

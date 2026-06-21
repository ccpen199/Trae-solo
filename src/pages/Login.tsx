import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/api.ts';
import { useAuthStore } from '@/store/auth.ts';
import type { UserRole } from '../../shared/types.js';
import { Droplets, GraduationCap, Building2, Shield, Eye, EyeOff } from 'lucide-react';

const roles: { value: UserRole; label: string; icon: JSX.Element; description: string; testAccount: string }[] = [
  { value: 'student', label: '学生用户', icon: <GraduationCap size={24} />, description: '用水、充值、查账单', testAccount: '2021001 / student123' },
  { value: 'investor', label: '投资商', icon: <Building2 size={24} />, description: '设备管理、收益结算', testAccount: 'investor / invest123' },
  { value: 'admin', label: '管理员', icon: <Shield size={24} />, description: '系统管理、数据监控', testAccount: 'admin / admin123' },
];

export default function Login() {
  const navigate = useNavigate();
  const { login, init, isAuthenticated, user } = useAuthStore();
  const [selectedRole, setSelectedRole] = useState<UserRole>('student');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    init();
  }, [init]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'student') navigate('/student');
      else if (user.role === 'investor') navigate('/investor');
      else if (user.role === 'admin') navigate('/admin');
    }
  }, [isAuthenticated, user, navigate]);

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    const acc = role === 'student' ? '2021001' : role === 'investor' ? 'investor' : 'admin';
    const pwd = role === 'student' ? 'student123' : role === 'investor' ? 'invest123' : 'admin123';
    setAccount(acc);
    setPassword(pwd);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password) {
      setError('请输入账号和密码');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const result = await authApi.login({ account, password, role: selectedRole });
      login(result.token, result.user);
    } catch (err: any) {
      setError(err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-water-texture-dark flex items-center justify-center p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-8 items-center">
        <div className="hidden lg:flex flex-col items-center justify-center text-white">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-aqua-400 to-deep-blue-600 flex items-center justify-center shadow-2xl animate-float">
              <Droplets size={56} className="text-white" strokeWidth={1.5} />
            </div>
            <div className="absolute inset-0 rounded-full bg-aqua-400/30 animate-ripple" />
            <div className="absolute inset-0 rounded-full bg-aqua-400/20 animate-ripple" style={{ animationDelay: '0.7s' }} />
          </div>
          <h1 className="text-4xl font-display font-bold mb-3 text-gradient-aqua text-center bg-gradient-to-r from-aqua-300 to-white bg-clip-text text-transparent">
            无感用水物联网平台
          </h1>
          <p className="text-aqua-100/80 text-center max-w-md leading-relaxed">
            NFC · 蓝牙 · 二维码 三模识别接入
            <br />
            支付宝/微信支付深度打通 · 校园一卡通实时同步
          </p>
        </div>

        <div className="glass-card-dark p-8 backdrop-blur-2xl">
          <h2 className="text-2xl font-display font-bold text-white mb-6">账号登录</h2>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {roles.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => handleRoleSelect(r.value)}
                className={`p-3 rounded-xl text-center transition-all duration-300 ${
                  selectedRole === r.value
                    ? 'bg-gradient-to-br from-aqua-500 to-deep-blue-600 text-white shadow-glow-aqua scale-105'
                    : 'bg-white/5 text-white/70 hover:bg-white/10 border border-white/10'
                }`}
              >
                <div className="flex justify-center mb-1.5">{r.icon}</div>
                <div className="text-xs font-medium">{r.label}</div>
              </button>
            ))}
          </div>

          <div className="mb-5 p-3 rounded-lg bg-white/5 border border-white/10">
            <p className="text-xs text-aqua-300/80">
              测试账号：{roles.find((r) => r.value === selectedRole)?.testAccount}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/70 mb-1.5">账号</label>
              <input
                type="text"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="请输入账号"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-aqua-400 focus:bg-white/15 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm text-white/70 mb-1.5">密码</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 focus:outline-none focus:border-aqua-400 focus:bg-white/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/80"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-vibrant-orange-500/20 border border-vibrant-orange-500/40 text-vibrant-orange-200 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-aqua-500 to-deep-blue-600 text-white font-semibold shadow-lg hover:shadow-glow-aqua hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            >
              {loading ? '登录中...' : '登 录'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

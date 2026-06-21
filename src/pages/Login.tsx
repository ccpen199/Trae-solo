import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Eye, EyeOff, User, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

const roles = [
  { value: 'admin', label: '超级管理员' },
  { value: 'store_manager', label: '门店店长' },
  { value: 'operator', label: '运营专员' },
  { value: 'maintenance', label: '运维人员' },
  { value: 'member', label: '会员用户' },
];

export default function Login() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [role, setRole] = useState('admin');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    await new Promise((resolve) => setTimeout(resolve, 800));

    if (username && password) {
      login(username, password, role);
      navigate('/dashboard');
    } else {
      setError('请输入用户名和密码');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 bg-grid flex items-center justify-center p-4 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyber-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-neon-purple/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-neon-green/5 rounded-full blur-3xl"></div>

      {/* 扫描线效果 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyber-500/5 to-transparent h-1/3 animate-scan"></div>
      </div>

      <div className="relative w-full max-w-md z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyber-400 via-cyber-500 to-neon-purple mb-4 shadow-lg shadow-cyber-500/30">
            <Gamepad2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-orbitron text-3xl font-bold text-white mb-2 tracking-wider">
            电竞空间运营平台
          </h1>
          <p className="text-dark-400 text-sm">
            ESPORTS SPACE OPERATION PLATFORM
          </p>
        </div>

        {/* 登录卡片 */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6 text-center">
            账号登录
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 角色选择 */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                登录角色
              </label>
              <div className="grid grid-cols-5 gap-2">
                {roles.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setRole(r.value)}
                    className={`px-2 py-2 text-xs rounded-lg border transition-all ${
                      role === r.value
                        ? 'bg-cyber-600/30 border-cyber-500 text-cyber-300'
                        : 'bg-dark-800 border-dark-700 text-dark-400 hover:border-dark-600'
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 用户名 */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                用户名
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full h-11 pl-10 pr-4 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500/50 transition-all"
                />
              </div>
            </div>

            {/* 密码 */}
            <div>
              <label className="block text-sm font-medium text-dark-300 mb-2">
                密码
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full h-11 pl-10 pr-12 bg-dark-800 border border-dark-700 rounded-lg text-white placeholder-dark-500 focus:outline-none focus:border-cyber-500 focus:ring-1 focus:ring-cyber-500/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* 记住密码 & 忘记密码 */}
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-cyber-500 focus:ring-cyber-500/50"
                />
                <span className="text-dark-400">记住密码</span>
              </label>
              <a href="#" className="text-cyber-400 hover:text-cyber-300">
                忘记密码？
              </a>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="p-3 rounded-lg bg-neon-red/10 border border-neon-red/30 text-neon-red text-sm">
                {error}
              </div>
            )}

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-gradient-to-r from-cyber-500 to-cyber-600 hover:from-cyber-400 hover:to-cyber-500 text-white font-medium rounded-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed btn-neon shadow-lg shadow-cyber-500/30 hover:shadow-cyber-500/50"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  登录中...
                </span>
              ) : (
                '登 录'
              )}
            </button>
          </form>

          {/* 底部提示 */}
          <div className="mt-6 text-center text-xs text-dark-500">
            <p>演示账号：任意用户名 + 任意密码即可登录</p>
          </div>
        </div>

        {/* 版权信息 */}
        <p className="text-center text-dark-600 text-xs mt-6">
          © 2024 网鱼电竞 · 数字化运营平台 · All Rights Reserved
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Shield, Landmark, Eye, EyeOff, ArrowRight, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, token } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      navigate('/', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const ok = await login(username.trim(), password);
      if (ok) {
        navigate('/', { replace: true });
      } else {
        setError('用户名或密码错误');
      }
    } catch {
      setError('登录失败，请稍后重试');
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
    <div className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 gov-gradient"></div>

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 w-64 h-64 border border-gold-400/10 rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 border border-gold-400/10 rounded-full"></div>
        <div className="absolute top-1/3 right-1/4 w-32 h-32 bg-gold-400/5 rounded-full"></div>
        <div className="absolute bottom-1/4 left-1/3 w-24 h-24 bg-gold-400/5 rounded-full"></div>

        <svg className="absolute inset-0 w-full h-full opacity-5" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 lg:grid-cols-2 rounded-3xl overflow-hidden shadow-2xl">
        <div className="hidden lg:flex flex-col justify-between p-10 lg:p-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-l-3xl">
          <div>
            <div className="flex items-center gap-3 mb-10">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shadow-xl">
                <Landmark className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="font-serif text-2xl font-bold text-white tracking-tight">
                  省级人社一体化
                </h1>
                <p className="text-gov-100/80 text-sm tracking-wider">
                  政务服务平台
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gold-400/15 text-gold-200 text-sm font-medium backdrop-blur-sm border border-gold-400/20">
                <Sparkles className="w-4 h-4" />
                安全 · 便捷 · 智能
              </div>

              <h2 className="font-serif text-4xl font-bold text-white leading-tight">
                让政务服务
                <br />
                <span className="bg-gradient-to-r from-gold-300 to-gold-500 bg-clip-text text-transparent">触手可及</span>
              </h2>

              <p className="text-gov-100/80 leading-relaxed max-w-sm">
                涵盖就业服务、社会保障、人事人才、劳动关系等全领域政务服务，一网通办，高效便民。
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="font-serif text-2xl font-bold text-gold-400">12333</p>
                <p className="text-xs text-gov-100/60 mt-1">服务热线</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="font-serif text-2xl font-bold text-gold-400">24h</p>
                <p className="text-xs text-gov-100/60 mt-1">全天服务</p>
              </div>
              <div className="text-center p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                <p className="font-serif text-2xl font-bold text-gold-400">98%</p>
                <p className="text-xs text-gov-100/60 mt-1">满意度</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-gov-100/50">
              <Shield className="w-4 h-4" />
              <span>基于国密算法加密 · 区块链存证 · 数据安全可追溯</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 lg:p-12 rounded-3xl lg:rounded-l-none shadow-xl lg:shadow-none">
          <div className="max-w-sm mx-auto w-full">
            <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gov-500 to-gov-700 flex items-center justify-center shadow-lg">
                <Landmark className="w-7 h-7 text-gold-400" />
              </div>
            </div>

            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-2">
              用户登录
            </h2>
            <p className="text-gray-500 text-sm mb-8">
              欢迎使用省级人社一体化政务服务平台
            </p>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  用户名
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className={cn(
                      'w-full pl-12 pr-4 py-3 rounded-xl border bg-gray-50 text-gray-800 placeholder-gray-400 outline-none transition-all duration-200',
                      error
                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/50'
                        : 'border-gray-200 focus:border-gov-500 focus:ring-2 focus:ring-gov-500/20 focus:bg-white'
                    )}
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
                    className={cn(
                      'w-full pl-12 pr-12 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 outline-none transition-all duration-200',
                      error
                        ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 bg-red-50/50'
                        : 'border-gray-200 focus:border-gov-500 focus:ring-2 focus:ring-gov-500/20 focus:bg-white'
                    )}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2.5 flex items-center gap-2 animate-fade-in-up">
                  <Shield className="w-4 h-4 text-red-500" />
                  {error}
                </div>
              )}

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-gov-600 focus:ring-gov-500"
                  />
                  <span>记住账号</span>
                </label>
                <Link to="#" className="text-gov-600 hover:text-gov-700 transition-colors font-medium">
                  忘记密码？
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  'w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300 flex items-center justify-center gap-2',
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'gov-btn'
                )}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    登录中...
                  </>
                ) : (
                  <>
                    登 录
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-xs text-gray-500 text-center mb-3">
                测试账号（点击快速登录）
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => fillAccount('user001', 'user123')}
                  className="px-4 py-2.5 rounded-xl text-sm text-gov-600 bg-gov-50 hover:bg-gov-100 transition-colors font-medium border border-gov-100"
                >
                  个人用户
                  <div className="text-xs text-gray-500 font-normal mt-0.5">
                    user001/user123
                  </div>
                </button>
                <button
                  onClick={() => fillAccount('admin', 'admin123')}
                  className="px-4 py-2.5 rounded-xl text-sm text-gold-700 bg-gold-50 hover:bg-gold-100 transition-colors font-medium border border-gold-100"
                >
                  管理员
                  <div className="text-xs text-gray-500 font-normal mt-0.5">
                    admin/admin123
                  </div>
                </button>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              登录即表示同意
              <Link to="#" className="text-gov-600 hover:underline mx-1">
                服务协议
              </Link>
              和
              <Link to="#" className="text-gov-600 hover:underline mx-1">
                隐私政策
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

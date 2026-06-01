import { useState, useEffect } from 'react';
import {
  Film,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Github,
  Chrome,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export default function LoginPage() {
  const [loginType, setLoginType] = useState<'account' | 'email' | 'phone'>('account');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [loginSuccess, setLoginSuccess] = useState(false);

  const { login, loading, error, setCurrentPage, setError } = useAppStore();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = () => {
    if (countdown > 0 || !phone) return;
    setCountdown(60);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const loginValue = loginType === 'account' ? username : loginType === 'email' ? email : phone;
    const passwordValue = loginType === 'phone' ? verifyCode : password;

    if (!loginValue || !passwordValue) {
      setError('请填写完整信息');
      return;
    }

    const success = await login(loginValue, passwordValue);
      if (success) {
        setLoginSuccess(true);
        setTimeout(() => {
          setCurrentPage('vip');
        }, 1500);
      }
  };

  const handleQuickLogin = async (type: string) => {
    const success = await login(type, 'quicklogin');
    if (success) {
      setLoginSuccess(true);
      setTimeout(() => {
        setCurrentPage('vip');
      }, 1500);
    }
  };

  if (loginSuccess) {
    return (
      <div className="min-h-screen bg-cinema-bg flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">登录成功</h2>
          <p className="text-slate-400">欢迎回来，正在跳转...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cinema-bg flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cinema%20interior%20with%20red%20seats%20and%20big%20screen%20dramatic%20lighting%20dark%20atmosphere&image_size=portrait_16_9)`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-cinema-red/60 via-cinema-bg/80 to-cinema-bg"></div>
        </div>
        <div className="relative z-10 flex flex-col justify-center p-16">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cinema-red to-red-700 flex items-center justify-center shadow-2xl shadow-cinema-red/30">
              <Film className="w-9 h-9 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white">电影派</h1>
              <p className="text-slate-300 mt-1">Cinema Plus</p>
            </div>
          </div>

          <h2 className="text-5xl font-bold text-white mb-6 leading-tight">
            沉浸式
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cinema-red to-yellow-500">
              光影之旅
            </span>
          </h2>

          <p className="text-slate-300 text-lg mb-12 max-w-md leading-relaxed">
            精选全球佳片，智能选座购票，会员专属权益。每一次观影，都是一场心灵的旅行。
          </p>

          <div className="grid grid-cols-3 gap-6">
            {[
              { value: '10M+', label: '注册用户' },
              { value: '5000+', label: '精选影片' },
              { value: '99.8%', label: '用户好评' },
            ].map((stat, index) => (
              <div key={index} className="animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-slate-400 text-sm">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cinema-red to-red-700 flex items-center justify-center">
              <Film className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">电影派</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">欢迎回来</h2>
            <p className="text-slate-400">登录您的账户，继续探索精彩电影世界</p>
          </div>

          <div className="flex bg-slate-800/50 rounded-xl p-1 mb-8">
            {[
              { key: 'account', label: '账号登录' },
              { key: 'email', label: '邮箱登录' },
              { key: 'phone', label: '手机登录' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => {
                  setLoginType(tab.key as any);
                  setError(null);
                }}
                className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  loginType === tab.key
                    ? 'bg-cinema-red text-white shadow-lg'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {loginType === 'account' && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">用户名</label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="请输入用户名"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red focus:ring-2 focus:ring-cinema-red/20 transition-all"
                  />
                </div>
              </div>
            )}

            {loginType === 'email' && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">邮箱地址</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="请输入邮箱地址"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red focus:ring-2 focus:ring-cinema-red/20 transition-all"
                  />
                </div>
              </div>
            )}

            {loginType === 'phone' && (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">手机号码</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">+86</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号码"
                    className="w-full pl-16 pr-4 py-3.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red focus:ring-2 focus:ring-cinema-red/20 transition-all"
                  />
                </div>
              </div>
            )}

            {loginType === 'phone' ? (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">验证码</label>
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={verifyCode}
                      onChange={(e) => setVerifyCode(e.target.value)}
                      placeholder="请输入验证码"
                      className="w-full px-4 py-3.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red focus:ring-2 focus:ring-cinema-red/20 transition-all"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSendCode}
                    disabled={countdown > 0}
                    className={`px-6 py-3.5 rounded-xl font-medium transition-all ${
                      countdown > 0
                        ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                        : 'bg-cinema-gold/20 text-cinema-gold hover:bg-cinema-gold/30'
                    }`}
                  >
                    {countdown > 0 ? `${countdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码"
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red focus:ring-2 focus:ring-cinema-red/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-cinema-red focus:ring-cinema-red focus:ring-offset-0"
                />
                <span className="text-slate-400 text-sm">记住我</span>
              </label>
              <button type="button" className="text-cinema-red text-sm hover:underline transition-colors">
                忘记密码?
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gradient-to-r from-cinema-red to-red-700 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-800 transition-all duration-300 shadow-lg shadow-cinema-red/30 hover:shadow-xl hover:shadow-cinema-red/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
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

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-4 bg-cinema-bg text-slate-500 text-sm">其他登录方式</span>
            </div>
          </div>

          <div className="flex justify-center gap-6">
            <button
              onClick={() => handleQuickLogin('wechat')}
              className="w-12 h-12 rounded-full bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110"
              title="微信登录"
            >
              <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">
                微
              </div>
            </button>
            <button
              onClick={() => handleQuickLogin('qq')}
              className="w-12 h-12 rounded-full bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110"
              title="QQ登录"
            >
              <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">
                Q
              </div>
            </button>
            <button
              onClick={() => handleQuickLogin('weibo')}
              className="w-12 h-12 rounded-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110"
              title="微博登录"
            >
              <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                微
              </div>
            </button>
            <button
              onClick={() => handleQuickLogin('github')}
              className="w-12 h-12 rounded-full bg-slate-500/10 hover:bg-slate-500/20 border border-slate-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110"
              title="GitHub登录"
            >
              <Github className="w-6 h-6 text-slate-400" />
            </button>
            <button
              onClick={() => handleQuickLogin('google')}
              className="w-12 h-12 rounded-full bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 flex items-center justify-center transition-all duration-300 hover:scale-110"
              title="Google登录"
            >
              <Chrome className="w-6 h-6 text-orange-400" />
            </button>
          </div>

          <p className="text-center text-slate-500 text-sm mt-8">
            还没有账户?{' '}
            <button 
              onClick={() => setCurrentPage('register')}
              className="text-cinema-red font-medium hover:underline transition-colors"
            >
              立即注册
            </button>
          </p>

          <p className="text-center text-slate-600 text-xs mt-6">
            登录即表示您同意{' '}
            <button className="text-slate-500 hover:text-slate-300 transition-colors">用户协议</button>
            {' '}和{' '}
            <button className="text-slate-500 hover:text-slate-300 transition-colors">隐私政策</button>
          </p>
        </div>
      </div>
    </div>
  );
}

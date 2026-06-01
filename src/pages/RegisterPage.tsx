import { useState } from 'react';
import {
  Film,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';

export default function RegisterPage() {
  const [step, setStep] = useState(1);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const { register, loading, error, setCurrentPage, setError } = useAppStore();

  const handleSendCode = () => {
    if (countdown > 0 || !phone) return;
    setCountdown(60);
  };

  const handleSubmitStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username || !password || !confirmPassword) {
      setError('请填写完整信息');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    setStep(2);
  };

  const handleSubmitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email || !phone || !verifyCode) {
      setError('请填写完整信息');
      return;
    }

    const success = await register({
      username,
      password,
      email,
      phone,
    });

    if (success) {
      setRegisterSuccess(true);
      setTimeout(() => {
        setCurrentPage('vip');
      }, 2000);
    }
  };

  if (registerSuccess) {
    return (
      <div className="min-h-screen bg-cinema-bg flex items-center justify-center p-4">
        <div className="text-center animate-fade-in">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg shadow-green-500/30">
            <CheckCircle2 className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">注册成功</h2>
          <p className="text-slate-400">欢迎加入电影派，正在跳转...</p>
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
            开启您的
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cinema-red to-yellow-500">
              光影之旅
            </span>
          </h2>

          <p className="text-slate-300 text-lg mb-12 max-w-md leading-relaxed">
            注册成为会员，享受专属观影权益、智能推荐服务和精彩社区互动。
          </p>

          <div className="space-y-4">
            {[
              { icon: '🎬', title: '海量影片', desc: '5000+精选电影任您选择' },
              { icon: '🎟️', title: '智能选座', desc: 'AI推荐最佳观影位置' },
              { icon: '👑', title: 'VIP权益', desc: '专属折扣和优先购票' },
              { icon: '💬', title: '影迷社区', desc: '与同好分享观影心得' },
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-4 animate-fade-in" style={{ animationDelay: `${index * 100}ms` }}>
                <span className="text-2xl">{item.icon}</span>
                <div>
                  <p className="text-white font-medium">{item.title}</p>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
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
            <h2 className="text-3xl font-bold text-white mb-2">注册新账户</h2>
            <p className="text-slate-400">加入我们，开启精彩观影之旅</p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-8">
            {[1, 2].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                    step >= s
                      ? 'bg-cinema-red text-white'
                      : 'bg-slate-700 text-slate-500'
                  }`}
                >
                  {step > s ? <CheckCircle2 className="w-5 h-5" /> : s}
                </div>
                {s < 2 && (
                  <div
                    className={`w-16 h-1 mx-2 rounded-full transition-all ${
                      step > s ? 'bg-cinema-red' : 'bg-slate-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {step === 1 ? (
            <form onSubmit={handleSubmitStep1} className="space-y-5">
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

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="请输入密码（至少6位）"
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

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">确认密码</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="请再次输入密码"
                    className="w-full pl-12 pr-12 py-3.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red focus:ring-2 focus:ring-cinema-red/20 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-gradient-to-r from-cinema-red to-red-700 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-800 transition-all duration-300 shadow-lg shadow-cinema-red/30 hover:shadow-xl hover:shadow-cinema-red/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    处理中...
                  </>
                ) : (
                  <>
                    下一步
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmitStep2} className="space-y-5">
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

              <div>
                <label className="block text-slate-300 text-sm font-medium mb-2">手机号码</label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="请输入手机号码"
                    className="w-full pl-12 pr-4 py-3.5 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cinema-red focus:ring-2 focus:ring-cinema-red/20 transition-all"
                  />
                </div>
              </div>

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

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm text-center">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3.5 bg-slate-700 text-white font-semibold rounded-xl hover:bg-slate-600 transition-all"
                >
                  返回上一步
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3.5 bg-gradient-to-r from-cinema-red to-red-700 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-800 transition-all duration-300 shadow-lg shadow-cinema-red/30 hover:shadow-xl hover:shadow-cinema-red/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      注册中...
                    </>
                  ) : (
                    <>
                      完成注册
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-slate-500 text-sm mt-8">
            已有账户?{' '}
            <button
              onClick={() => setCurrentPage('login')}
              className="text-cinema-red font-medium hover:underline transition-colors"
            >
              立即登录
            </button>
          </p>

          <p className="text-center text-slate-600 text-xs mt-6">
            注册即表示您同意{' '}
            <button className="text-slate-500 hover:text-slate-300 transition-colors">用户协议</button>
            {' '}和{' '}
            <button className="text-slate-500 hover:text-slate-300 transition-colors">隐私政策</button>
          </p>
        </div>
      </div>
    </div>
  );
}

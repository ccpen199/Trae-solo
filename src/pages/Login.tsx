import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, UserPlus, LogIn, Sparkles, Video, Briefcase, Shield, Crown, Zap, Palette, Code, Star } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import Button from '../components/Button';

type TabType = 'login' | 'register';
type RoleType = 'user' | 'creator' | 'admin';

interface FormErrors {
  username?: string;
  password?: string;
  confirmPassword?: string;
}

const floatingIcons = [
  { icon: Video, delay: '0s', x: '10%', y: '20%' },
  { icon: Palette, delay: '2s', x: '80%', y: '15%' },
  { icon: Code, delay: '4s', x: '15%', y: '70%' },
  { icon: Zap, delay: '6s', x: '75%', y: '65%' },
  { icon: Sparkles, delay: '3s', x: '50%', y: '40%' },
];

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isLoading, error, isAuthenticated, clearError } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [role, setRole] = useState<RoleType>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isAnimating, setIsAnimating] = useState(false);

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/';
  const registerTab = new URLSearchParams(location.search).get('tab') === 'register';

  useEffect(() => {
    if (registerTab) {
      setActiveTab('register');
    }
  }, [registerTab]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!username.trim()) {
      newErrors.username = '请输入用户名';
    } else if (username.length < 3) {
      newErrors.username = '用户名至少3个字符';
    }

    if (!password) {
      newErrors.password = '请输入密码';
    } else if (password.length < 6) {
      newErrors.password = '密码至少6个字符';
    }

    if (activeTab === 'register') {
      if (!confirmPassword) {
        newErrors.confirmPassword = '请确认密码';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = '两次密码输入不一致';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      if (activeTab === 'login') {
        await login(username, password);
      } else {
        await register(username, password, role);
      }
    } catch {
      // Error handled in store
    }
  };

  const switchTab = (tab: TabType) => {
    if (tab === activeTab) return;
    setIsAnimating(true);
    setErrors({});
    setTimeout(() => {
      setActiveTab(tab);
      setIsAnimating(false);
    }, 150);
  };

  const roleOptions = [
    {
      value: 'user' as RoleType,
      label: '学习者',
      desc: '学习课程、购买服务',
      icon: User,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
    },
    {
      value: 'creator' as RoleType,
      label: '创作者',
      desc: '发布课程、提供服务',
      icon: Crown,
      color: 'text-primary-500',
      bgColor: 'bg-primary-50',
      borderColor: 'border-primary-500',
    },
  ];

  const quickLoginAccounts = [
    { label: '管理员', username: 'admin', password: '123456', role: '管理员' },
    { label: '创作者', username: '林舞蹈家', password: '123456', role: '创作者' },
    { label: '学习者', username: '用户1', password: '123456', role: '普通用户' },
  ];

  const handleQuickLogin = async (user: typeof quickLoginAccounts[0]) => {
    setUsername(user.username);
    setPassword(user.password);
    try {
      await login(user.username, user.password);
    } catch {
      // handled in store
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/5 opacity-50" />
        
        {floatingIcons.map((item, index) => (
          <div
            key={index}
            className="absolute animate-float"
            style={{
              left: item.x,
              top: item.y,
              animationDelay: item.delay,
            }}
          >
            <item.icon className="w-8 h-8 text-white/20" />
          </div>
        ))}

        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12">
          <div className="animate-fade-in">
            <Link to="/" className="flex items-center gap-3 mb-8">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <span className="font-display text-4xl font-bold text-white">SkillVerse</span>
            </Link>
            
            <h1 className="font-display text-5xl font-bold text-white mb-6 leading-tight">
              让每个人的技能<br />
              <span className="text-accent-300">都能创造价值</span>
            </h1>
            <p className="text-white/70 text-lg max-w-md leading-relaxed mb-12">
              连接全球顶尖创作者与学习者，在技能即服务的时代，开启你的知识变现之旅。
            </p>

            <div className="space-y-4 mb-12">
              {[
                { icon: Video, title: '短视频课程', desc: '系统化学习，碎片化时间' },
                { icon: Briefcase, title: '定制服务', desc: '一对一专属技能服务' },
                { icon: Shield, title: '平台保障', desc: '资金托管·履约留痕·争议仲裁' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4 text-white/90 animate-fade-in-up animate-stagger-1 opacity-0" style={{ animationFillMode: 'forwards' }}>
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-medium">{item.title}</div>
                    <div className="text-sm text-white/60">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-6">
              {[
                { number: '500+', label: '优质课程' },
                { number: '50+', label: '认证创作者' },
                { number: '1000+', label: '活跃用户' },
              ].map((stat, i) => (
                <div key={i} className="animate-fade-in-up animate-stagger-2 opacity-0" style={{ animationFillMode: 'forwards' }}>
                  <div className="text-3xl font-bold text-white">{stat.number}</div>
                  <div className="text-white/50 text-sm">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-gradient-to-br from-zinc-50 to-white">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-2xl font-bold text-zinc-900">SkillVerse</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl p-8 animate-fade-in-up">
            <div className="flex bg-zinc-100 rounded-2xl p-1 mb-6">
              <button
                onClick={() => switchTab('login')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-300',
                  activeTab === 'login'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                )}
              >
                <LogIn className="w-4 h-4" />
                登录
              </button>
              <button
                onClick={() => switchTab('register')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-all duration-300',
                  activeTab === 'register'
                    ? 'bg-white text-primary-600 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700'
                )}
              >
                <UserPlus className="w-4 h-4" />
                注册
              </button>
            </div>

            {activeTab === 'register' && (
              <div className="mb-6 animate-fade-in">
                <label className="block text-sm font-medium text-zinc-700 mb-3">
                  选择身份
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all duration-200 text-left',
                        role === opt.value
                          ? `${opt.borderColor} ${opt.bgColor}`
                          : 'border-zinc-200 hover:border-zinc-300'
                      )}
                    >
                      <opt.icon
                        className={cn(
                          'w-6 h-6 mb-2',
                          role === opt.value ? opt.color : 'text-zinc-400'
                        )}
                      />
                      <div
                        className={cn(
                          'font-medium',
                          role === opt.value ? 'text-primary-700' : 'text-zinc-700'
                        )}
                      >
                        {opt.label}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm animate-fade-in">
                {error}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className={cn(
                'transition-all duration-300',
                isAnimating && 'opacity-0 translate-x-4'
              )}
            >
              <div className="space-y-4">
                <div className="animate-fade-in">
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    用户名
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => {
                        setUsername(e.target.value);
                        if (errors.username) setErrors({ ...errors, username: undefined });
                      }}
                      placeholder="请输入用户名"
                      className={cn(
                        'input-field pl-12',
                        errors.username && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                      )}
                    />
                  </div>
                  {errors.username && (
                    <p className="mt-2 text-sm text-red-500">{errors.username}</p>
                  )}
                </div>

                <div className="animate-fade-in animate-stagger-1 opacity-0" style={{ animationFillMode: 'forwards' }}>
                  <label className="block text-sm font-medium text-zinc-700 mb-2">
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password) setErrors({ ...errors, password: undefined });
                      }}
                      placeholder="请输入密码"
                      className={cn(
                        'input-field pl-12 pr-12',
                        errors.password && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-2 text-sm text-red-500">{errors.password}</p>
                  )}
                </div>

                {activeTab === 'register' && (
                  <div className="animate-fade-in animate-stagger-2 opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <label className="block text-sm font-medium text-zinc-700 mb-2">
                      确认密码
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                        }}
                        placeholder="请再次输入密码"
                        className={cn(
                          'input-field pl-12',
                          errors.confirmPassword && 'border-red-300 focus:ring-red-500/30 focus:border-red-500'
                        )}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-2 text-sm text-red-500">{errors.confirmPassword}</p>
                    )}
                  </div>
                )}

                {activeTab === 'login' && (
                  <div className="flex justify-end animate-fade-in animate-stagger-2 opacity-0" style={{ animationFillMode: 'forwards' }}>
                    <button type="button" className="text-sm text-primary-600 hover:text-primary-700">
                      忘记密码？
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  isLoading={isLoading}
                  className="w-full py-3.5 text-base animate-fade-in animate-stagger-3"
                  style={{ animationFillMode: 'forwards' }}
                >
                  {activeTab === 'login' ? '登录' : '注册'}
                </Button>
              </div>
            </form>

            {activeTab === 'login' && (
              <div className="mt-6 pt-6 border-t border-zinc-100">
                <p className="text-center text-sm text-zinc-500 mb-4">快速登录体验</p>
                <div className="grid grid-cols-3 gap-2">
                  {quickLoginAccounts.map((account, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickLogin(account)}
                      className="p-3 rounded-xl bg-zinc-50 hover:bg-primary-50 hover:text-primary-600 transition-colors text-center"
                    >
                      <div className="text-xs font-medium text-zinc-700 mb-1">{account.label}</div>
                      <div className="text-xs text-zinc-400">{account.role}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-zinc-100">
              <p className="text-center text-sm text-zinc-500">
                {activeTab === 'login' ? '还没有账号？' : '已有账号？'}
                <button
                  onClick={() => switchTab(activeTab === 'login' ? 'register' : 'login')}
                  className="ml-1 text-primary-600 hover:text-primary-700 font-medium"
                >
                  {activeTab === 'login' ? '立即注册' : '立即登录'}
                </button>
              </p>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-zinc-400">
            登录即表示同意
            <a href="#" className="text-zinc-500 hover:text-primary-600 mx-1">用户协议</a>
            和
            <a href="#" className="text-zinc-500 hover:text-primary-600 mx-1">隐私政策</a>
          </div>
        </div>
      </div>
    </div>
  );
}

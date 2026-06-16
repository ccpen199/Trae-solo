import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, User, Lock, UserPlus, LogIn, Sparkles, Video, Briefcase, Shield, Crown, Zap, Palette, Code } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { cn } from '../lib/utils';
import Button from '../components/Button';

type TabType = 'login' | 'register';
type RoleType = 'user' | 'creator' | 'admin' | 'requester';

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
  const { login, register, isLoading, error, isAuthenticated, clearError, user } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('login');
  const [role, setRole] = useState<RoleType>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isAnimating, setIsAnimating] = useState(false);
  const [quickLoginLoading, setQuickLoginLoading] = useState<string | null>(null);

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '';
  const registerTab = new URLSearchParams(location.search).get('tab') === 'register';

  const getDefaultRedirect = (userRole: string): string => {
    switch (userRole) {
      case 'creator':
        return '/workspace';
      case 'requester':
        return '/orders';
      case 'admin':
        return '/admin';
      case 'user':
      default:
        return '/feed';
    }
  };

  useEffect(() => {
    if (registerTab) {
      setActiveTab('register');
    }
  }, [registerTab]);

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectTo = from && from !== '/' ? from : getDefaultRedirect(user.role);
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, user, navigate, from]);

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
      desc: '学习课程、提升技能',
      icon: User,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      ringColor: 'ring-blue-500/30',
      suitableFor: ['想学习新技能的职场人', '兴趣爱好者', '学生群体'],
    },
    {
      value: 'creator' as RoleType,
      label: '创作者',
      desc: '发布课程、变现技能',
      icon: Crown,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
      ringColor: 'ring-purple-500/30',
      suitableFor: ['有专业技能的达人', '知识付费创作者', '行业专家讲师'],
    },
    {
      value: 'requester' as RoleType,
      label: '需求方',
      desc: '发布需求、定制服务',
      icon: Briefcase,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-500',
      ringColor: 'ring-orange-500/30',
      suitableFor: ['企业采购方', '项目团队', '有定制需求的个人'],
    },
  ];

  const quickLoginAccounts = [
    { label: '管理员', username: 'admin', password: '123456', role: '管理员', icon: Shield, color: 'text-red-500', bgColor: 'bg-red-50' },
    { label: '创作者', username: '林舞蹈家', password: '123456', role: '创作者', icon: Crown, color: 'text-purple-500', bgColor: 'bg-purple-50' },
    { label: '需求方', username: '需求方小王', password: '123456', role: '需求方', icon: Briefcase, color: 'text-orange-500', bgColor: 'bg-orange-50' },
    { label: '学习者', username: '用户1', password: '123456', role: '学习者', icon: User, color: 'text-blue-500', bgColor: 'bg-blue-50' },
  ];

  const handleQuickLogin = async (user: typeof quickLoginAccounts[0]) => {
    setUsername(user.username);
    setPassword(user.password);
    setQuickLoginLoading(user.username);
    try {
      await login(user.username, user.password);
    } catch {
      // handled in store
    } finally {
      setQuickLoginLoading(null);
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
                  选择你的身份
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRole(opt.value)}
                      className={cn(
                        'p-4 rounded-xl border-2 transition-all duration-200 text-left relative',
                        role === opt.value
                          ? `${opt.borderColor} ${opt.bgColor} ring-2 ${opt.ringColor} sm:scale-[1.02] shadow-md`
                          : 'border-zinc-200 hover:border-zinc-300 hover:bg-zinc-50'
                      )}
                    >
                      {role === opt.value && (
                        <div className={cn('absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center', opt.bgColor)}>
                          <svg className={cn('w-3 h-3', opt.color)} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                        role === opt.value ? opt.bgColor : 'bg-zinc-100'
                      )}>
                        <opt.icon
                          className={cn(
                            'w-5 h-5',
                            role === opt.value ? opt.color : 'text-zinc-400'
                          )}
                        />
                      </div>
                      <div
                        className={cn(
                          'font-semibold text-base',
                          role === opt.value ? opt.color : 'text-zinc-700'
                        )}
                      >
                        {opt.label}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1 mb-3">{opt.desc}</div>
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-zinc-500">适合人群</div>
                        {opt.suitableFor.map((item, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            <span className={cn('w-1 h-1 rounded-full flex-shrink-0', role === opt.value ? opt.color : 'bg-zinc-300')} />
                            <span className="text-xs text-zinc-500 truncate">{item}</span>
                          </div>
                        ))}
                      </div>
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

                <p className="mt-4 text-center text-xs text-zinc-400">
                  登录即代表您同意
                  <a href="#" className="text-zinc-500 hover:text-primary-600 mx-0.5">《用户服务协议》</a>
                  和
                  <a href="#" className="text-zinc-500 hover:text-primary-600 mx-0.5">《隐私政策》</a>
                </p>
              </div>
            </form>

            {activeTab === 'login' && (
              <div className="mt-6 pt-6 border-t border-zinc-100">
                <p className="text-center text-sm text-zinc-500 mb-4">快速登录体验</p>
                <div className="grid grid-cols-2 gap-3">
                  {quickLoginAccounts.map((account, i) => (
                    <button
                      key={i}
                      onClick={() => handleQuickLogin(account)}
                      disabled={quickLoginLoading !== null}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-2xl border-2 transition-all duration-200 text-left',
                        quickLoginLoading === account.username
                          ? `${account.color.replace('text-', 'border-')} ${account.bgColor}`
                          : 'border-zinc-100 bg-zinc-50 hover:border-zinc-200 hover:bg-white hover:shadow-sm'
                      )}
                    >
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        account.bgColor
                      )}>
                        {quickLoginLoading === account.username ? (
                          <svg className={cn('w-5 h-5 animate-spin', account.color)} fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                        ) : (
                          <account.icon className={cn('w-5 h-5', account.color)} />
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-sm text-zinc-800">{account.label}</div>
                        <div className="text-xs text-zinc-500">{account.role}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-center">
                  <p className="text-xs text-zinc-400">
                    <span className="inline-flex items-center gap-1">
                      <Shield className="w-3 h-3" />
                      平台管理员请使用 admin 账号登录，进入管理后台
                    </span>
                  </p>
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
        </div>
      </div>
    </div>
  );
}
